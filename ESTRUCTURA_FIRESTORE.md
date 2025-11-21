# 📋 Estructura de Firestore para LiveSHOW PromoControl

## 🔥 Colección Requerida: `registrations`

La aplicación busca una colección llamada **`registrations`** en tu proyecto de Firestore (`liveshow29nov`).

## 📊 Estructura de Documentos

Cada documento en la colección `registrations` debe tener la siguiente estructura:

### Campos Requeridos:

```typescript
{
  // Nombre completo (puede ser uno de estos formatos)
  name?: string;                    // Opción 1: nombre completo
  firstName?: string;               // Opción 2: nombre separado
  lastName?: string;                // Opción 2: apellido separado
  
  // Email del asistente
  email: string;
  
  // Tipo de ticket
  ticketType: 'VIP' | 'GENERAL' | 'PROMO';
  
  // Estado del registro
  status: 'PENDING' | 'VALIDATED' | 'CANCELLED';
  
  // Código QR (IMPORTANTE: usado para buscar y validar)
  qrCodeValue?: string;             // Campo preferido para QR
  qrCode?: string;                  // Campo alternativo
  // Si no existe qrCodeValue ni qrCode, se usa el ID del documento
}
```

### Campos Opcionales (se agregan automáticamente al validar):

```typescript
{
  // Fecha/hora de validación (se agrega cuando se valida)
  validationTime?: Timestamp;
  
  // Nombre del operador que validó (se agrega cuando se valida)
  validatedBy?: string;
}
```

## 🔍 Ejemplo de Documento

### Documento antes de validar:
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "ticketType": "VIP",
  "status": "PENDING",
  "qrCodeValue": "live-show-vip-001"
}
```

### Documento después de validar:
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "ticketType": "VIP",
  "status": "VALIDATED",
  "qrCodeValue": "live-show-vip-001",
  "validationTime": "2024-11-29T20:30:00Z",
  "validatedBy": "Staff Usuario"
}
```

## 🔑 Cómo Funciona la Búsqueda por QR

La aplicación busca registros de tres formas (en este orden):

1. **Por ID del documento**: Si el QR code coincide con el ID del documento
2. **Por campo `qrCodeValue`**: Búsqueda directa en este campo
3. **Por campo `qrCode`**: Búsqueda alternativa si no existe `qrCodeValue`

**Recomendación**: Usa el campo `qrCodeValue` para mayor claridad.

## 📝 Compatibilidad con Datos Existentes

El código es flexible y puede manejar diferentes estructuras:

### ✅ Estructuras Soportadas:

**Opción 1: Nombre completo**
```json
{
  "name": "María García",
  "email": "maria@example.com",
  "ticketType": "GENERAL",
  "status": "PENDING",
  "qrCodeValue": "live-show-gen-002"
}
```

**Opción 2: Nombre separado**
```json
{
  "firstName": "María",
  "lastName": "García",
  "email": "maria@example.com",
  "ticketType": "GENERAL",
  "status": "PENDING",
  "qrCodeValue": "live-show-gen-002"
}
```

**Opción 3: Solo nombre**
```json
{
  "firstName": "María",
  "email": "maria@example.com",
  "ticketType": "GENERAL",
  "status": "PENDING",
  "qrCodeValue": "live-show-gen-002"
}
```

## 🎫 Tipos de Tickets

Los tipos de tickets soportados son:

- **`VIP`**: Acceso VIP con zona especial
- **`GENERAL`**: Entrada general
- **`PROMO`**: Ticket promocional (requiere entrega de kit)

## 🔄 Estados de Registro

- **`PENDING`**: Registrado pero aún no ha ingresado (estado inicial)
- **`VALIDATED`**: Ya ingresó al evento (se actualiza al escanear)
- **`CANCELLED`**: Registro cancelado (no puede ingresar)

## ⚙️ Índices Recomendados en Firestore

Para optimizar las búsquedas, crea estos índices en Firestore:

1. **Índice simple en `qrCodeValue`**:
   - Campo: `qrCodeValue`
   - Tipo: Ascending

2. **Índice compuesto para validaciones recientes** (opcional):
   - Campo 1: `status` (Ascending)
   - Campo 2: `validationTime` (Descending)

### Cómo crear índices en Firestore:

1. Ve a la consola de Firebase
2. Firestore Database > Indexes
3. Clic en "Create Index"
4. Selecciona la colección `registrations`
5. Agrega los campos mencionados arriba

## 🚨 Importante para la Validación

Cuando un operador escanea un código QR:

1. La app busca el documento por `qrCodeValue` o ID
2. Verifica que el `status` sea `PENDING`
3. Si ya está `VALIDATED`, muestra advertencia
4. Si está `CANCELLED`, deniega el acceso
5. Si está `PENDING`, actualiza a `VALIDATED` y agrega:
   - `validationTime`: Timestamp actual
   - `validatedBy`: Nombre del operador

## ✅ Checklist de Verificación

Antes de usar la app en producción, verifica:

- [ ] La colección `registrations` existe en Firestore
- [ ] Los documentos tienen al menos: `email`, `ticketType`, `status`
- [ ] Cada documento tiene un `qrCodeValue` único (o el ID puede usarse como QR)
- [ ] Los `status` iniciales son `PENDING`
- [ ] Los `ticketType` son: `VIP`, `GENERAL` o `PROMO`
- [ ] Se creó el índice en `qrCodeValue` (recomendado)

## 🔗 Configuración de Firebase

Asegúrate de que las variables de entorno en Vercel coincidan con tu proyecto:

```
VITE_FIREBASE_API_KEY=AIzaSyAkPmNsYWi2HAxsxArIuu_NUEH8xqDqLak
VITE_FIREBASE_AUTH_DOMAIN=liveshow29nov.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=liveshow29nov
VITE_FIREBASE_STORAGE_BUCKET=liveshow29nov.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=466535666878
VITE_FIREBASE_APP_ID=1:466535666878:web:31edf2c07ff7c757673aef
```

## 📞 Soporte

Si tienes problemas con la estructura de datos, verifica:
1. Que la colección se llame exactamente `registrations`
2. Que los campos requeridos existan
3. Que los tipos de datos sean correctos (string, no number para ticketType)
4. Revisa la consola del navegador para ver errores específicos

