# 🔥 Guía Paso a Paso: Conectar Firebase

## 📋 ¿Qué vamos a hacer?

Vamos a conectar tu aplicación con Firebase para que:
- ✅ Los datos se guarden permanentemente
- ✅ Múltiples dispositivos vean los mismos datos en tiempo real
- ✅ No se puedan validar códigos QR dos veces (evita duplicados)

---

## PASO 1: Abrir la Consola de Firebase

**¿Qué hacer?**
1. Abre tu navegador (Chrome, Edge, etc.)
2. Ve a esta dirección: https://console.firebase.google.com/project/liveshow29nov/settings/general

**¿Por qué?**
Necesitamos obtener las "credenciales" de tu proyecto Firebase. Son como las llaves de una casa: sin ellas, la aplicación no puede entrar a guardar datos.

---

## PASO 2: Obtener las Credenciales

**¿Qué hacer?**
1. En la página que se abrió, baja hasta la sección que dice **"Tus apps"** (está en la parte inferior)
2. Busca una app web (tiene un ícono que parece `</>`)
   - **Si ya existe una app web**: Haz clic en el ícono de engranaje ⚙️ y luego en "Configuración del proyecto"
   - **Si NO existe**: Haz clic en el botón **"Agregar app"** → Selecciona el ícono de web `</>` → Dale un nombre (ej: "LiveSHOW Control") → Clic en "Registrar app"
3. Verás un código que dice "SDK de Firebase" con varios valores como:
   ```
   apiKey: "AIzaSy..."
   authDomain: "liveshow29nov.firebaseapp.com"
   projectId: "liveshow29nov"
   storageBucket: "liveshow29nov.appspot.com"
   messagingSenderId: "123456789"
   appId: "1:123456789:web:abc123"
   ```
4. **Copia estos valores** (los necesitarás en el siguiente paso)

**¿Por qué?**
Estos son los "datos de conexión" que la aplicación necesita para saber cómo conectarse a TU proyecto de Firebase.

---

## PASO 3: Crear el Archivo de Configuración

**¿Qué hacer?**
1. Abre la carpeta del proyecto en tu computadora (donde está el archivo `package.json`)
2. Busca si existe un archivo llamado `.env.local`
   - **Si NO existe**: Crea un archivo nuevo con ese nombre exacto
   - **Si ya existe**: Ábrelo para editarlo
3. Dentro del archivo, escribe estas líneas (reemplaza los valores con los que copiaste en el paso anterior):

```
VITE_FIREBASE_API_KEY=pega_aqui_el_apiKey
VITE_FIREBASE_AUTH_DOMAIN=liveshow29nov.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=liveshow29nov
VITE_FIREBASE_STORAGE_BUCKET=liveshow29nov.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=pega_aqui_el_messagingSenderId
VITE_FIREBASE_APP_ID=pega_aqui_el_appId
GEMINI_API_KEY=tu_clave_gemini_si_la_tienes
```

**Ejemplo de cómo debería verse:**
```
VITE_FIREBASE_API_KEY=AIzaSyCkip8A9Z5AXuIUJa3K-KzAxEUlTKtukxw
VITE_FIREBASE_AUTH_DOMAIN=liveshow29nov.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=liveshow29nov
VITE_FIREBASE_STORAGE_BUCKET=liveshow29nov.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456
GEMINI_API_KEY=AIzaSyCkip8A9Z5AXuIUJa3K-KzAxEUlTKtukxw
```

4. **Guarda el archivo**

**¿Por qué?**
Este archivo guarda las credenciales de forma segura. La aplicación las lee cuando inicia, pero NO se suben a GitHub (están protegidas).

**⚠️ IMPORTANTE:**
- NO pongas comillas alrededor de los valores
- NO dejes espacios antes o después del signo `=`
- El archivo debe llamarse exactamente `.env.local` (con el punto al inicio)

---

## PASO 4: Verificar la Estructura de Firestore

**¿Qué hacer?**
1. Ve a: https://console.firebase.google.com/project/liveshow29nov/firestore
2. Verifica que exista una colección llamada **`registrations`**
   - Si NO existe, créala haciendo clic en "Comenzar colección" o "Agregar colección"
3. Verifica que los documentos dentro tengan estos campos:
   - `name` (nombre de la persona)
   - `email` (correo electrónico)
   - `ticketType` (tipo de ticket: VIP, GENERAL, o PROMO)
   - `status` (estado: PENDING, VALIDATED, o CANCELLED)
   - `qrCodeValue` (el código QR que se escanea)

**¿Por qué?**
La aplicación busca los datos en una colección llamada "registrations". Si tiene otro nombre o faltan campos, no funcionará correctamente.

---

## PASO 5: Reiniciar el Servidor

**¿Qué hacer?**
1. En la terminal donde está corriendo `npm run dev`:
   - Presiona `Ctrl + C` (para detener el servidor)
2. Vuelve a ejecutar:
   ```
   npm run dev
   ```

**¿Por qué?**
El servidor necesita reiniciarse para leer las nuevas variables de entorno que acabamos de configurar.

---

## PASO 6: Probar que Funciona

**¿Qué hacer?**
1. Abre tu navegador en: http://localhost:3000
2. Inicia sesión con:
   - Usuario: `admin`
   - Contraseña: `admin`
3. Ve al Dashboard (pantalla de inicio)
4. **Deberías ver** los registros que están en Firestore
5. Prueba escanear un código QR (usa los botones de demo en el escáner)
6. Ve a Firestore y verifica que el registro se actualizó con `status: VALIDATED`

**¿Por qué?**
Esto confirma que:
- ✅ La conexión a Firebase funciona
- ✅ Puedes leer datos de Firestore
- ✅ Puedes escribir/actualizar datos en Firestore

---

## ❌ Si Algo No Funciona

### Error: "Firebase: Error (auth/...)"

**Solución:**
- Verifica que copiaste correctamente todos los valores en `.env.local`
- Asegúrate de que NO hay comillas alrededor de los valores
- Reinicia el servidor después de cambiar `.env.local`

### Error: "Collection 'registrations' not found"

**Solución:**
- Ve a Firestore y crea la colección `registrations`
- O verifica que el nombre esté escrito exactamente igual (con minúsculas)

### No se ven los datos en el Dashboard

**Solución:**
1. Abre la consola del navegador (presiona F12)
2. Ve a la pestaña "Console"
3. Busca errores en rojo
4. Comparte el error para ayudarte a solucionarlo

### El archivo `.env.local` no se guarda

**Solución:**
- Asegúrate de que el archivo se llama exactamente `.env.local` (con el punto al inicio)
- Si usas Windows, puede que necesites crear el archivo desde la terminal o desde un editor de código

---

## ✅ Checklist Final

Antes de considerar que todo está listo, verifica:

- [ ] Tienes el archivo `.env.local` con todas las variables
- [ ] El servidor se reinició después de crear/editar `.env.local`
- [ ] La colección `registrations` existe en Firestore
- [ ] Puedes ver datos en el Dashboard
- [ ] Puedes validar un código QR y se guarda en Firestore

---

## 🎉 ¡Listo!

Si completaste todos los pasos y todo funciona, tu aplicación ahora tiene:
- ✅ Persistencia de datos (los datos se guardan permanentemente)
- ✅ Sincronización en tiempo real (varios dispositivos ven los mismos datos)
- ✅ Prevención de duplicados (no se puede validar el mismo QR dos veces)

