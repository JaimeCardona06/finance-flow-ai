/**
 * Tipos de notificación disponibles en el sistema
 */
export type NotificationType = 'subscription' | 'plan_alert' | 'insight' | 'weekly_digest';

/**
 * Interface para Notificación
 */
export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Interface para Preferencias de Notificación
 */
export interface NotificationPreference {
  _id: string;
  userId: string;
  subscriptionAlerts: boolean;
  planAlerts: boolean;
  weeklyDigest: boolean;
  pushEnabled: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
