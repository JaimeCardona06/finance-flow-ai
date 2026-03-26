import mongoose, { Document, Schema } from 'mongoose';

/**
 * Interface para el documento de Preferencias de Notificación en MongoDB
 */
export interface INotificationPreference extends Document {
  userId: mongoose.Types.ObjectId;
  subscriptionAlerts: boolean;
  planAlerts: boolean;
  weeklyDigest: boolean;
  pushEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema de Preferencias de Notificación con validaciones
 */
const notificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El userId es requerido'],
      unique: true,
      index: true
    },
    subscriptionAlerts: {
      type: Boolean,
      default: true
    },
    planAlerts: {
      type: Boolean,
      default: true
    },
    weeklyDigest: {
      type: Boolean,
      default: true
    },
    pushEnabled: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    collection: 'notificationPreferences'
  }
);

/**
 * Modelo de Preferencias de Notificación
 */
export const NotificationPreference = mongoose.model<INotificationPreference>(
  'NotificationPreference',
  notificationPreferenceSchema
);
