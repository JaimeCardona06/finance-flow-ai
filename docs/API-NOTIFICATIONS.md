# API de Notificaciones - FinanceFlow AI

Documentación de los endpoints del sistema de notificaciones y alertas inteligentes.

## Autenticación

Todos los endpoints requieren autenticación JWT. Incluir el token en el header `Authorization`:

```
Authorization: Bearer <tu_token_jwt>
```

## Base URL

```
http://localhost:4000/api/notifications
```

---

## Endpoints

### 1. Obtener Notificaciones del Usuario

Obtiene las notificaciones del usuario autenticado, ordenadas por fecha (más recientes primero).

**Endpoint:** `GET /api/notifications`

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "userId": "507f191e810c19729de860ea",
        "type": "subscription",
        "title": "Nueva suscripción detectada",
        "message": "Hemos detectado un cargo recurrente de Netflix por $45,000 COP mensual",
        "read": false,
        "actionUrl": "/subscriptions",
        "createdAt": "2024-03-15T10:30:00.000Z",
        "updatedAt": "2024-03-15T10:30:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "userId": "507f191e810c19729de860ea",
        "type": "plan_alert",
        "title": "Meta de ahorro alcanzada",
        "message": "¡Felicitaciones! Has alcanzado el 50% de tu meta de ahorro",
        "read": true,
        "actionUrl": "/plans/507f1f77bcf86cd799439013",
        "createdAt": "2024-03-14T08:15:00.000Z",
        "updatedAt": "2024-03-14T09:20:00.000Z"
      }
    ]
  }
}
```

**Ejemplo cURL:**
```bash
curl -X GET http://localhost:4000/api/notifications \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Ejemplo Thunder Client / Postman:**
- Method: `GET`
- URL: `http://localhost:4000/api/notifications`
- Headers:
  - `Authorization`: `Bearer <tu_token>`

---

### 2. Marcar Notificación como Leída

Marca una notificación específica como leída.

**Endpoint:** `PATCH /api/notifications/:id/read`

**Headers:**
```
Authorization: Bearer <token>
```

**Parámetros de URL:**
- `id`: ID de la notificación (MongoDB ObjectId)

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "notification": {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f191e810c19729de860ea",
      "type": "subscription",
      "title": "Nueva suscripción detectada",
      "message": "Hemos detectado un cargo recurrente de Netflix por $45,000 COP mensual",
      "read": true,
      "actionUrl": "/subscriptions",
      "createdAt": "2024-03-15T10:30:00.000Z",
      "updatedAt": "2024-03-15T10:35:00.000Z"
    }
  }
}
```

**Respuesta Error - Notificación no encontrada (404):**
```json
{
  "success": false,
  "error": {
    "code": "NOTIFICATION_NOT_FOUND",
    "message": "Notificación no encontrada o no pertenece al usuario"
  }
}
```

**Ejemplo cURL:**
```bash
curl -X PATCH http://localhost:4000/api/notifications/507f1f77bcf86cd799439011/read \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Ejemplo Thunder Client / Postman:**
- Method: `PATCH`
- URL: `http://localhost:4000/api/notifications/507f1f77bcf86cd799439011/read`
- Headers:
  - `Authorization`: `Bearer <tu_token>`

---

### 3. Obtener Preferencias de Notificación

Obtiene las preferencias de notificación del usuario autenticado.

**Endpoint:** `GET /api/notifications/preferences`

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "_id": "507f1f77bcf86cd799439014",
      "userId": "507f191e810c19729de860ea",
      "subscriptionAlerts": true,
      "planAlerts": true,
      "weeklyDigest": false,
      "pushEnabled": false,
      "createdAt": "2024-03-10T08:00:00.000Z",
      "updatedAt": "2024-03-15T14:20:00.000Z"
    }
  }
}
```

**Ejemplo cURL:**
```bash
curl -X GET http://localhost:4000/api/notifications/preferences \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Ejemplo Thunder Client / Postman:**
- Method: `GET`
- URL: `http://localhost:4000/api/notifications/preferences`
- Headers:
  - `Authorization`: `Bearer <tu_token>`

---

### 4. Actualizar Preferencias de Notificación

Actualiza las preferencias de notificación del usuario autenticado.

**Endpoint:** `POST /api/notifications/preferences`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "subscriptionAlerts": false,
  "planAlerts": true,
  "weeklyDigest": true,
  "pushEnabled": false
}
```

**Nota:** Puedes enviar solo los campos que deseas actualizar (actualización parcial).

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "_id": "507f1f77bcf86cd799439014",
      "userId": "507f191e810c19729de860ea",
      "subscriptionAlerts": false,
      "planAlerts": true,
      "weeklyDigest": true,
      "pushEnabled": false,
      "createdAt": "2024-03-10T08:00:00.000Z",
      "updatedAt": "2024-03-15T14:25:00.000Z"
    }
  }
}
```

**Respuesta Error - Validación (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "subscriptionAlerts must be a boolean value"
  }
}
```

**Ejemplo cURL:**
```bash
curl -X POST http://localhost:4000/api/notifications/preferences \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionAlerts": false,
    "weeklyDigest": true
  }'
```

**Ejemplo Thunder Client / Postman:**
- Method: `POST`
- URL: `http://localhost:4000/api/notifications/preferences`
- Headers:
  - `Authorization`: `Bearer <tu_token>`
  - `Content-Type`: `application/json`
- Body (raw JSON):
```json
{
  "subscriptionAlerts": false,
  "planAlerts": true,
  "weeklyDigest": true,
  "pushEnabled": false
}
```

---

## Tipos de Notificación

El campo `type` puede tener los siguientes valores:

| Tipo | Descripción | Preferencia Asociada |
|------|-------------|---------------------|
| `subscription` | Alertas sobre suscripciones detectadas | `subscriptionAlerts` |
| `plan_alert` | Alertas sobre planes de ahorro | `planAlerts` |
| `insight` | Insights generados por IA | `weeklyDigest` |
| `weekly_digest` | Resumen semanal de gastos | `weeklyDigest` |

---

## Códigos de Error

| Código | HTTP Status | Descripción |
|--------|-------------|-------------|
| `NO_TOKEN` | 401 | Token de autenticación no proporcionado |
| `INVALID_TOKEN` | 401 | Token JWT inválido o malformado |
| `TOKEN_EXPIRED` | 401 | Token JWT expirado |
| `UNAUTHORIZED` | 401 | Usuario no autenticado |
| `VALIDATION_ERROR` | 400 | Datos de entrada inválidos |
| `NOTIFICATION_NOT_FOUND` | 404 | Notificación no encontrada o no pertenece al usuario |
| `INTERNAL_SERVER_ERROR` | 500 | Error inesperado del servidor |

---

## Reglas de Negocio

### Creación de Notificaciones (Uso Interno)

Las notificaciones se crean internamente por el sistema (ej: Cron Jobs, eventos). El sistema verifica las preferencias del usuario antes de crear una notificación:

- Si `subscriptionAlerts` es `false`, no se crean notificaciones de tipo `subscription`
- Si `planAlerts` es `false`, no se crean notificaciones de tipo `plan_alert`
- Si `weeklyDigest` es `false`, no se crean notificaciones de tipo `insight` o `weekly_digest`

### Preferencias por Defecto

Cuando un usuario no tiene preferencias configuradas, se crean automáticamente con estos valores:

```json
{
  "subscriptionAlerts": true,
  "planAlerts": true,
  "weeklyDigest": true,
  "pushEnabled": false
}
```

### Seguridad

- Todos los endpoints requieren autenticación JWT
- Los usuarios solo pueden acceder a sus propias notificaciones
- El `userId` se extrae del token JWT, nunca del body de la petición
- Las notificaciones de otros usuarios no son accesibles

---

## Flujo de Prueba Completo

### 1. Autenticarse
```bash
# Registrar usuario
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "acceptedPrivacyPolicy": true
  }'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Guardar el token de la respuesta
```

### 2. Consultar Preferencias
```bash
curl -X GET http://localhost:4000/api/notifications/preferences \
  -H "Authorization: Bearer <token>"
```

### 3. Actualizar Preferencias
```bash
curl -X POST http://localhost:4000/api/notifications/preferences \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionAlerts": false
  }'
```

### 4. Consultar Notificaciones
```bash
curl -X GET http://localhost:4000/api/notifications \
  -H "Authorization: Bearer <token>"
```

### 5. Marcar Notificación como Leída
```bash
curl -X PATCH http://localhost:4000/api/notifications/<notification_id>/read \
  -H "Authorization: Bearer <token>"
```

---

## Notas Técnicas

- Las notificaciones se ordenan por `createdAt` descendente (más recientes primero)
- El límite por defecto es 20 notificaciones por consulta
- Las preferencias se crean automáticamente al primer acceso si no existen
- El sistema usa índices MongoDB optimizados para consultas eficientes
- Todas las fechas están en formato ISO 8601 (UTC)

---

## Próximas Fases

**Fase 2 - Cron Jobs:** Generación automática de notificaciones basadas en eventos del sistema.

**Fase 3 - Frontend:** Interfaz de usuario para visualizar y gestionar notificaciones.

---

**Documentación generada para:** Slice 8 - Notificaciones y Alertas Inteligentes - Fase 1 (Backend)  
**Versión:** 1.0.0  
**Fecha:** Marzo 2024
