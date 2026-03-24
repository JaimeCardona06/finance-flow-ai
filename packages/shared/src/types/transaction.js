"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MICRO_EXPENSE_THRESHOLD = exports.transactionImportSchema = exports.transactionSchema = exports.categorySchema = void 0;
const zod_1 = require("zod");
exports.categorySchema = zod_1.z.enum([
    'café/bebidas',
    'comida rápida',
    'transporte',
    'suscripciones',
    'entretenimiento',
    'misceláneos'
]);
exports.transactionSchema = zod_1.z.object({
    _id: zod_1.z.string(),
    userId: zod_1.z.string(),
    date: zod_1.z.string().datetime(),
    description: zod_1.z.string().min(1).max(255),
    amount: zod_1.z.number().positive({
        message: 'El monto debe ser mayor a cero'
    }),
    category: exports.categorySchema.optional(),
    merchant: zod_1.z.string().optional(),
    isMicroExpense: zod_1.z.boolean().default(false),
    rawData: zod_1.z.record(zod_1.z.unknown()).optional(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime()
});
exports.transactionImportSchema = zod_1.z.object({
    date: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Fecha inválida. Formato esperado: YYYY-MM-DD'
    }),
    description: zod_1.z.string().min(1, {
        message: 'La descripción es requerida'
    }).max(255, {
        message: 'La descripción no puede exceder 255 caracteres'
    }),
    amount: zod_1.z.number().positive({
        message: 'El monto debe ser mayor a cero'
    }),
    category: exports.categorySchema.optional()
});
exports.MICRO_EXPENSE_THRESHOLD = 50000;
//# sourceMappingURL=transaction.js.map