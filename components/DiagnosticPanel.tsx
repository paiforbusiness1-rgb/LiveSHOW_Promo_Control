import React, { useState, useEffect } from 'react';
import { getDb } from '../services/firebaseConfig';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { notificationService } from '../services/notificationService';

interface DiagnosticResult {
  check: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

export const DiagnosticPanel: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sampleDoc, setSampleDoc] = useState<any>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setResults([]);
    const diagnostics: DiagnosticResult[] = [];

    // 1. Verificar conexión a Firebase
    try {
      const db = getDb();
      if (!db) {
        diagnostics.push({
          check: 'Conexión a Firebase',
          status: 'error',
          message: 'Firebase no está configurado. Verifica las variables de entorno.',
        });
        setResults(diagnostics);
        setLoading(false);
        return;
      }
      diagnostics.push({
        check: 'Conexión a Firebase',
        status: 'success',
        message: '✅ Conexión exitosa a Firebase',
      });
    } catch (error: any) {
      diagnostics.push({
        check: 'Conexión a Firebase',
        status: 'error',
        message: `❌ Error: ${error.message}`,
      });
      setResults(diagnostics);
      setLoading(false);
      return;
    }

    // 2. Verificar colección 'registrations'
    try {
      const db = getDb();
      if (!db) {
        setResults(diagnostics);
        setLoading(false);
        return;
      }

      const registrationsRef = collection(db, 'registrations');
      const snapshot = await getDocs(query(registrationsRef, limit(1)));

      if (snapshot.empty) {
        diagnostics.push({
          check: 'Colección "registrations"',
          status: 'warning',
          message: '⚠️ La colección existe pero está vacía. Esto es normal si aún no hay registros.',
        });
      } else {
        diagnostics.push({
          check: 'Colección "registrations"',
          status: 'success',
          message: `✅ Colección encontrada con ${snapshot.size} documento(s) de muestra`,
        });

        // Obtener un documento de ejemplo
        const doc = snapshot.docs[0];
        const data = doc.data();
        setSampleDoc({ id: doc.id, ...data });

        // 3. Verificar campos requeridos
        const requiredFields = ['email', 'ticketType', 'status'];
        const optionalFields = ['name', 'firstName', 'lastName', 'qrCodeValue', 'qrCode'];
        const autoFields = ['validationTime', 'validatedBy'];

        const missingRequired: string[] = [];
        const foundOptional: string[] = [];
        const foundAuto: string[] = [];

        requiredFields.forEach(field => {
          if (!(field in data)) {
            missingRequired.push(field);
          }
        });

        optionalFields.forEach(field => {
          if (field in data) {
            foundOptional.push(field);
          }
        });

        autoFields.forEach(field => {
          if (field in data) {
            foundAuto.push(field);
          }
        });

        // Verificar campos requeridos
        if (missingRequired.length > 0) {
          diagnostics.push({
            check: 'Campos Requeridos',
            status: 'error',
            message: `❌ Faltan campos: ${missingRequired.join(', ')}`,
            details: {
              faltantes: missingRequired,
              encontrados: requiredFields.filter(f => !missingRequired.includes(f)),
            },
          });
        } else {
          diagnostics.push({
            check: 'Campos Requeridos',
            status: 'success',
            message: `✅ Todos los campos requeridos presentes: ${requiredFields.join(', ')}`,
          });
        }

        // Verificar campos opcionales
        if (foundOptional.length > 0) {
          diagnostics.push({
            check: 'Campos Opcionales',
            status: 'success',
            message: `✅ Campos opcionales encontrados: ${foundOptional.join(', ')}`,
          });
        } else {
          diagnostics.push({
            check: 'Campos Opcionales',
            status: 'warning',
            message: '⚠️ No se encontraron campos opcionales (name, firstName, lastName, qrCodeValue)',
          });
        }

        // Verificar ticketType
        const validTicketTypes = ['VIP', 'GENERAL', 'PROMO'];
        if (data.ticketType) {
          if (validTicketTypes.includes(data.ticketType)) {
            diagnostics.push({
              check: 'Tipo de Ticket',
              status: 'success',
              message: `✅ ticketType válido: "${data.ticketType}"`,
            });
          } else {
            diagnostics.push({
              check: 'Tipo de Ticket',
              status: 'error',
              message: `❌ ticketType inválido: "${data.ticketType}". Debe ser: ${validTicketTypes.join(', ')}`,
            });
          }
        }

        // Verificar status
        const validStatuses = ['PENDING', 'VALIDATED', 'CANCELLED'];
        if (data.status) {
          if (validStatuses.includes(data.status)) {
            diagnostics.push({
              check: 'Estado del Registro',
              status: 'success',
              message: `✅ status válido: "${data.status}"`,
            });
          } else {
            diagnostics.push({
              check: 'Estado del Registro',
              status: 'error',
              message: `❌ status inválido: "${data.status}". Debe ser: ${validStatuses.join(', ')}`,
            });
          }
        }

        // Verificar código QR
        const hasQR = !!(data.qrCodeValue || data.qrCode || doc.id);
        if (hasQR) {
          const qrSource = data.qrCodeValue ? 'qrCodeValue' : data.qrCode ? 'qrCode' : 'ID del documento';
          diagnostics.push({
            check: 'Código QR',
            status: 'success',
            message: `✅ Código QR disponible (usando: ${qrSource})`,
          });
        } else {
          diagnostics.push({
            check: 'Código QR',
            status: 'warning',
            message: '⚠️ No se encontró campo para código QR. Se usará el ID del documento.',
          });
        }

        // Verificar nombre
        const hasName = !!(data.name || (data.firstName && data.lastName) || data.firstName);
        if (hasName) {
          const nameSource = data.name ? 'name' : data.firstName && data.lastName ? 'firstName + lastName' : 'firstName';
          diagnostics.push({
            check: 'Nombre del Asistente',
            status: 'success',
            message: `✅ Nombre disponible (usando: ${nameSource})`,
          });
        } else {
          diagnostics.push({
            check: 'Nombre del Asistente',
            status: 'warning',
            message: '⚠️ No se encontró campo de nombre. Se mostrará como "Sin nombre"',
          });
        }
      }
    } catch (error: any) {
      diagnostics.push({
        check: 'Colección "registrations"',
        status: 'error',
        message: `❌ Error al acceder a la colección: ${error.message}`,
        details: error,
      });
    }

    // 4. Verificar total de documentos
    try {
      const db = getDb();
      if (db) {
        const registrationsRef = collection(db, 'registrations');
        const fullSnapshot = await getDocs(registrationsRef);
        diagnostics.push({
          check: 'Total de Registros',
          status: 'success',
          message: `✅ Total de documentos en la colección: ${fullSnapshot.size}`,
        });
      }
    } catch (error: any) {
      diagnostics.push({
        check: 'Total de Registros',
        status: 'warning',
        message: `⚠️ No se pudo contar el total: ${error.message}`,
      });
    }

    setResults(diagnostics);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-900/20 border-green-500/50';
      case 'warning':
        return 'bg-yellow-900/20 border-yellow-500/50';
      case 'error':
        return 'bg-red-900/20 border-red-500/50';
      default:
        return 'bg-gray-900/20 border-gray-500/50';
    }
  };

  return (
    <div className="space-y-4 p-5 w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Diagnóstico de Firestore</h1>
        <button
          onClick={runDiagnostics}
          disabled={loading}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors"
        >
          {loading ? 'Verificando...' : '🔄 Re-verificar'}
        </button>
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-400 animate-pulse">
          Ejecutando diagnósticos...
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getStatusBg(result.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className={`font-semibold mb-1 ${getStatusColor(result.status)}`}>
                    {result.check}
                  </h3>
                  <p className="text-sm text-gray-300">{result.message}</p>
                  {result.details && (
                    <details className="mt-2 text-xs text-gray-400">
                      <summary className="cursor-pointer hover:text-gray-300">Ver detalles</summary>
                      <pre className="mt-2 p-2 bg-gray-900/50 rounded overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {sampleDoc && (
        <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3">📄 Documento de Ejemplo</h3>
          <pre className="text-xs text-gray-300 overflow-auto bg-gray-900/50 p-3 rounded">
            {JSON.stringify(sampleDoc, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg">
        <h3 className="text-blue-400 font-semibold mb-2">💡 Información</h3>
        <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
          <li>Esta herramienta verifica la estructura de tu base de datos</li>
          <li>Si hay errores, revisa la documentación en INTEGRACION_APPS.md</li>
          <li>Los campos requeridos son: email, ticketType, status</li>
          <li>El código QR puede estar en: qrCodeValue, qrCode, o usar el ID del documento</li>
        </ul>
      </div>
    </div>
  );
};

