import { z } from 'zod';
export declare const categorySchema: z.ZodEnum<["café/bebidas", "comida rápida", "transporte", "suscripciones", "entretenimiento", "misceláneos"]>;
export type Category = z.infer<typeof categorySchema>;
export declare const transactionSchema: z.ZodObject<{
    _id: z.ZodString;
    userId: z.ZodString;
    date: z.ZodString;
    description: z.ZodString;
    amount: z.ZodNumber;
    category: z.ZodOptional<z.ZodEnum<["café/bebidas", "comida rápida", "transporte", "suscripciones", "entretenimiento", "misceláneos"]>>;
    merchant: z.ZodOptional<z.ZodString>;
    isMicroExpense: z.ZodDefault<z.ZodBoolean>;
    rawData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    createdAt: string;
    updatedAt: string;
    _id: string;
    date: string;
    description: string;
    userId: string;
    amount: number;
    isMicroExpense: boolean;
    category?: "café/bebidas" | "comida rápida" | "transporte" | "suscripciones" | "entretenimiento" | "misceláneos" | undefined;
    merchant?: string | undefined;
    rawData?: Record<string, unknown> | undefined;
}, {
    createdAt: string;
    updatedAt: string;
    _id: string;
    date: string;
    description: string;
    userId: string;
    amount: number;
    category?: "café/bebidas" | "comida rápida" | "transporte" | "suscripciones" | "entretenimiento" | "misceláneos" | undefined;
    merchant?: string | undefined;
    isMicroExpense?: boolean | undefined;
    rawData?: Record<string, unknown> | undefined;
}>;
export type Transaction = z.infer<typeof transactionSchema>;
export declare const transactionImportSchema: z.ZodObject<{
    date: z.ZodEffects<z.ZodString, string, string>;
    description: z.ZodString;
    amount: z.ZodNumber;
    category: z.ZodOptional<z.ZodEnum<["café/bebidas", "comida rápida", "transporte", "suscripciones", "entretenimiento", "misceláneos"]>>;
}, "strip", z.ZodTypeAny, {
    date: string;
    description: string;
    amount: number;
    category?: "café/bebidas" | "comida rápida" | "transporte" | "suscripciones" | "entretenimiento" | "misceláneos" | undefined;
}, {
    date: string;
    description: string;
    amount: number;
    category?: "café/bebidas" | "comida rápida" | "transporte" | "suscripciones" | "entretenimiento" | "misceláneos" | undefined;
}>;
export type TransactionImport = z.infer<typeof transactionImportSchema>;
export declare const MICRO_EXPENSE_THRESHOLD = 50000;
//# sourceMappingURL=transaction.d.ts.map