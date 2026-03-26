# Requirements Document

## Introduction

Este documento define los requerimientos para el Slice 8: Notificaciones y Alertas Inteligentes - Fase 1 (Backend) de FinanceFlow AI. Esta fase implementa la infraestructura backend completa para el sistema de notificaciones, incluyendo modelos de datos, servicios, controladores y rutas API. El sistema permitirá notificar a los usuarios sobre eventos importantes relacionados con suscripciones, planes de ahorro, insights generados y resúmenes semanales, respetando las preferencias de notificación de cada usuario.

El alcance de esta fase se limita exclusivamente al backend, preparando la base para los Cron Jobs (Fase 2) y la interfaz de usuario (Fase 3).

## Glossary

- **Notification_System**: Sistema backend que gestiona la creación, almacenamiento y recuperación de notificaciones
- **Notification**: Mensaje generado por el sistema para informar al usuario sobre eventos relevantes
- **Notification_Preference**: Configuración del usuario que determina qué tipos de notificaciones desea recibir
- **Notification_Service**: Servicio que implementa la lógica de negocio para notificaciones
- **Notification_Controller**: Controlador HTTP que maneja las peticiones relacionadas con notificaciones
- **User**: Usuario autenticado del sistema FinanceFlow AI
- **Notification_Type**: Categoría de notificación (subscription, plan_alert, insight, weekly_digest)
- **MongoDB**: Base de datos MongoDB Atlas utilizada para persistencia
- **Mongoose**: ODM (Object Document Mapper) para interactuar con MongoDB
- **JWT**: JSON Web Token utilizado para autenticación
- **Auth_Middleware**: Middleware de Express que valida tokens JWT

## Requirements

### Requirement 1: Notification Data Model

**User Story:** Como desarrollador del sistema, quiero un modelo de datos robusto para notificaciones, para que pueda almacenar y consultar notificaciones de manera eficiente.

#### Acceptance Criteria

1. THE Notification_System SHALL define a Mongoose schema with fields: userId (ObjectId reference to User), type (enum: 'subscription', 'plan_alert', 'insight', 'weekly_digest'), title (string, required), message (string, required), read (boolean, default false), actionUrl (string, optional), createdAt (Date, auto-generated), updatedAt (Date, auto-generated)
2. THE Notification_System SHALL create an index on userId field for efficient user-specific queries
3. THE Notification_System SHALL create a compound index on userId and createdAt fields for efficient sorting
4. THE Notification_System SHALL create an index on read field for filtering unread notifications
5. THE Notification_System SHALL validate that type field contains only allowed enum values
6. THE Notification_System SHALL store notifications in a collection named 'notifications'
7. THE Notification_System SHALL enable automatic timestamps using Mongoose timestamps option

### Requirement 2: Notification Preference Data Model

**User Story:** Como usuario, quiero controlar qué tipos de notificaciones recibo, para que solo me lleguen las alertas que considero relevantes.

#### Acceptance Criteria

1. THE Notification_System SHALL define a Mongoose schema for NotificationPreference with fields: userId (ObjectId reference to User, unique), subscriptionAlerts (boolean, default true), planAlerts (boolean, default true), weeklyDigest (boolean, default true), pushEnabled (boolean, default false), createdAt (Date, auto-generated), updatedAt (Date, auto-generated)
2. THE Notification_System SHALL create a unique index on userId field to ensure one preference document per user
3. THE Notification_System SHALL store notification preferences in a collection named 'notificationPreferences'
4. THE Notification_System SHALL enable automatic timestamps using Mongoose timestamps option
5. THE Notification_System SHALL set default values for all boolean preference fields when creating new preference documents

### Requirement 3: Create Notification with Preference Validation

**User Story:** Como sistema, quiero crear notificaciones respetando las preferencias del usuario, para que solo se almacenen notificaciones que el usuario desea recibir.

#### Acceptance Criteria

1. WHEN the Notification_Service receives a request to create a notification, THE Notification_Service SHALL retrieve the user's notification preferences from MongoDB
2. IF the user has no notification preferences configured, THEN THE Notification_Service SHALL create default preferences with all notification types enabled
3. WHEN the notification type is 'subscription' and subscriptionAlerts is false, THE Notification_Service SHALL not create the notification and return null
4. WHEN the notification type is 'plan_alert' and planAlerts is false, THE Notification_Service SHALL not create the notification and return null
5. WHEN the notification type is 'insight' or 'weekly_digest' and the corresponding preference is false, THE Notification_Service SHALL not create the notification and return null
6. WHEN the user's preference allows the notification type, THE Notification_Service SHALL create and save the notification document in MongoDB
7. WHEN creating a notification, THE Notification_Service SHALL validate that userId is a valid MongoDB ObjectId
8. WHEN creating a notification, THE Notification_Service SHALL validate that title and message are non-empty strings
9. IF the notification creation fails due to validation errors, THEN THE Notification_Service SHALL throw a descriptive error

### Requirement 4: Retrieve User Notifications

**User Story:** Como usuario, quiero ver mis notificaciones más recientes, para que pueda estar informado sobre eventos importantes en mi cuenta.

#### Acceptance Criteria

1. WHEN the Notification_Service receives a request to get user notifications, THE Notification_Service SHALL query MongoDB for notifications matching the userId
2. THE Notification_Service SHALL sort notifications by createdAt field in descending order (newest first)
3. THE Notification_Service SHALL limit the results to 20 notifications by default
4. WHERE a custom limit is provided, THE Notification_Service SHALL use the provided limit value
5. THE Notification_Service SHALL return an array of notification documents with all fields
6. WHEN no notifications exist for the user, THE Notification_Service SHALL return an empty array
7. THE Notification_Service SHALL validate that userId is a valid MongoDB ObjectId before querying

### Requirement 5: Mark Notification as Read

**User Story:** Como usuario, quiero marcar notificaciones como leídas, para que pueda distinguir entre notificaciones nuevas y ya revisadas.

#### Acceptance Criteria

1. WHEN the Notification_Service receives a request to mark a notification as read, THE Notification_Service SHALL validate that notificationId is a valid MongoDB ObjectId
2. THE Notification_Service SHALL query MongoDB for a notification matching both notificationId and userId
3. IF no notification is found matching both notificationId and userId, THEN THE Notification_Service SHALL return null
4. WHEN a matching notification is found, THE Notification_Service SHALL update the read field to true
5. THE Notification_Service SHALL save the updated notification document to MongoDB
6. THE Notification_Service SHALL return the updated notification document
7. WHEN the notification is already marked as read, THE Notification_Service SHALL return the notification without error

### Requirement 6: Retrieve User Notification Preferences

**User Story:** Como usuario, quiero consultar mis preferencias de notificación actuales, para que pueda saber qué alertas tengo habilitadas.

#### Acceptance Criteria

1. WHEN the Notification_Service receives a request to get user preferences, THE Notification_Service SHALL query MongoDB for preferences matching the userId
2. IF no preferences exist for the user, THEN THE Notification_Service SHALL create default preferences with all notification types enabled
3. THE Notification_Service SHALL return a preference document with fields: subscriptionAlerts, planAlerts, weeklyDigest, pushEnabled
4. THE Notification_Service SHALL validate that userId is a valid MongoDB ObjectId before querying
5. WHEN preferences are created with default values, THE Notification_Service SHALL save them to MongoDB before returning

### Requirement 7: Update User Notification Preferences

**User Story:** Como usuario, quiero actualizar mis preferencias de notificación, para que pueda controlar qué tipos de alertas recibo.

#### Acceptance Criteria

1. WHEN the Notification_Service receives a request to update preferences, THE Notification_Service SHALL validate that userId is a valid MongoDB ObjectId
2. THE Notification_Service SHALL validate that provided preference fields are boolean values
3. THE Notification_Service SHALL use findOneAndUpdate with upsert option to create or update preferences
4. WHEN updating preferences, THE Notification_Service SHALL only update fields provided in the request data
5. THE Notification_Service SHALL return the updated preference document
6. WHEN no preferences exist for the user, THE Notification_Service SHALL create new preferences with provided values and defaults for omitted fields
7. THE Notification_Service SHALL update the updatedAt timestamp automatically via Mongoose

### Requirement 8: Notification API Endpoints

**User Story:** Como desarrollador frontend, quiero endpoints REST para gestionar notificaciones, para que pueda integrar la funcionalidad en la interfaz de usuario.

#### Acceptance Criteria

1. THE Notification_System SHALL expose a GET endpoint at /api/notifications that requires authentication via Auth_Middleware
2. THE Notification_System SHALL expose a PATCH endpoint at /api/notifications/:id/read that requires authentication via Auth_Middleware
3. THE Notification_System SHALL expose a GET endpoint at /api/notifications/preferences that requires authentication via Auth_Middleware
4. THE Notification_System SHALL expose a POST endpoint at /api/notifications/preferences that requires authentication via Auth_Middleware
5. WHEN an unauthenticated request is received, THE Notification_System SHALL return HTTP 401 with error code 'NO_TOKEN' or 'INVALID_TOKEN'
6. THE Notification_System SHALL register notification routes in the Express application
7. THE Notification_System SHALL use Notification_Controller to handle all notification endpoint logic

### Requirement 9: Get Notifications Endpoint Handler

**User Story:** Como usuario autenticado, quiero obtener mis notificaciones vía API, para que la aplicación frontend pueda mostrarlas.

#### Acceptance Criteria

1. WHEN a GET request is received at /api/notifications, THE Notification_Controller SHALL extract userId from the authenticated request
2. THE Notification_Controller SHALL call Notification_Service.getUserNotifications with the userId
3. WHEN notifications are retrieved successfully, THE Notification_Controller SHALL return HTTP 200 with JSON response containing success: true, data: { notifications: array }
4. IF an error occurs during retrieval, THEN THE Notification_Controller SHALL return HTTP 500 with error code 'INTERNAL_SERVER_ERROR'
5. THE Notification_Controller SHALL handle validation errors and return HTTP 400 with descriptive error messages
6. THE Notification_Controller SHALL log errors to console for debugging purposes

### Requirement 10: Mark as Read Endpoint Handler

**User Story:** Como usuario autenticado, quiero marcar notificaciones como leídas vía API, para que pueda gestionar el estado de mis notificaciones.

#### Acceptance Criteria

1. WHEN a PATCH request is received at /api/notifications/:id/read, THE Notification_Controller SHALL extract notificationId from URL parameters
2. THE Notification_Controller SHALL extract userId from the authenticated request
3. THE Notification_Controller SHALL call Notification_Service.markAsRead with notificationId and userId
4. WHEN the notification is marked as read successfully, THE Notification_Controller SHALL return HTTP 200 with JSON response containing success: true, data: { notification: object }
5. IF the notification is not found or does not belong to the user, THEN THE Notification_Controller SHALL return HTTP 404 with error code 'NOTIFICATION_NOT_FOUND'
6. IF an error occurs during update, THEN THE Notification_Controller SHALL return HTTP 500 with error code 'INTERNAL_SERVER_ERROR'
7. THE Notification_Controller SHALL validate that notificationId is a valid MongoDB ObjectId format

### Requirement 11: Get Preferences Endpoint Handler

**User Story:** Como usuario autenticado, quiero consultar mis preferencias de notificación vía API, para que la aplicación frontend pueda mostrar mi configuración actual.

#### Acceptance Criteria

1. WHEN a GET request is received at /api/notifications/preferences, THE Notification_Controller SHALL extract userId from the authenticated request
2. THE Notification_Controller SHALL call Notification_Service.getUserPreferences with the userId
3. WHEN preferences are retrieved successfully, THE Notification_Controller SHALL return HTTP 200 with JSON response containing success: true, data: { preferences: object }
4. IF an error occurs during retrieval, THEN THE Notification_Controller SHALL return HTTP 500 with error code 'INTERNAL_SERVER_ERROR'
5. THE Notification_Controller SHALL ensure default preferences are created if none exist

### Requirement 12: Update Preferences Endpoint Handler

**User Story:** Como usuario autenticado, quiero actualizar mis preferencias de notificación vía API, para que pueda controlar qué alertas recibo.

#### Acceptance Criteria

1. WHEN a POST request is received at /api/notifications/preferences, THE Notification_Controller SHALL extract userId from the authenticated request
2. THE Notification_Controller SHALL extract preference data from request body
3. THE Notification_Controller SHALL validate that preference fields are boolean values
4. THE Notification_Controller SHALL call Notification_Service.updateUserPreferences with userId and preference data
5. WHEN preferences are updated successfully, THE Notification_Controller SHALL return HTTP 200 with JSON response containing success: true, data: { preferences: object }
6. IF validation fails, THEN THE Notification_Controller SHALL return HTTP 400 with error code 'VALIDATION_ERROR' and descriptive details
7. IF an error occurs during update, THEN THE Notification_Controller SHALL return HTTP 500 with error code 'INTERNAL_SERVER_ERROR'

### Requirement 13: Data Privacy Compliance

**User Story:** Como usuario colombiano, quiero que mis datos de notificaciones estén protegidos según la Ley 1581 de 2012, para que mi información personal esté segura.

#### Acceptance Criteria

1. THE Notification_System SHALL require authentication via JWT for all notification endpoints
2. THE Notification_System SHALL ensure users can only access their own notifications by validating userId from JWT
3. THE Notification_System SHALL ensure users can only access their own preferences by validating userId from JWT
4. THE Notification_System SHALL not expose notification data of other users in any API response
5. THE Notification_System SHALL log access to notification data for audit purposes
6. THE Notification_System SHALL store notification data in MongoDB Atlas with encryption at rest
7. THE Notification_System SHALL transmit notification data over HTTPS with TLS 1.3

### Requirement 14: TypeScript Type Safety

**User Story:** Como desarrollador, quiero tipos TypeScript estrictos para notificaciones, para que pueda prevenir errores en tiempo de compilación.

#### Acceptance Criteria

1. THE Notification_System SHALL define TypeScript interfaces for Notification document extending Mongoose Document
2. THE Notification_System SHALL define TypeScript interfaces for NotificationPreference document extending Mongoose Document
3. THE Notification_System SHALL define TypeScript types for notification creation data
4. THE Notification_System SHALL define TypeScript types for preference update data
5. THE Notification_System SHALL enable strict mode in TypeScript configuration
6. THE Notification_System SHALL export all notification-related types from service modules
7. THE Notification_System SHALL use typed Mongoose models with generic type parameters

### Requirement 15: Error Handling and Validation

**User Story:** Como desarrollador, quiero manejo robusto de errores en el sistema de notificaciones, para que los fallos sean predecibles y debuggeables.

#### Acceptance Criteria

1. WHEN invalid MongoDB ObjectId is provided, THE Notification_System SHALL throw a validation error with descriptive message
2. WHEN required fields are missing in notification creation, THE Notification_System SHALL throw a validation error listing missing fields
3. WHEN invalid notification type is provided, THE Notification_System SHALL throw a validation error with allowed values
4. WHEN database operations fail, THE Notification_System SHALL log the error with stack trace
5. WHEN database operations fail, THE Notification_System SHALL return appropriate HTTP status codes (400 for validation, 500 for server errors)
6. THE Notification_System SHALL include error codes in all error responses for client-side handling
7. THE Notification_System SHALL not expose internal error details (like database connection strings) in API responses

### Requirement 16: Performance and Indexing

**User Story:** Como usuario con muchas notificaciones, quiero que las consultas sean rápidas, para que la aplicación responda sin demoras.

#### Acceptance Criteria

1. THE Notification_System SHALL create a compound index on (userId, createdAt) for efficient sorted queries
2. THE Notification_System SHALL create an index on userId field for user-specific queries
3. THE Notification_System SHALL create an index on read field for filtering unread notifications
4. THE Notification_System SHALL limit notification queries to 20 results by default to prevent performance issues
5. THE Notification_System SHALL use lean() queries when full Mongoose documents are not needed
6. THE Notification_System SHALL execute notification queries in under 100ms for datasets up to 10,000 notifications per user
7. THE Notification_System SHALL use MongoDB Atlas connection pooling for efficient database connections
