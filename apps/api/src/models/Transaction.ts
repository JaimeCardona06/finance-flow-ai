import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  description: string;
  amount: number;
  date: string; // ISO 8601 format
  category?: string;
  merchant?: string;
  isMicroExpense: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: String,
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: [
        'café/bebidas',
        'comida rápida',
        'comida',
        'transporte',
        'suscripciones',
        'entretenimiento',
        'hogar',
        'salud',
        'educación',
        'servicios',
        'misceláneos'
      ],
      default: 'misceláneos',
      lowercase: true // Convertir a minúsculas automáticamente
    },
    merchant: {
      type: String,
      trim: true
    },
    isMicroExpense: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'transactions'
  }
);

// Índice compuesto para consultas frecuentes
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, category: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
