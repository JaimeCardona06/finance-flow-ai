"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.narrativeInsightSchema = exports.spendingPatternSchema = exports.actionSchema = exports.actionTypeSchema = exports.prioritySchema = void 0;
const zod_1 = require("zod");
const transaction_1 = require("./transaction");
exports.prioritySchema = zod_1.z.enum(['high', 'medium', 'low']);
exports.actionTypeSchema = zod_1.z.enum([
    'cancel_subscription',
    'set_limit',
    'find_alternative',
    'track_spending'
]);
exports.actionSchema = zod_1.z.object({
    label: zod_1.z.string(),
    type: zod_1.z.enum(['primary', 'secondary']),
    actionType: exports.actionTypeSchema,
    estimatedSavings: zod_1.z.number().optional(),
    data: zod_1.z.record(zod_1.z.unknown()).optional()
});
exports.spendingPatternSchema = zod_1.z.object({
    _id: zod_1.z.string(),
    userId: zod_1.z.string(),
    category: transaction_1.categorySchema,
    merchant: zod_1.z.string(),
    frequency: zod_1.z.number().int().positive(),
    totalAmount: zod_1.z.number().positive(),
    averageAmount: zod_1.z.number().positive(),
    periodStart: zod_1.z.string().datetime(),
    periodEnd: zod_1.z.string().datetime(),
    patternType: zod_1.z.enum(['recurring', 'temporal', 'subscription']),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime()
});
exports.narrativeInsightSchema = zod_1.z.object({
    _id: zod_1.z.string(),
    userId: zod_1.z.string(),
    patternId: zod_1.z.string().optional(),
    narrative: zod_1.z.string(),
    priority: exports.prioritySchema,
    pattern: zod_1.z.record(zod_1.z.unknown()),
    actions: zod_1.z.array(exports.actionSchema),
    aiMetadata: zod_1.z.object({
        model: zod_1.z.string().default('gemini-flash'),
        confidence: zod_1.z.number().min(0).max(1).optional(),
        generatedAt: zod_1.z.string().datetime()
    }).optional(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime()
});
//# sourceMappingURL=insight.js.map