import mongoose, { Document, Schema } from 'mongoose';

/**
 * Interface para el log de alertas de suscripciones
 * Usado para prevenir duplicados de subscription alerts
 */
export interface ISubscriptionAlertLog extends Document {
  userId: mongoose.Types.ObjectId;
  merchant: string;
  expectedChargeDate: Date;  // Normalized to date only (midnight)
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema de SubscriptionAlertLog
 * Índice único en (userId, merchant, expectedChargeDate) previene duplicados
 */
const subscriptionAlertLogSchema = new Schema<ISubscriptionAlertLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    merchant: {
      type: String,
      required: true,
      trim: true
    },
    expectedChargeDate: {
      type: Date,
      required: true,
      index: true
    },
    sentAt: {
      type: Date,
      required: true,
      default: Date.now
    }
  },
  {
    timestamps: true,
    collection: 'subscriptionAlertLogs'
  }
);

// Índice único compuesto para prevenir duplicados
// Solo una alerta por usuario + merchant + fecha esperada
subscriptionAlertLogSchema.index(
  { userId: 1, merchant: 1, expectedChargeDate: 1 },
  { unique: true }
);

export const SubscriptionAlertLog = mongoose.model<ISubscriptionAlertLog>(
  'SubscriptionAlertLog',
  subscriptionAlertLogSchema
);
