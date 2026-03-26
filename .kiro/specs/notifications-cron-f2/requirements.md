# Requirements Document: Notifications Backend - Phase 2 (Cron Jobs Automation)

## Introduction

Esta fase implementa la automatización de notificaciones mediante cron jobs que detectan eventos y crean notificaciones sin intervención manual. El sistema ejecutará trabajos programados para alertas de suscripciones, presupuestos de planes de ahorro, y resúmenes semanales de gastos.

Esta es la Fase 2 del Slice 8: Notificaciones y Alertas Inteligentes. La Fase 1 (ya completada) implementó el backend API, modelos y servicio de notificaciones. Esta fase construye sobre esa base para agregar detección automática de eventos.

## Glossary

- **Cron_Job**: Tarea programada que se ejecuta automáticamente en intervalos definidos usando node-cron
- **Notification_Service**: Servicio existente en apps/api/src/services/notificationService.ts que maneja la creación de notificaciones
- **Subscription**: Cargo recurrente detectado en transacciones del usuario (modelo Transaction)
- **Savings_Plan**: Plan de ahorro con presupuesto objetivo (modelo SavingsPlan)
- **User_Preferences**: Configuración de notificaciones del usuario (modelo NotificationPreference)
- **Colombia_Time**: Zona horaria America/Bogota (UTC-5)
- **Job_Registry**: Sistema de registro de cron jobs en server.ts al iniciar la aplicación
- **Budget_Threshold**: Porcentaje del presupuesto gastado que dispara una alerta (80% o 100%)
- **Weekly_Digest**: Resumen semanal de patrones de gasto y tendencias
- **Expiring_Subscription**: Suscripción con próximo cargo en 24-48 horas

## Requirements

### Requirement 1: Subscription Alerts Job

**User Story:** Como usuario, quiero recibir alertas automáticas cuando mis suscripciones estén por renovarse, para poder decidir si cancelarlas o mantenerlas.

#### Acceptance Criteria

1. THE Subscription_Alerts_Job SHALL execute daily at 9:00 AM Colombia_Time
2. WHEN the Subscription_Alerts_Job executes, THE Job SHALL query all transactions with recurring patterns
3. WHEN a Subscription has next charge date within 24-48 hours, THE Job SHALL identify it as Expiring_Subscription
4. FOR ALL Expiring_Subscription detected, THE Job SHALL call Notification_Service.createNotification with type 'subscription'
5. THE Subscription_Alerts_Job SHALL respect User_Preferences for subscriptionAlerts
6. WHEN Notification_Service returns null (preference disabled), THE Job SHALL skip notification creation without error
7. THE Subscription_Alerts_Job SHALL log execution start, end, and count of notifications created
8. IF the Subscription_Alerts_Job encounters an error, THEN THE Job SHALL log the error and continue execution without crashing
9. THE Subscription_Alerts_Job SHALL be defined in apps/api/src/jobs/subscriptionAlertsJob.ts
10. THE Subscription_Alerts_Job SHALL use node-cron for scheduling

### Requirement 2: Budget Alerts Job

**User Story:** Como usuario, quiero recibir alertas cuando esté cerca de exceder el presupuesto de mis planes de ahorro, para poder ajustar mi comportamiento de gasto.

#### Acceptance Criteria

1. THE Budget_Alerts_Job SHALL execute every 6 hours
2. WHEN the Budget_Alerts_Job executes, THE Job SHALL query all active Savings_Plan documents
3. FOR ALL active Savings_Plan, THE Job SHALL calculate current spending percentage against targetAmount
4. WHEN spending reaches 80% of targetAmount AND no alert has been sent for 80% threshold, THE Job SHALL create notification with type 'plan_alert'
5. WHEN spending reaches 100% of targetAmount AND no alert has been sent for 100% threshold, THE Job SHALL create notification with type 'plan_alert'
6. THE Budget_Alerts_Job SHALL respect User_Preferences for planAlerts
7. THE Budget_Alerts_Job SHALL prevent duplicate alerts by tracking which thresholds have been notified
8. THE Budget_Alerts_Job SHALL log execution start, end, and count of notifications created
9. IF the Budget_Alerts_Job encounters an error, THEN THE Job SHALL log the error and continue execution without crashing
10. THE Budget_Alerts_Job SHALL be defined in apps/api/src/jobs/budgetAlertsJob.ts
11. THE Budget_Alerts_Job SHALL use node-cron for scheduling

### Requirement 3: Weekly Digest Job

**User Story:** Como usuario, quiero recibir un resumen semanal de mis patrones de gasto, para mantener conciencia financiera sin revisar la app constantemente.

#### Acceptance Criteria

1. THE Weekly_Digest_Job SHALL execute every Monday at 8:00 AM Colombia_Time
2. WHEN the Weekly_Digest_Job executes, THE Job SHALL query all active users
3. FOR ALL active users, THE Job SHALL analyze transactions from the previous 7 days
4. THE Weekly_Digest_Job SHALL calculate total spending, top categories, and spending trends
5. THE Weekly_Digest_Job SHALL generate a summary message with key insights
6. THE Weekly_Digest_Job SHALL call Notification_Service.createNotification with type 'weekly_digest'
7. THE Weekly_Digest_Job SHALL respect User_Preferences for weeklyDigest
8. THE Weekly_Digest_Job SHALL skip users with zero transactions in the previous 7 days
9. THE Weekly_Digest_Job SHALL log execution start, end, and count of notifications created
10. IF the Weekly_Digest_Job encounters an error, THEN THE Job SHALL log the error and continue execution without crashing
11. THE Weekly_Digest_Job SHALL be defined in apps/api/src/jobs/weeklyDigestJob.ts
12. THE Weekly_Digest_Job SHALL use node-cron for scheduling

### Requirement 4: Job Registry and Initialization

**User Story:** Como desarrollador, quiero que todos los cron jobs se registren automáticamente al iniciar el servidor, para asegurar que las notificaciones automáticas funcionen sin configuración manual.

#### Acceptance Criteria

1. THE Job_Registry SHALL be implemented in apps/api/src/jobs/index.ts
2. THE Job_Registry SHALL export a function initializeJobs() that starts all cron jobs
3. THE server.ts SHALL call initializeJobs() after successful MongoDB connection
4. WHEN initializeJobs() is called, THE Job_Registry SHALL start Subscription_Alerts_Job, Budget_Alerts_Job, and Weekly_Digest_Job
5. THE Job_Registry SHALL log successful initialization of each job
6. IF any job fails to initialize, THEN THE Job_Registry SHALL log the error and continue initializing remaining jobs
7. THE Job_Registry SHALL not crash the server if job initialization fails

### Requirement 5: Error Handling and Logging

**User Story:** Como desarrollador, quiero que los cron jobs tengan manejo robusto de errores y logging detallado, para poder diagnosticar problemas sin afectar la disponibilidad del sistema.

#### Acceptance Criteria

1. THE Cron_Job SHALL wrap all execution logic in try-catch blocks
2. WHEN a Cron_Job encounters an error, THE Job SHALL log the error with timestamp, job name, and error details
3. THE Cron_Job SHALL use console.error for error logging (consistent with existing codebase)
4. THE Cron_Job SHALL use console.log for informational logging (job start, end, counts)
5. THE Cron_Job SHALL continue running on schedule even after encountering errors
6. THE Cron_Job SHALL not throw unhandled exceptions that could crash the server

### Requirement 6: Timezone Handling

**User Story:** Como usuario colombiano, quiero que las notificaciones se envíen en horarios apropiados para Colombia, no en UTC.

#### Acceptance Criteria

1. THE Cron_Job SHALL use timezone option 'America/Bogota' in node-cron configuration
2. THE Subscription_Alerts_Job SHALL execute at 9:00 AM Colombia_Time (not UTC)
3. THE Weekly_Digest_Job SHALL execute at 8:00 AM Colombia_Time (not UTC)
4. THE Budget_Alerts_Job SHALL execute every 6 hours regardless of timezone (no specific time requirement)

### Requirement 7: Subscription Detection Logic

**User Story:** Como usuario, quiero que el sistema detecte correctamente cuándo mis suscripciones están por renovarse, basándose en patrones de cargos recurrentes.

#### Acceptance Criteria

1. THE Subscription_Alerts_Job SHALL identify subscriptions by querying transactions with category 'suscripciones'
2. THE Subscription_Alerts_Job SHALL group transactions by merchant to identify recurring patterns
3. WHEN a merchant has charges with consistent monthly frequency, THE Job SHALL calculate next expected charge date
4. THE Subscription_Alerts_Job SHALL consider a subscription as expiring when next charge date is between 24 and 48 hours from now
5. THE notification message SHALL include merchant name, estimated amount, and next charge date
6. THE notification actionUrl SHALL be '/subscriptions' to allow user to review subscriptions

### Requirement 8: Budget Threshold Tracking

**User Story:** Como usuario, quiero recibir solo una alerta por cada umbral de presupuesto (80% y 100%), no alertas repetidas cada 6 horas.

#### Acceptance Criteria

1. THE Budget_Alerts_Job SHALL track which thresholds have been notified for each Savings_Plan
2. WHEN a Savings_Plan reaches 80% threshold for the first time, THE Job SHALL create notification and mark 80% as notified
3. WHEN a Savings_Plan reaches 100% threshold for the first time, THE Job SHALL create notification and mark 100% as notified
4. THE Budget_Alerts_Job SHALL not create duplicate notifications for thresholds already notified
5. WHEN a Savings_Plan is updated or reset, THE threshold tracking SHALL reset to allow new notifications
6. THE threshold tracking SHALL be stored in the Savings_Plan document (new fields: notified80, notified100)

### Requirement 9: Weekly Digest Content

**User Story:** Como usuario, quiero que el resumen semanal incluya información relevante y accionable, no solo números sin contexto.

#### Acceptance Criteria

1. THE Weekly_Digest_Job SHALL calculate total spending for the previous 7 days
2. THE Weekly_Digest_Job SHALL identify the top 3 spending categories
3. THE Weekly_Digest_Job SHALL compare current week spending to previous week (trend: up, down, stable)
4. THE notification message SHALL include total spending, top categories, and trend
5. THE notification message SHALL be formatted in Spanish with Colombian currency (COP)
6. THE notification actionUrl SHALL be '/analysis' to allow user to see detailed analysis
7. THE notification title SHALL be "Resumen Semanal de Gastos"

### Requirement 10: Performance and Scalability

**User Story:** Como desarrollador, quiero que los cron jobs sean eficientes y no degraden el rendimiento del sistema, incluso con muchos usuarios.

#### Acceptance Criteria

1. THE Cron_Job SHALL use MongoDB aggregation pipelines for efficient data queries
2. THE Cron_Job SHALL process users in batches to avoid memory issues with large user bases
3. THE Cron_Job SHALL use indexed fields (userId, date, category) in queries
4. THE Cron_Job SHALL limit query results to necessary fields only (projection)
5. THE Cron_Job SHALL complete execution within reasonable time (< 5 minutes for 1000 users)

### Requirement 11: Dependencies and Package Management

**User Story:** Como desarrollador, quiero que todas las dependencias necesarias estén correctamente instaladas y documentadas.

#### Acceptance Criteria

1. THE apps/api/package.json SHALL include node-cron as a dependency
2. THE apps/api/package.json SHALL include @types/node-cron as a dev dependency
3. THE node-cron version SHALL be ^3.0.0 or higher
4. THE package.json SHALL be updated before implementing cron jobs

### Requirement 12: Integration with Existing Notification Service

**User Story:** Como desarrollador, quiero que los cron jobs reutilicen el servicio de notificaciones existente, sin duplicar lógica.

#### Acceptance Criteria

1. THE Cron_Job SHALL import createNotification from '../services/notificationService'
2. THE Cron_Job SHALL call createNotification with proper CreateNotificationData structure
3. THE Cron_Job SHALL handle null return value from createNotification (preference disabled)
4. THE Cron_Job SHALL not implement custom notification creation logic
5. THE Cron_Job SHALL not bypass User_Preferences validation

### Requirement 13: Testing and Validation

**User Story:** Como desarrollador, quiero poder validar que los cron jobs funcionan correctamente sin esperar a que se ejecuten en producción.

#### Acceptance Criteria

1. THE Cron_Job SHALL export the job execution function separately from the cron schedule
2. THE exported function SHALL be testable independently of node-cron
3. THE Cron_Job SHALL accept optional parameters for testing (e.g., custom date range)
4. THE Job_Registry SHALL support a test mode that executes jobs immediately instead of scheduling

### Requirement 14: Graceful Shutdown

**User Story:** Como desarrollador, quiero que los cron jobs se detengan correctamente cuando el servidor se apaga, sin dejar procesos huérfanos.

#### Acceptance Criteria

1. THE Job_Registry SHALL export a function stopAllJobs() that stops all running cron jobs
2. THE server.ts SHALL call stopAllJobs() on SIGTERM and SIGINT signals
3. WHEN stopAllJobs() is called, THE Job_Registry SHALL stop all cron jobs gracefully
4. THE Job_Registry SHALL log successful shutdown of each job

### Requirement 15: SavingsPlan Model Extension

**User Story:** Como desarrollador, quiero extender el modelo SavingsPlan para soportar el tracking de alertas de presupuesto.

#### Acceptance Criteria

1. THE SavingsPlan model SHALL include optional field notified80 (boolean, default: false)
2. THE SavingsPlan model SHALL include optional field notified100 (boolean, default: false)
3. THE SavingsPlan model SHALL include optional field lastAlertDate (Date, optional)
4. THE model changes SHALL be backward compatible with existing documents
5. THE model changes SHALL not require migration of existing data
