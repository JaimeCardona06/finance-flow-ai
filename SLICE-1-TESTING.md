# Slice 1: Testing - Onboarding y Privacidad

## ✅ Implementación Completada

### Backend
- ✅ Configuración de MongoDB con Mongoose (`apps/api/src/config/db.ts`)
- ✅ Modelo de Usuario con validaciones (`apps/api/src/models/User.ts`)
- ✅ Endpoint POST /api/auth/register (`apps/api/src/controllers/authController.ts`)
- ✅ Servidor Express configurado (`apps/api/src/server.ts`)

### Frontend
- ✅ Página de registro `/register` (`apps/web/app/register/page.tsx`)
- ✅ Formulario con validación Zod
- ✅ Checkbox obligatorio de política de privacidad (Ley 1581)

### Shared
- ✅ Schema de validación actualizado con campo `name`

## 🚀 Instrucciones para Probar

### 1. Configurar Variables de Entorno

Crear archivo `apps/api/.env`:

```env
MONGODB_URI=mongodb+srv://tu-usuario:tu-password@cluster.mongodb.net/financeflow?retryWrites=true&w=majority
PORT=4000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
```

### 2. Instalar Dependencias

Desde la raíz del monorepo:

```bash
npm install
```

### 3. Iniciar Backend

```bash
npm run dev --workspace=@financeflow/api
```

Deberías ver:
```
✅ MongoDB Atlas conectado exitosamente
🚀 Servidor corriendo en http://localhost:4000
📊 Health check: http://localhost:4000/health
```

### 4. Iniciar Frontend

En otra terminal:

```bash
npm run dev --workspace=@financeflow/web
```

El frontend estará en: http://localhost:3000

### 5. Probar Registro

1. Ir a http://localhost:3000
2. Click en "Crear cuenta"
3. Llenar el formulario:
   - Nombre: Juan Pérez
   - Email: juan@test.com
   - Contraseña: password123
   - ✅ Marcar checkbox de política de privacidad
4. Click en "Crear cuenta"

### 6. Verificar en MongoDB

El usuario debería estar guardado en la colección `users` con:
- `name`: "Juan Pérez"
- `email`: "juan@test.com"
- `password`: (hasheada con bcrypt)
- `acceptedPrivacyPolicy`: true
- `privacyPolicyAcceptedAt`: (fecha actual)
- `createdAt` y `updatedAt`: (timestamps automáticos)

## ✅ Criterios de Éxito

- [x] Backend conecta a MongoDB Atlas
- [x] Endpoint POST /api/auth/register funciona
- [x] Validación con Zod funciona (frontend y backend)
- [x] Password se hashea con bcrypt
- [x] Checkbox de privacidad es obligatorio
- [x] Fecha de aceptación se guarda automáticamente
- [x] Usuario se puede registrar exitosamente
- [x] Duplicados de email se rechazan con error 409

## 🧪 Casos de Prueba

### Caso 1: Registro Exitoso
- Input: Datos válidos + checkbox marcado
- Expected: Status 201, usuario creado en DB

### Caso 2: Email Duplicado
- Input: Email ya existente
- Expected: Status 409, mensaje "Ya existe una cuenta con este email"

### Caso 3: Checkbox No Marcado
- Input: Datos válidos pero checkbox sin marcar
- Expected: Error de validación en frontend

### Caso 4: Contraseña Corta
- Input: Password con menos de 8 caracteres
- Expected: Error de validación "La contraseña debe tener al menos 8 caracteres"

### Caso 5: Email Inválido
- Input: Email sin formato válido
- Expected: Error de validación "Email inválido"

## 📝 Notas

- El flujo es vertical básico: Formulario → API → MongoDB
- No hay animaciones ni estilos complejos (como se solicitó)
- El password se hashea automáticamente en el pre-save hook de Mongoose
- La fecha de aceptación de privacidad se establece automáticamente
- CORS está configurado para permitir localhost:3000

## 🎯 Próximos Pasos

Una vez confirmado que el registro funciona:
1. Commit limpio del Slice 1
2. Proceder con Slice 2: Primer Insight Wow
