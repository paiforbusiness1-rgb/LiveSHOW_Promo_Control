# 🔗 Integración: App Pre-Registro + App Control de Ingreso

## 📱 Situación Actual

Tienes **2 aplicaciones** que trabajan con la **misma base de datos Firebase**:

### 1. **App de Pre-Registro** 
- Donde las personas se registran para el evento
- Guarda datos en Firestore
- Usa Firebase: `liveshow29nov`

### 2. **App de Control de Ingreso** (esta app)
- Para validar entradas en el evento
- Lee y actualiza datos en Firestore
- Usa Firebase: `liveshow29nov` ✅ (misma base de datos)

## ✅ ¿Está Lista para Trabajar?

**SÍ, la app de control está lista**, pero necesitas verificar que:

### 1. **Misma Colección en Firestore**

La app de control busca en la colección: **`registrations`**

**Verifica en tu app de pre-registro:**
- ¿En qué colección guarda los registros?
- Si es diferente a `registrations`, tienes 2 opciones:
  - **Opción A**: Cambiar el nombre de la colección en la app de pre-registro a `registrations`
  - **Opción B**: Modificar la app de control para usar el nombre de tu colección actual

### 2. **Estructura de Datos Compatible**

La app de control espera estos campos en cada documento:

#### Campos Mínimos Requeridos:
```typescript
{
  email: string;                    // ✅ REQUERIDO
  ticketType: 'VIP' | 'GENERAL' | 'PROMO';  // ✅ REQUERIDO
  status: 'PENDING' | 'VALIDATED' | 'CANCELLED';  // ✅ REQUERIDO (inicial: 'PENDING')
}
```

#### Campos para el Código QR:
```typescript
{
  qrCodeValue?: string;  // Preferido - código único del QR
  qrCode?: string;      // Alternativo
  // Si no existe ninguno, se usa el ID del documento como QR
}
```

#### Campos de Nombre (flexible):
```typescript
{
  name?: string;        // Opción 1: nombre completo
  firstName?: string;   // Opción 2: nombre separado
  lastName?: string;    // Opción 2: apellido separado
}
```

#### Campos que se Agregan Automáticamente al Validar:
```typescript
{
  validationTime?: Timestamp;  // Se agrega cuando se valida
  validatedBy?: string;       // Nombre del operador que validó
}
```

### 3. **Estado Inicial de los Registros**

Cuando la app de pre-registro crea un documento, debe tener:
- `status: 'PENDING'` (importante: debe ser string, no número)

## 🔍 Verificación Rápida

### Paso 1: Verifica la Colección
1. Ve a Firebase Console: https://console.firebase.google.com/project/liveshow29nov/firestore
2. Revisa qué colección usa tu app de pre-registro
3. Si no es `registrations`, anota el nombre exacto

### Paso 2: Verifica un Documento de Ejemplo
1. Abre un documento de ejemplo de tu app de pre-registro
2. Verifica que tenga estos campos:
   - ✅ `email` (string)
   - ✅ `ticketType` ('VIP', 'GENERAL' o 'PROMO')
   - ✅ `status` ('PENDING' para los nuevos)
   - ✅ Algún campo para el código QR (`qrCodeValue`, `qrCode`, o usar el ID)

### Paso 3: Verifica el Código QR
- ¿Tu app de pre-registro genera códigos QR?
- ¿Dónde guarda el código QR? (en qué campo)
- Si no genera QR, podemos usar el ID del documento como código

## 🔧 Si Necesitas Ajustes

### Escenario 1: Colección con Nombre Diferente

Si tu app de pre-registro guarda en otra colección (ej: `preregistros`, `asistentes`, etc.):

**Solución**: Modificar `services/databaseService.ts` línea 33:
```typescript
// Cambiar esto:
const REGISTRATIONS_COLLECTION = 'registrations';

// Por el nombre de tu colección:
const REGISTRATIONS_COLLECTION = 'tu-nombre-de-coleccion';
```

### Escenario 2: Campos con Nombres Diferentes

Si tu app de pre-registro usa otros nombres de campos, podemos ajustar el mapeo en `mapFirestoreToRegistration`.

**Ejemplo**: Si usas `tipoTicket` en lugar de `ticketType`:
```typescript
ticketType: data.tipoTicket || data.ticketType || 'GENERAL',
```

### Escenario 3: Falta el Campo `status`

Si tus documentos no tienen `status`, podemos agregarlo automáticamente:
- Todos los documentos existentes se tratarán como `PENDING`
- Al validar, se agregará `status: 'VALIDATED'`

## ✅ Checklist Final

Antes de usar en producción:

- [ ] Ambas apps usan la misma configuración de Firebase (`liveshow29nov`)
- [ ] La colección tiene el nombre correcto (`registrations` o ajustado)
- [ ] Los documentos tienen `email`, `ticketType`, y algún campo para QR
- [ ] Los documentos nuevos tienen `status: 'PENDING'`
- [ ] El código QR está guardado en algún campo (o se puede usar el ID)
- [ ] Las variables de entorno en Vercel están configuradas

## 🚀 Flujo de Trabajo

1. **Pre-Registro** (App 1):
   - Persona se registra → Se crea documento en Firestore
   - Documento tiene: `email`, `ticketType`, `status: 'PENDING'`, `qrCodeValue`

2. **Control de Ingreso** (App 2 - esta app):
   - Operador escanea QR → Busca documento en Firestore
   - Verifica que `status` sea `PENDING`
   - Actualiza a `status: 'VALIDATED'` y agrega `validationTime` y `validatedBy`

3. **Sincronización en Tiempo Real**:
   - Si varios operadores usan la app, todos ven los cambios en tiempo real
   - No se pueden validar duplicados (usando transacciones de Firestore)

## 📞 ¿Necesitas Ayuda?

Si tu app de pre-registro tiene una estructura diferente, comparte:
1. Nombre de la colección
2. Ejemplo de un documento (sin datos sensibles)
3. Campo donde guarda el código QR

Y puedo ajustar el código para que sea 100% compatible.

