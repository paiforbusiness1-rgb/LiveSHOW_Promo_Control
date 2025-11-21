import { Registration, RegistrationStatus } from '../types';
import { notificationService } from './notificationService';
import { getDb } from './firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  runTransaction,
  onSnapshot,
  Timestamp,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';

// Helper function para obtener db de forma segura
const getFirestoreDb = () => {
  const dbInstance = getDb();
  if (!dbInstance) {
    console.warn('⚠️ [databaseService] Firestore no disponible');
  }
  return dbInstance;
};

/**
 * FIREBASE FIRESTORE SERVICE
 * Persistencia real con Firestore para control de acceso
 */

const REGISTRATIONS_COLLECTION = 'registrations';

// Mapear datos de Firestore a Registration
const mapFirestoreToRegistration = (docData: DocumentData, docId: string): Registration => {
  const data = docData;
  
  // Construir el nombre completo si solo hay firstName y lastName
  const fullName = data.name || 
    (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}`.trim() : '') ||
    data.firstName || 
    data.lastName || 
    '';
  
  // Determinar ticketType con lógica flexible
  let ticketType: 'VIP' | 'GENERAL' | 'PROMO' = 'GENERAL';
  if (data.ticketType) {
    const type = String(data.ticketType).toUpperCase();
    if (type === 'VIP' || type === 'PROMO') {
      ticketType = type as 'VIP' | 'PROMO';
    } else {
      ticketType = 'GENERAL';
    }
  } else {
    // Si no existe ticketType, asignar GENERAL por defecto
    ticketType = 'GENERAL';
  }
  
  // Determinar status con lógica flexible
  let status: RegistrationStatus = RegistrationStatus.PENDING;
  if (data.status) {
    const statusStr = String(data.status).toUpperCase();
    if (statusStr === 'VALIDATED' || statusStr === 'CANCELLED') {
      status = statusStr as RegistrationStatus;
    } else {
      status = RegistrationStatus.PENDING;
    }
  } else {
    // Si no existe status, asumir PENDING (no validado aún)
    status = RegistrationStatus.PENDING;
  }
  
  // Determinar qrCodeValue - usar ID del documento si no existe campo específico
  const qrCodeValue = data.qrCodeValue || data.qrCode || data.qrCodeDataUrl?.substring(0, 50) || docId;
  
  return {
    id: docId,
    name: fullName,
    email: data.email || '',
    ticketType,
    status,
    validationTime: data.validationTime?.toDate?.()?.toISOString() || data.validationTime || undefined,
    validatedBy: data.validatedBy || undefined,
    qrCodeValue
  };
};

// Mapear Registration a formato Firestore
const mapRegistrationToFirestore = (registration: Partial<Registration>) => {
  const data: any = {
    name: registration.name,
    email: registration.email,
    ticketType: registration.ticketType,
    status: registration.status,
    qrCodeValue: registration.qrCodeValue
  };

  if (registration.validationTime) {
    data.validationTime = Timestamp.fromDate(new Date(registration.validationTime));
  }

  if (registration.validatedBy) {
    data.validatedBy = registration.validatedBy;
  }

  return data;
};

let realtimeUnsubscribe: (() => void) | null = null;

export const dbService = {
  /**
   * Inicializar el servicio
   */
  init: () => {
    const dbInstance = getFirestoreDb();
    if (!dbInstance) {
      console.warn('⚠️ [dbService] Firebase no está configurado - Modo DEMO activado');
      return;
    }
    console.log('✅ [dbService] Firestore inicializado');
  },

  /**
   * Obtener todos los registros
   */
  getAllRegistrations: async (): Promise<Registration[]> => {
    try {
      const dbInstance = getFirestoreDb();
      
      if (!dbInstance) {
        console.warn('⚠️ [getAllRegistrations] Firebase no configurado - Modo DEMO');
        notificationService.notify('warning', 'Modo DEMO', 'Firebase no está configurado. Los datos son de demostración.');
        return [];
      }
      
      console.log('🔄 [getAllRegistrations] Creando referencia a colección:', REGISTRATIONS_COLLECTION);
      const registrationsRef = collection(dbInstance, REGISTRATIONS_COLLECTION);
      console.log('✅ [getAllRegistrations] Referencia creada:', registrationsRef);
      
      console.log('🔄 [getAllRegistrations] Obteniendo documentos...');
      const snapshot = await getDocs(registrationsRef);
      console.log('✅ [getAllRegistrations] Documentos obtenidos:', snapshot.size);
      
      return snapshot.docs.map(doc => 
        mapFirestoreToRegistration(doc.data(), doc.id)
      );
    } catch (error) {
      console.error('Error obteniendo registros:', error);
      notificationService.notify('error', 'Error de Conexión', 'No se pudieron cargar los registros.');
      return [];
    }
  },

  /**
   * Validar un registro usando transacción para evitar duplicados
   * Esta es la función crítica que garantiza consistencia
   */
  validateRegistration: async (
    qrCode: string, 
    operatorName: string
  ): Promise<{ success: boolean; message: string; registration?: Registration }> => {
    const dbInstance = getFirestoreDb();
    
    if (!dbInstance) {
      notificationService.notify('warning', 'Modo DEMO', 'Firebase no está configurado. La validación es simulada.');
      // Simular validación en modo demo
      return {
        success: false,
        message: 'Modo DEMO: Configura Firebase para validaciones reales.'
      };
    }
    
    try {
      const registrationsRef = collection(dbInstance, REGISTRATIONS_COLLECTION);
      let docRef: any;
      let docSnap: any;
      
      // Limpiar el código QR (eliminar espacios, convertir a string)
      let cleanQRCode = String(qrCode).trim();
      console.log('🔍 [validateRegistration] Código QR escaneado (primeros 100 chars):', cleanQRCode.substring(0, 100));
      
      // Extraer email del contenido del QR si es un texto formateado
      // El QR de pre-registro contiene: "Email: usuario@email.com"
      const emailMatch = cleanQRCode.match(/Email:\s*([^\n\r]+)/i);
      if (emailMatch && emailMatch[1]) {
        const extractedEmail = emailMatch[1].trim();
        console.log('📧 [validateRegistration] Email extraído del QR:', extractedEmail);
        // Usar el email para buscar
        cleanQRCode = extractedEmail;
      }
      
      // Intentar buscar por ID del documento primero (si el QR contiene el ID)
      try {
        docRef = doc(dbInstance, REGISTRATIONS_COLLECTION, cleanQRCode);
        docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          console.log('✅ [validateRegistration] Encontrado por ID del documento');
        } else {
          // Si no existe por ID, buscar por qrCodeValue
          const q = query(registrationsRef, where('qrCodeValue', '==', cleanQRCode));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            console.log('✅ [validateRegistration] Encontrado por qrCodeValue');
            docRef = querySnapshot.docs[0].ref;
            docSnap = querySnapshot.docs[0];
          } else {
            // Intentar buscar por qrCode (campo alternativo)
            const q2 = query(registrationsRef, where('qrCode', '==', cleanQRCode));
            const querySnapshot2 = await getDocs(q2);
            
            if (!querySnapshot2.empty) {
              console.log('✅ [validateRegistration] Encontrado por qrCode');
              docRef = querySnapshot2.docs[0].ref;
              docSnap = querySnapshot2.docs[0];
            } else {
              // Buscar por email (muy importante: el QR contiene el email)
              const q3 = query(registrationsRef, where('email', '==', cleanQRCode));
              const querySnapshot3 = await getDocs(q3);
              
              if (!querySnapshot3.empty) {
                console.log('✅ [validateRegistration] Encontrado por email');
                docRef = querySnapshot3.docs[0].ref;
                docSnap = querySnapshot3.docs[0];
              } else {
              // Búsqueda exhaustiva: buscar en todos los documentos
              console.log('🔍 [validateRegistration] Búsqueda indexada falló, buscando en todos los documentos...');
              const allDocs = await getDocs(registrationsRef);
              
              let foundDoc: any = null;
              for (const docItem of allDocs.docs) {
                const docData = docItem.data();
                const docId = docItem.id;
                
                // Verificar si el QR coincide con:
                // 1. ID del documento
                // 2. qrCodeValue
                // 3. qrCode
                // 4. email (MUY IMPORTANTE: el QR contiene el email)
                // 5. email en minúsculas (comparación case-insensitive)
                // 6. Parte del qrCodeDataUrl
                // 7. Contenido completo del QR (por si el documento tiene el texto completo)
                const docEmail = String(docData.email || '').toLowerCase().trim();
                const searchValue = cleanQRCode.toLowerCase().trim();
                
                if (
                  docId === cleanQRCode ||
                  docData.qrCodeValue === cleanQRCode ||
                  docData.qrCode === cleanQRCode ||
                  docEmail === searchValue ||
                  docData.email === cleanQRCode ||
                  (docData.qrCodeDataUrl && String(docData.qrCodeDataUrl).includes(cleanQRCode)) ||
                  (docData.qrContent && String(docData.qrContent).includes(cleanQRCode))
                ) {
                  foundDoc = { ref: docItem.ref, snap: docItem };
                  console.log('✅ [validateRegistration] Encontrado en búsqueda exhaustiva por:', 
                    docId === cleanQRCode ? 'ID' :
                    docData.qrCodeValue === cleanQRCode ? 'qrCodeValue' :
                    docData.qrCode === cleanQRCode ? 'qrCode' :
                    docEmail === searchValue || docData.email === cleanQRCode ? 'email' :
                    'otro campo'
                  );
                  break;
                }
              }
              
              if (foundDoc) {
                docRef = foundDoc.ref;
                docSnap = foundDoc.snap;
              } else {
                console.error('❌ [validateRegistration] Código QR no encontrado:', cleanQRCode);
                console.log('📋 [validateRegistration] Total de documentos en la colección:', allDocs.size);
                notificationService.notify('error', 'Código Inválido', `El código "${cleanQRCode.substring(0, 20)}..." no existe en la base de datos.`);
                return { success: false, message: `Código QR no encontrado en la base de datos. Código escaneado: ${cleanQRCode.substring(0, 30)}...` };
              }
            }
          }
        }
      } catch (error: any) {
        console.error('❌ [validateRegistration] Error en búsqueda:', error);
        
        // Si falla la búsqueda indexada, intentar búsqueda exhaustiva como último recurso
        try {
          console.log('🔄 [validateRegistration] Intentando búsqueda exhaustiva como último recurso...');
          const allDocs = await getDocs(registrationsRef);
          
          let foundDoc: any = null;
          for (const docItem of allDocs.docs) {
            const docData = docItem.data();
            const docId = docItem.id;
            const docEmail = String(docData.email || '').toLowerCase().trim();
            const searchValue = cleanQRCode.toLowerCase().trim();
            
            if (
              docId === cleanQRCode ||
              docData.qrCodeValue === cleanQRCode ||
              docData.qrCode === cleanQRCode ||
              docEmail === searchValue ||
              docData.email === cleanQRCode
            ) {
              foundDoc = { ref: docItem.ref, snap: docItem };
              console.log('✅ [validateRegistration] Encontrado en búsqueda exhaustiva de emergencia');
              docRef = foundDoc.ref;
              docSnap = foundDoc.snap;
              break;
            }
          }
          
          if (!foundDoc) {
            notificationService.notify('error', 'Error de Búsqueda', `Error al buscar el código: ${error.message}`);
            return { success: false, message: `Error al buscar el código QR: ${error.message}` };
          }
        } catch (exhaustiveError: any) {
          console.error('❌ [validateRegistration] Error en búsqueda exhaustiva:', exhaustiveError);
          notificationService.notify('error', 'Error de Búsqueda', `Error al buscar el código: ${error.message}`);
          return { success: false, message: `Error al buscar el código QR: ${error.message}` };
        }
      }

      // Usar transacción para garantizar consistencia
      const result = await runTransaction(dbInstance, async (transaction) => {
        const docSnap = await transaction.get(docRef);

        if (!docSnap.exists()) {
          throw new Error('Documento no encontrado');
        }

        const data = docSnap.data();
        
        // Obtener status con valores por defecto si no existe
        let currentStatus: RegistrationStatus = RegistrationStatus.PENDING;
        if (data.status) {
          const statusStr = String(data.status).toUpperCase();
          if (statusStr === 'VALIDATED' || statusStr === 'CANCELLED') {
            currentStatus = statusStr as RegistrationStatus;
          }
        }

        // Verificar si ya está validado
        if (currentStatus === RegistrationStatus.VALIDATED) {
          const existingRecord = mapFirestoreToRegistration(data, docSnap.id);
          notificationService.notify(
            'warning', 
            'Ya Validado', 
            `${existingRecord.name} ya ingresó a las ${new Date(existingRecord.validationTime || '').toLocaleTimeString()}`
          );
          
          return {
            success: false,
            message: `¡Atención! Código ya validado por ${data.validatedBy || 'Desconocido'} a las ${new Date(data.validationTime?.toDate?.() || data.validationTime || '').toLocaleTimeString()}.`,
            registration: existingRecord
          };
        }

        // Verificar si está cancelado
        if (currentStatus === RegistrationStatus.CANCELLED) {
          const cancelledRecord = mapFirestoreToRegistration(data, docSnap.id);
          notificationService.notify('error', 'Acceso Denegado', `Ticket CANCELADO: ${cancelledRecord.name}`);
          return {
            success: false,
            message: 'REGISTRO CANCELADO.',
            registration: cancelledRecord
          };
        }

        // Actualizar el documento con la validación
        // También agregar ticketType si no existe (por defecto GENERAL)
        const existingTicketType = data.ticketType || 'GENERAL';
        const updateData: any = {
          status: RegistrationStatus.VALIDATED,
          validationTime: Timestamp.now(),
          validatedBy: operatorName
        };
        
        // Solo agregar ticketType si no existe
        if (!data.ticketType) {
          updateData.ticketType = 'GENERAL';
        }
        
        // Agregar qrCodeValue si no existe (usar ID del documento)
        if (!data.qrCodeValue && !data.qrCode) {
          updateData.qrCodeValue = docSnap.id;
        }

        transaction.update(docRef, updateData);

        // Construir el registro actualizado con los datos actualizados
        const updatedData = { ...data, ...updateData };
        const updatedRecord: Registration = {
          ...mapFirestoreToRegistration(updatedData, docSnap.id),
          status: RegistrationStatus.VALIDATED,
          validationTime: new Date().toISOString(),
          validatedBy: operatorName
        };

        // Notificaciones de éxito
        if (updatedRecord.ticketType === 'VIP') {
          notificationService.notify('success', '¡Acceso VIP!', `${updatedRecord.name} ha ingresado. Notificar a hostess.`);
        } else if (updatedRecord.ticketType === 'PROMO') {
          notificationService.notify('info', 'Kit Promo', `Entregar kit a ${updatedRecord.name}.`);
        }

        return {
          success: true,
          message: 'Validación exitosa.',
          registration: updatedRecord
        };
      });

      return result;
    } catch (error: any) {
      console.error('Error validando registro:', error);
      
      // Si es un error de transacción (probablemente conflicto)
      if (error.code === 'failed-precondition' || error.message?.includes('concurrent')) {
        notificationService.notify('error', 'Conflicto', 'Otro operador está validando este código. Intenta de nuevo.');
        return { 
          success: false, 
          message: 'Error de concurrencia. Otro operador puede estar validando este código simultáneamente.' 
        };
      }

      notificationService.notify('error', 'Error de Validación', 'No se pudo validar el código. Verifica tu conexión.');
      return { 
        success: false, 
        message: 'Error al validar el código. Por favor, intenta de nuevo.' 
      };
    }
  },

  /**
   * Suscribirse a cambios en tiempo real
   * Útil para actualizar el dashboard automáticamente
   */
  subscribeToRegistrations: (
    callback: (registrations: Registration[]) => void
  ): (() => void) => {
    const dbInstance = getFirestoreDb();
    
    if (!dbInstance) {
      console.warn('⚠️ [subscribeToRegistrations] Firebase no configurado - Modo DEMO');
      callback([]);
      return () => {}; // Retornar función vacía para unsubscribe
    }
    
    const registrationsRef = collection(dbInstance, REGISTRATIONS_COLLECTION);
    
    const unsubscribe = onSnapshot(
      registrationsRef,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const registrations = snapshot.docs.map(doc => 
          mapFirestoreToRegistration(doc.data(), doc.id)
        );
        callback(registrations);
      },
      (error) => {
        console.error('Error en suscripción en tiempo real:', error);
        notificationService.notify('error', 'Error de Sincronización', 'No se pueden recibir actualizaciones en tiempo real.');
      }
    );

    return unsubscribe;
  },

  /**
   * Suscribirse solo a validaciones recientes (para dashboard)
   */
  subscribeToRecentValidations: (
    callback: (registrations: Registration[]) => void,
    limit: number = 10
  ): (() => void) => {
    const dbInstance = getFirestoreDb();
    
    if (!dbInstance) {
      console.warn('⚠️ [subscribeToRecentValidations] Firebase no configurado - Modo DEMO');
      callback([]);
      return () => {}; // Retornar función vacía para unsubscribe
    }
    
    const registrationsRef = collection(dbInstance, REGISTRATIONS_COLLECTION);
    const q = query(
      registrationsRef,
      where('status', '==', RegistrationStatus.VALIDATED)
      // Nota: Firestore no permite orderBy con where en diferentes campos fácilmente
      // Para ordenar por fecha, necesitarías un índice compuesto
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const registrations = snapshot.docs
          .map(doc => mapFirestoreToRegistration(doc.data(), doc.id))
          .sort((a, b) => {
            const timeA = new Date(a.validationTime || 0).getTime();
            const timeB = new Date(b.validationTime || 0).getTime();
            return timeB - timeA; // Más recientes primero
          })
          .slice(0, limit);
        callback(registrations);
      },
      (error) => {
        console.error('Error en suscripción de validaciones:', error);
      }
    );

    return unsubscribe;
  },

  /**
   * Obtener un registro específico por QR code
   */
  getRegistrationByQR: async (qrCode: string): Promise<Registration | null> => {
    const dbInstance = getFirestoreDb();
    
    if (!dbInstance) {
      console.warn('⚠️ [getRegistrationByQR] Firebase no configurado - Modo DEMO');
      return null;
    }
    
    try {
      const registrationsRef = collection(dbInstance, REGISTRATIONS_COLLECTION);
      const q = query(registrationsRef, where('qrCodeValue', '==', qrCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return mapFirestoreToRegistration(doc.data(), doc.id);
    } catch (error) {
      console.error('Error obteniendo registro por QR:', error);
      return null;
    }
  }
};

// Mantener compatibilidad con el código existente
export const db = dbService;
