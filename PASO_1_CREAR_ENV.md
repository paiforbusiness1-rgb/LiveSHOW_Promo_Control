# 📝 PASO 1: Crear el Archivo .env.local

## ¿Qué hacer?

Necesitas crear un archivo llamado `.env.local` en la carpeta del proyecto con las credenciales de Firebase.

## Opción A: Desde el Explorador de Archivos (Windows)

1. Abre la carpeta del proyecto: `C:\IA_Nubes\liveshow-promocontrol`
2. Clic derecho → **Nuevo** → **Documento de texto**
3. Renómbralo a: `.env.local` (con el punto al inicio)
   - ⚠️ Si Windows te dice que no puedes usar el punto, crea el archivo desde la terminal (ver Opción B)

## Opción B: Desde la Terminal (Más Fácil)

1. Abre PowerShell en la carpeta del proyecto
2. Ejecuta este comando:

```powershell
@"
VITE_FIREBASE_API_KEY=AIzaSyAkPmNsYWi2HAxsxArIuu_NUEH8xqDqLak
VITE_FIREBASE_AUTH_DOMAIN=liveshow29nov.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=liveshow29nov
VITE_FIREBASE_STORAGE_BUCKET=liveshow29nov.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=466535666878
VITE_FIREBASE_APP_ID=1:466535666878:web:31edf2c07ff7c757673aef
GEMINI_API_KEY=AIzaSyCkip8A9Z5AXuIUJa3K-KzAxEUlTKtukxw
"@ | Out-File -FilePath .env.local -Encoding utf8
```

3. Verifica que se creó el archivo:
```powershell
Get-Content .env.local
```

## Contenido del Archivo

El archivo debe contener exactamente esto (sin comillas):

```
VITE_FIREBASE_API_KEY=AIzaSyAkPmNsYWi2HAxsxArIuu_NUEH8xqDqLak
VITE_FIREBASE_AUTH_DOMAIN=liveshow29nov.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=liveshow29nov
VITE_FIREBASE_STORAGE_BUCKET=liveshow29nov.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=466535666878
VITE_FIREBASE_APP_ID=1:466535666878:web:31edf2c07ff7c757673aef
GEMINI_API_KEY=AIzaSyCkip8A9Z5AXuIUJa3K-KzAxEUlTKtukxw
```

## ✅ Verificación

Después de crear el archivo:
1. Reinicia el servidor (Ctrl+C y luego `npm run dev`)
2. Deberías ver que el servidor se reinicia automáticamente cuando detecta el archivo

## ❌ Si No Funciona

- Asegúrate de que el archivo se llama exactamente `.env.local` (con el punto)
- Verifica que NO hay espacios antes o después del signo `=`
- Verifica que NO hay comillas alrededor de los valores

