import mongoose, { Schema, Document } from 'mongoose';

export interface ISavingsPlan extends Document {
  userId: mongoose.Types.ObjectId;
  category: string;
  targetAmount: number;
  currentAmount: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'failed';
  notified80?: boolean;      // Has 80% threshold been notified?
  notified100?: boolean;     // Has 100% threshold been notified?
  lastAlertDate?: Date;      // Last time any alert was sent
  createdAt: Date;
  updatedAt: Date;
  getProgressPercentage(): number;
  updateStatus(): void;
}

const SavingsPlanSchema = new Schema<ISavingsPlan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 0
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'failed'],
      default: 'active'
    },
    notified80: {
      type: Boolean,
      default: false
    },
    notified100: {
      type: Boolean,
      default: false
    },
    lastAlertDate: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: 'savingsPlans'
  }
);

// Índice compuesto para búsquedas eficientes
SavingsPlanSchema.index({ userId: 1, status: 1 });
SavingsPlanSchema.index({ userId: 1, category: 1, status: 1 });

// Método para calcular el porcentaje de progreso
SavingsPlanSchema.methods.getProgressPercentage = function(): number {
  if (this.targetAmount === 0) return 0;
  return Math.round((this.currentAmount / this.targetAmount) * 100);
};

// Método para verificar si el plan debe cambiar de estado
SavingsPlanSchema.methods.updateStatus = function(): void {
  const now = new Date();
  
  if (this.currentAmount >= this.targetAmount) {
    this.status = 'failed'; // Superó el límite de gasto
  } else if (now > this.endDate) {
    this.status = 'completed'; // Terminó el período sin superar el límite
  }
};

export const SavingsPlan = mongoose.model<ISavingsPlan>('SavingsPlan', SavingsPlanSchema);
