import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

console.log('🚀 [firebaseConfig] ARCHIVO CARGADO - Iniciando configuración de Firebase...');
console.log('🔍 [firebaseConfig] import.meta.env:', import.meta.env);
console.log('🔍 [firebaseConfig] VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY);

// Firebase configuration
// Estas credenciales deben obtenerse de la consola de Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'liveshow29nov',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Debug: Verificar variables
console.log('🔍 [firebaseConfig] Verificando variables de entorno:');
console.log('  - API Key:', firebaseConfig.apiKey ? `✅ (${firebaseConfig.apiKey.substring(0, 20)}...)` : '❌ FALTANTE');
console.log('  - Auth Domain:', firebaseConfig.authDomain || '❌ FALTANTE');
console.log('  - Project ID:', firebaseConfig.projectId || '❌ FALTANTE');
console.log('  - Storage Bucket:', firebaseConfig.storageBucket || '❌ FALTANTE');
console.log('  - Messaging Sender ID:', firebaseConfig.messagingSenderId || '❌ FALTANTE');
console.log('  - App ID:', firebaseConfig.appId || '❌ FALTANTE');

// Validar que las variables estén definidas
const isFirebaseConfigured = !!firebaseConfig.apiKey && 
                              !!firebaseConfig.authDomain && 
                              !!firebaseConfig.projectId;

if (!isFirebaseConfigured) {
  console.warn('⚠️ [firebaseConfig] Firebase no está configurado');
  console.warn('   La aplicación funcionará en modo DEMO sin conexión a Firebase');
  console.warn('   Para habilitar Firebase, crea un archivo .env.local con las variables VITE_FIREBASE_*');
  console.warn('   Reinicia el servidor después de crear/editar .env.local');
}

// Initialize Firebase
let app: ReturnType<typeof initializeApp> | null = null;
let _db: ReturnType<typeof getFirestore> | null = null;

if (isFirebaseConfigured) {
  try {
    console.log('🔄 [firebaseConfig] Inicializando Firebase App...');
    app = initializeApp(firebaseConfig);
    console.log('✅ [firebaseConfig] Firebase App inicializado correctamente');
    
    // Initialize Firestore
    try {
      console.log('🔄 [firebaseConfig] Inicializando Firestore...');
      _db = getFirestore(app);
      console.log('✅ [firebaseConfig] Firestore DB inicializado correctamente');
      console.log('📦 [firebaseConfig] db type:', typeof _db);
      console.log('📦 [firebaseConfig] db constructor:', _db?.constructor?.name);
    } catch (error) {
      console.error('❌ [firebaseConfig] Error al inicializar Firestore:', error);
      _db = null;
    }
  } catch (error) {
    console.error('❌ [firebaseConfig] Error al inicializar Firebase App:', error);
    app = null;
    _db = null;
  }
} else {
  console.log('📱 [firebaseConfig] Modo DEMO activado - Firebase deshabilitado');
}

/**
 * Función getter que garantiza obtener siempre la instancia correcta de Firestore
 * Esto resuelve problemas de timing y referencias obsoletas en módulos ES6
 */
export const getDb = (): ReturnType<typeof getFirestore> | null => {
  // Si ya está inicializado, devolverlo
  if (_db) {
    return _db;
  }
  
  // Si no está inicializado pero Firebase está configurado, intentar inicializar
  if (isFirebaseConfigured && app && !_db) {
    try {
      _db = getFirestore(app);
      console.log('🔄 [getDb] Firestore inicializado de forma lazy');
      return _db;
    } catch (error) {
      console.error('❌ [getDb] Error al inicializar Firestore de forma lazy:', error);
      return null;
    }
  }
  
  return null;
};

// Exportar db para compatibilidad con código existente (usando getter)
export const db = _db;
export default app;

