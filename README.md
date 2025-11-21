<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# LiveSHOW PromoControl

Sistema de control de acceso para eventos con validación de códigos QR y análisis de asistencia con IA.

## 🚀 Ejecutar Localmente

**Prerrequisitos:** Node.js 18+ instalado

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   - Crea un archivo `.env.local` en la raíz del proyecto
   
   - **API Key de Gemini:**
     - Obtén tu API key en: https://aistudio.google.com/apikey
     - Agrega: `GEMINI_API_KEY=tu_clave_api_aqui`
   
   - **Configuración de Firebase:**
     - Ve a tu proyecto Firebase: https://console.firebase.google.com/project/liveshow29nov/settings/general
     - En "Tus apps", selecciona la app web o crea una nueva
     - Copia las credenciales y agrega al `.env.local`:
     ```
     VITE_FIREBASE_API_KEY=tu_api_key
     VITE_FIREBASE_AUTH_DOMAIN=liveshow29nov.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=liveshow29nov
     VITE_FIREBASE_STORAGE_BUCKET=liveshow29nov.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
     VITE_FIREBASE_APP_ID=tu_app_id
     ```

3. **Ejecutar servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   
   La aplicación estará disponible en: `http://localhost:3000`

## 📦 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción

## 🌐 Desplegar en Vercel

1. **Sube el código a GitHub**

2. **Importa el proyecto en Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Importa tu repositorio de GitHub
   - Vercel detectará automáticamente la configuración de Vite

3. **Configura las variables de entorno:**
   - En la configuración del proyecto en Vercel
   - Ve a "Settings" > "Environment Variables"
   - Agrega todas las variables de Firebase (VITE_FIREBASE_*) y `GEMINI_API_KEY`

4. **Despliega:**
   - Vercel desplegará automáticamente en cada push a la rama principal

## 🔧 Tecnologías

- React 19 + TypeScript
- Vite
- React Router
- Google Gemini AI
- Tailwind CSS
- jsQR

## 📝 Notas

- **Persistencia de Datos**: La aplicación usa Firebase Firestore para persistencia real
- **Consistencia**: Las validaciones usan transacciones de Firestore para evitar duplicados
- **Tiempo Real**: Los datos se sincronizan automáticamente entre todos los dispositivos
- **Análisis IA**: Requiere una API key válida de Gemini

## 🔥 Configuración de Firestore

La aplicación espera una colección llamada `registrations` en Firestore con la siguiente estructura:

```typescript
{
  name: string;
  email: string;
  ticketType: 'VIP' | 'GENERAL' | 'PROMO';
  status: 'PENDING' | 'VALIDATED' | 'CANCELLED';
  qrCodeValue: string; // Campo usado para buscar por QR
  validationTime?: Timestamp; // Se actualiza al validar
  validatedBy?: string; // Nombre del operador que validó
}
```

**Índices requeridos en Firestore:**
- `qrCodeValue` (para búsquedas rápidas)
- `status` + `validationTime` (para consultas de validaciones recientes)
