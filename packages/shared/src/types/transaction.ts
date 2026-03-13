import { z } from 'zod';

/**
 * Categorías de gastos hormiga en Colombia
 */
export const categorySchema = z.enum([
  'café/bebidas',
  'comida rápida',
  'transporte',
  'suscripciones',
  'entretenimiento',
  'misceláneos'
]);

export type Category = z.infer<typeof categorySchema>;

/**
 * Schema de validación para Transaction
 */
export const transactionSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  date: z.string().datetime(), // ISO 8601
  description: z.string().min(1).max(255),
  amount: z.number().positive({
    message: 'El monto debe ser mayor a cero'
  }),
  category: categorySchema.optional(),
  merchant: z.string().optional(),
  isMicroExpense: z.boolean().default(false),
  rawData: z.record(z.unknown()).optional(), // Datos originales del CSV
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type Transaction = z.infer<typeof transactionSchema>;

/**
 * Schema para importación de transacción desde CSV
 */
export const transactionImportSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Fecha inválida. Formato esperado: YYYY-MM-DD'
  }),
  description: z.string().min(1, {
    message: 'La descripción es requerida'
  }).max(255, {
    message: 'La descripción no puede exceder 255 caracteres'
  }),
  amount: z.number().positive({
    message: 'El monto debe ser mayor a cero'
  }),
  category: categorySchema.optional()
});

export type TransactionImport = z.infer<typeof transactionImportSchema>;

/**
 * Constante: Límite para clasificar como micro-gasto (en COP)
 */
export const MICRO_EXPENSE_THRESHOLD = 50000; // $50.000 COP
