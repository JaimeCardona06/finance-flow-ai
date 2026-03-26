# Implementation Plan: Notificaciones y Alertas Inteligentes - Fase 1 (Backend)

## Overview

Este plan implementa la infraestructura backend completa para el sistema de notificaciones de FinanceFlow AI. La implementación sigue una arquitectura de capas (modelos → servicios → controladores → rutas) y se organiza en 4 fases principales: Datos, Lógica de Negocio, API y Tests.

El sistema permitirá crear, consultar y gestionar notificaciones respetando las preferencias de cada usuario, con autenticación JWT obligatoria para cumplir con la Ley 1581 de 2012.

## Tasks

### Fase 1: Modelos de Datos

- [x] 1. Crear modelo Notification con schema Mongoose
  - Crear archivo `apps/api/src/models/Notification.ts`
  - Definir interface `INotification` extendiendo `Document`
  - Definir type `NotificationType` con valores: 'subscription', 'plan_alert', 'insight', 'weekly_digest'
  - Implementar schema con campos: userId (ObjectId ref User, required, indexed), type (enum, required), title (string, required, trim), message (string, required, trim), read (boolean, default false, indexed), actionUrl (string, optional, trim)
  - Configurar timestamps automáticos con `{ timestamps: true }`
  - Crear índice compuesto `{ userId: 1, createdAt: -1 }` para consultas ordenadas
  - Exportar modelo y tipos
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [ ]* 1.1 Escribir property test para validación de schema Notification
  - **Property 1: Notification Schema Validation**
  - **Valida: Requirements 1.1, 1.5, 3.8, 15.2, 15.3**

- [x] 2. Crear modelo NotificationPreference con schema Mongoose
  - Crear archivo `apps/api/src/models/NotificationPreference.ts`
  - Definir interface `INotificationPreference` extendiendo `Document`
  - Implementar schema con campos: userId (ObjectId ref User, required, unique, indexed), subscriptionAlerts (boolean, default true), planAlerts (boolean, default true), weeklyDigest (boolean, default true), pushEnabled (boolean, default false)
  - Configurar timestamps automáticos con `{ timestamps: true }`
  - Exportar modelo y tipos
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 2.1 Escribir property test para valores por defecto de preferencias
  - **Property 19: Default Preference Values**
  - **Valida: Requirements 2.5**

- [ ]* 2.2 Escribir property test para índice único en userId
  - **Property 18: Unique Preference per User**
  - **Valida: Requirements 2.2**

### Fase 2: Lógica de Negocio (Servicios)

- [x] 3. Implementar notificationService.ts con funciones de negocio
  - Crear archivo `apps/api/src/services/notificationService.ts`
  - Definir interfaces TypeScript: `CreateNotificationData`, `UpdatePreferencesData`
  - Importar modelos Notification y NotificationPreference
  - Implementar función `createNotification()` con validación de preferencias
  - Implementar función `getUserNotifications()` con paginación
  - Implementar función `markAsRead()` con validación de ownership
  - Implementar función `getUserPreferences()` con creación de defaults
  - Implementar función `updateUserPreferences()` con upsert
  - Exportar todas las funciones y tipos
  - _Requirements: 3.1, 3.2, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 7.3, 7.4, 7.5, 7.6_

- [x]* 3.1 Escribir property test para validación de ObjectId
  - **Property 2: ObjectId Validation**
  - **Valida: Requirements 3.7, 4.7, 5.1, 6.4, 7.1, 15.1**

- [ ]* 3.2 Escribir property test para timestamps automáticos
  - **Property 3: Automatic Timestamps**
  - **Valida: Requirements 1.7, 2.4, 7.7**

- [x]* 3.3 Escribir property test para filtrado por preferencias
  - **Property 4: Preference-Based Notification Filtering**
  - **Valida: Requirements 3.3, 3.4, 3.5**

- [x]* 3.4 Escribir property test para creación de preferencias por defecto
  - **Property 5: Default Preferences Creation**
  - **Valida: Requirements 3.2, 6.2, 6.5**

- [x]* 3.5 Escribir property test para creación de notificación con preferencias válidas
  - **Property 6: Notification Creation with Valid Preferences**
  - **Valida: Requirements 3.6**

- [x]* 3.6 Escribir property test para recuperación de notificaciones por usuario
  - **Property 7: User-Specific Notification Retrieval**
  - **Valida: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

- [x]* 3.7 Escribir property test para array vacío en usuarios nuevos
  - **Property 8: Empty Notification Array for New Users**
  - **Valida: Requirements 4.6**

- [x]* 3.8 Escribir property test para autorización en markAsRead
  - **Property 9: Authorization for Mark as Read**
  - **Valida: Requirements 5.2, 13.2**

- [x]* 3.9 Escribir property test para markAsRead retorna null si no existe
  - **Property 10: Mark as Read Returns Null for Not Found**
  - **Valida: Requirements 5.3**

- [x]* 3.10 Escribir property test para actualización y persistencia en markAsRead
  - **Property 11: Mark as Read Updates and Persists**
  - **Valida: Requirements 5.4, 5.5, 5.6**

- [x]* 3.11 Escribir property test para idempotencia de markAsRead
  - **Property 12: Mark as Read Idempotency**
  - **Valida: Requirements 5.7**

- [x]* 3.12 Escribir property test para estructura de documento de preferencias
  - **Property 13: Preference Document Structure**
  - **Valida: Requirements 6.3**

- [x]* 3.13 Escribir property test para validación booleana de preferencias
  - **Property 14: Boolean Validation for Preferences**
  - **Valida: Requirements 7.2**

- [x]* 3.14 Escribir property test para comportamiento upsert de preferencias
  - **Property 15: Upsert Behavior for Preferences**
  - **Valida: Requirements 7.3, 7.6**

- [x]* 3.15 Escribir property test para actualizaciones parciales de preferencias
  - **Property 16: Partial Updates for Preferences**
  - **Valida: Requirements 7.4**

- [ ]* 3.16 Escribir property test para valor de retorno de preferencias actualizadas
  - **Property 17: Updated Preference Return Value**
  - **Valida: Requirements 7.5**

- [x]* 3.17 Escribir property test para límite de consultas de notificaciones
  - **Property 29: Notification Query Performance**
  - **Valida: Requirements 16.4**

- [x] 4. Implementar validaciones y manejo de errores en notificationService
  - Agregar validación de ObjectId en todas las funciones (usar `mongoose.Types.ObjectId.isValid()`)
  - Agregar validación de campos requeridos (title, message no vacíos)
  - Lanzar errores descriptivos con mensajes claros
  - Validar tipos de datos en updateUserPreferences (campos booleanos)
  - _Requirements: 3.7, 3.8, 15.1, 15.2, 15.3_

- [x]* 4.1 Escribir unit tests para validaciones de campos requeridos
  - Testear error cuando title está vacío
  - Testear error cuando message está vacío
  - Testear error cuando userId es inválido
  - _Requirements: 3.8, 15.2_

### Fase 3: Capa de API (Controladores y Rutas)

- [x] 5. Implementar notificationController.ts con handlers HTTP
  - Crear archivo `apps/api/src/controllers/notificationController.ts`
  - Implementar función `getNotifications()` para GET /api/notifications
  - Implementar función `markNotificationAsRead()` para PATCH /api/notifications/:id/read
  - Implementar función `getPreferences()` para GET /api/notifications/preferences
  - Implementar función `updatePreferences()` para POST /api/notifications/preferences
  - Extraer userId de `req.userId` (inyectado por authMiddleware)
  - Implementar manejo de errores con códigos consistentes (VALIDATION_ERROR, NOTIFICATION_NOT_FOUND, INTERNAL_SERVER_ERROR, UNAUTHORIZED)
  - Retornar respuestas con formato estándar: `{ success: boolean, data?: object, error?: { code: string, message: string } }`
  - Loguear errores con `console.error()` para debugging
  - Exportar todas las funciones
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 15.4, 15.5, 15.6, 15.7_

- [ ]* 5.1 Escribir property test para extracción de userId del JWT
  - **Property 21: UserId Extraction from JWT**
  - **Valida: Requirements 9.1, 10.2, 11.1, 12.1**

- [ ]* 5.2 Escribir property test para formato de respuesta exitosa
  - **Property 22: Successful Response Format**
  - **Valida: Requirements 9.3, 10.4, 11.3, 12.5**

- [ ]* 5.3 Escribir property test para formato de error de validación
  - **Property 23: Validation Error Response Format**
  - **Valida: Requirements 9.5, 12.6**

- [ ]* 5.4 Escribir property test para respuesta de error 404
  - **Property 24: Not Found Error Response**
  - **Valida: Requirements 10.5**

- [ ]* 5.5 Escribir property test para formato de error interno del servidor
  - **Property 25: Internal Server Error Response Format**
  - **Valida: Requirements 9.4, 10.6, 11.4, 12.7, 15.5**

- [ ]* 5.6 Escribir property test para consistencia de códigos de error
  - **Property 26: Error Code Consistency**
  - **Valida: Requirements 15.6**

- [ ]* 5.7 Escribir property test para no exposición de detalles internos
  - **Property 27: No Internal Details in Errors**
  - **Valida: Requirements 15.7**

- [ ]* 5.8 Escribir property test para aislamiento de datos entre usuarios
  - **Property 28: Data Isolation Between Users**
  - **Valida: Requirements 13.3, 13.4**

- [ ]* 5.9 Escribir unit tests para manejo de errores en controllers
  - Testear respuesta 401 cuando req.userId no está presente
  - Testear respuesta 404 cuando notificación no existe
  - Testear respuesta 400 para validación de preferencias
  - _Requirements: 9.4, 10.5, 12.6_

- [x] 6. Crear notificationRoutes.ts con rutas protegidas
  - Crear archivo `apps/api/src/routes/notificationRoutes.ts`
  - Importar `authenticateToken` de `../middleware/authMiddleware`
  - Importar funciones del controller
  - Crear router de Express
  - Aplicar `authenticateToken` a todas las rutas con `router.use(authenticateToken)`
  - Definir ruta GET `/` → `getNotifications`
  - Definir ruta PATCH `/:id/read` → `markNotificationAsRead`
  - Definir ruta GET `/preferences` → `getPreferences`
  - Definir ruta POST `/preferences` → `updatePreferences`
  - Exportar router
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.7_

- [ ]* 6.1 Escribir property test para autenticación requerida en todos los endpoints
  - **Property 20: Authentication Required for All Endpoints**
  - **Valida: Requirements 8.5, 13.1**

- [x] 7. Integrar rutas de notificaciones en server.ts
  - Abrir archivo `apps/api/src/server.ts`
  - Importar `notificationRoutes` desde `./routes/notificationRoutes`
  - Montar rutas con `app.use('/api/notifications', notificationRoutes)` después de las rutas existentes
  - _Requirements: 8.6_

- [x] 8. Crear tipos compartidos en packages/shared
  - Crear archivo `packages/shared/src/types/notification.ts`
  - Definir type `NotificationType` con valores: 'subscription', 'plan_alert', 'insight', 'weekly_digest'
  - Definir interface `Notification` con campos: _id, userId, type, title, message, read, actionUrl?, createdAt, updatedAt (strings ISO 8601)
  - Definir interface `NotificationPreference` con campos: _id, userId, subscriptionAlerts, planAlerts, weeklyDigest, pushEnabled, createdAt, updatedAt
  - Exportar todos los tipos
  - Actualizar `packages/shared/src/index.ts` para exportar tipos de notificación
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.6_

### Fase 4: Tests y Validación

- [x] 9. Checkpoint - Verificar implementación completa
  - Ejecutar `npm run build` desde la raíz del monorepo para verificar compilación TypeScript
  - Verificar que no hay errores de tipos con `tsc --noEmit` en apps/api
  - Asegurar que todos los archivos están creados en las ubicaciones correctas
  - Verificar que las importaciones entre módulos funcionan correctamente
  - Preguntar al usuario si hay dudas o ajustes necesarios antes de continuar con tests

- [ ]* 10. Ejecutar suite completa de property tests
  - Ejecutar todos los property tests con `npm test` en apps/api
  - Verificar que los 29 properties pasan exitosamente
  - Revisar cobertura de código (objetivo: 80% backend, 70% controllers)
  - Corregir cualquier property test que falle

- [ ]* 11. Ejecutar suite completa de unit tests
  - Ejecutar unit tests con `npm test` en apps/api
  - Verificar casos edge específicos (usuario sin notificaciones, notificación ya leída, etc.)
  - Verificar manejo de errores (ObjectId inválido, campos faltantes, etc.)
  - Asegurar cobertura mínima de 80% en servicios y 70% en controllers

- [x] 12. Checkpoint final - Validación end-to-end
  - Verificar que el servidor inicia sin errores
  - Confirmar que las rutas están montadas correctamente en /api/notifications
  - Verificar que authMiddleware protege todos los endpoints
  - Confirmar que los índices de MongoDB se crean automáticamente
  - Asegurar que todos los tests pasan al 100%
  - Preguntar al usuario si desea realizar pruebas manuales con herramientas como Postman/Thunder Client

## Notes

- Las tareas marcadas con `*` son opcionales (tests) y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requirements específicos que implementa para trazabilidad
- Los checkpoints (tareas 9 y 12) aseguran validación incremental del progreso
- Los property tests validan propiedades universales con 100 iteraciones cada uno
- Los unit tests validan ejemplos específicos y casos edge
- La implementación sigue estrictamente el diseño técnico aprobado
- TypeScript estricto está habilitado para prevenir errores en tiempo de compilación
- Todos los endpoints requieren autenticación JWT para cumplir con Ley 1581 de 2012
