import mongoose, { Document, Schema } from 'mongoose';

/**
 * Interface para el log de resúmenes semanales
 * Usado para prevenir duplicados de weekly digest
 */
export interface IWeeklyDigestLog extends Document {
  userId: mongoose.Types.ObjectId;
  weekStartDate: Date;  // Monday of the week (normalized to midnight)
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema de WeeklyDigestLog
 * Índice único en (userId, weekStartDate) previene duplicados
 */
const weeklyDigestLogSchema = new Schema<IWeeklyDigestLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    weekStartDate: {
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
    collection: 'weeklyDigestLogs'
  }
);

// Índice único compuesto para prevenir duplicados
// Solo un digest por usuario por semana
weeklyDigestLogSchema.index(
  { userId: 1, weekStartDate: 1 },
  { unique: true }
);

export const WeeklyDigestLog = mongoose.model<IWeeklyDigestLog>(
  'WeeklyDigestLog',
  weeklyDigestLogSchema
);
