import mongoose, { Document, Schema } from 'mongoose';

/**
 * Tipos de notificación disponibles en el sistema
 */
export type NotificationType = 'subscription' | 'plan_alert' | 'insight' | 'weekly_digest';

/**
 * Interface para el documento de Notificación en MongoDB
 */
export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema de Notificación con validaciones
 */
const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El userId es requerido'],
      index: true
    },
    type: {
      type: String,
      enum: {
        values: ['subscription', 'plan_alert', 'insight', 'weekly_digest'],
        message: 'Tipo de notificación inválido: {VALUE}'
      },
      required: [true, 'El tipo de notificación es requerido']
    },
    title: {
      type: String,
      required: [true, 'El título es requerido'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'El mensaje es requerido'],
      trim: true
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    },
    actionUrl: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    collection: 'notifications'
  }
);

/**
 * Índice compuesto para consultas eficientes ordenadas por fecha
 * Optimiza queries del tipo: find({ userId }).sort({ createdAt: -1 })
 */
notificationSchema.index({ userId: 1, createdAt: -1 });

/**
 * Modelo de Notificación
 */
export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
