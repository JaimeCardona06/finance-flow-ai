import { z } from 'zod';
export declare const prioritySchema: z.ZodEnum<["high", "medium", "low"]>;
export type Priority = z.infer<typeof prioritySchema>;
export declare const actionTypeSchema: z.ZodEnum<["cancel_subscription", "set_limit", "find_alternative", "track_spending"]>;
export type ActionType = z.infer<typeof actionTypeSchema>;
export declare const actionSchema: z.ZodObject<{
    label: z.ZodString;
    type: z.ZodEnum<["primary", "secondary"]>;
    actionType: z.ZodEnum<["cancel_subscription", "set_limit", "find_alternative", "track_spending"]>;
    estimatedSavings: z.ZodOptional<z.ZodNumber>;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    type: "primary" | "secondary";
    label: string;
    actionType: "cancel_subscription" | "set_limit" | "find_alternative" | "track_spending";
    data?: Record<string, unknown> | undefined;
    estimatedSavings?: number | undefined;
}, {
    type: "primary" | "secondary";
    label: string;
    actionType: "cancel_subscription" | "set_limit" | "find_alternative" | "track_spending";
    data?: Record<string, unknown> | undefined;
    estimatedSavings?: number | undefined;
}>;
export type Action = z.infer<typeof actionSchema>;
export declare const spendingPatternSchema: z.ZodObject<{
    _id: z.ZodString;
    userId: z.ZodString;
    category: z.ZodEnum<["café/bebidas", "comida rápida", "transporte", "suscripciones", "entretenimiento", "misceláneos"]>;
    merchant: z.ZodString;
    frequency: z.ZodNumber;
    totalAmount: z.ZodNumber;
    averageAmount: z.ZodNumber;
    periodStart: z.ZodString;
    periodEnd: z.ZodString;
    patternType: z.ZodEnum<["recurring", "temporal", "subscription"]>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    createdAt: string;
    updatedAt: string;
    _id: string;
    userId: string;
    category: "café/bebidas" | "comida rápida" | "transporte" | "suscripciones" | "entretenimiento" | "misceláneos";
    merchant: string;
    frequency: number;
    totalAmount: number;
    averageAmount: number;
    periodStart: string;
    periodEnd: string;
    patternType: "recurring" | "temporal" | "subscription";
}, {
    createdAt: string;
    updatedAt: string;
    _id: string;
    userId: string;
    category: "café/bebidas" | "comida rápida" | "transporte" | "suscripciones" | "entretenimiento" | "misceláneos";
    merchant: string;
    frequency: number;
    totalAmount: number;
    averageAmount: number;
    periodStart: string;
    periodEnd: string;
    patternType: "recurring" | "temporal" | "subscription";
}>;
export type SpendingPattern = z.infer<typeof spendingPatternSchema>;
export declare const narrativeInsightSchema: z.ZodObject<{
    _id: z.ZodString;
    userId: z.ZodString;
    patternId: z.ZodOptional<z.ZodString>;
    narrative: z.ZodString;
    priority: z.ZodEnum<["high", "medium", "low"]>;
    pattern: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    actions: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        type: z.ZodEnum<["primary", "secondary"]>;
        actionType: z.ZodEnum<["cancel_subscription", "set_limit", "find_alternative", "track_spending"]>;
        estimatedSavings: z.ZodOptional<z.ZodNumber>;
        data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        type: "primary" | "secondary";
        label: string;
        actionType: "cancel_subscription" | "set_limit" | "find_alternative" | "track_spending";
        data?: Record<string, unknown> | undefined;
        estimatedSavings?: number | undefined;
    }, {
        type: "primary" | "secondary";
        label: string;
        actionType: "cancel_subscription" | "set_limit" | "find_alternative" | "track_spending";
        data?: Record<string, unknown> | undefined;
        estimatedSavings?: number | undefined;
    }>, "many">;
    aiMetadata: z.ZodOptional<z.ZodObject<{
        model: z.ZodDefault<z.ZodString>;
        confidence: z.ZodOptional<z.ZodNumber>;
        generatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        model: string;
        generatedAt: string;
        confidence?: number | undefined;
    }, {
        generatedAt: string;
        model?: string | undefined;
        confidence?: number | undefined;
    }>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    createdAt: string;
    updatedAt: string;
    _id: string;
    userId: string;
    narrative: string;
    priority: "high" | "medium" | "low";
    pattern: Record<string, unknown>;
    actions: {
        type: "primary" | "secondary";
        label: string;
        actionType: "cancel_subscription" | "set_limit" | "find_alternative" | "track_spending";
        data?: Record<string, unknown> | undefined;
        estimatedSavings?: number | undefined;
    }[];
    patternId?: string | undefined;
    aiMetadata?: {
        model: string;
        generatedAt: string;
        confidence?: number | undefined;
    } | undefined;
}, {
    createdAt: string;
    updatedAt: string;
    _id: string;
    userId: string;
    narrative: string;
    priority: "high" | "medium" | "low";
    pattern: Record<string, unknown>;
    actions: {
        type: "primary" | "secondary";
        label: string;
        actionType: "cancel_subscription" | "set_limit" | "find_alternative" | "track_spending";
        data?: Record<string, unknown> | undefined;
        estimatedSavings?: number | undefined;
    }[];
    patternId?: string | undefined;
    aiMetadata?: {
        generatedAt: string;
        model?: string | undefined;
        confidence?: number | undefined;
    } | undefined;
}>;
export type NarrativeInsight = z.infer<typeof narrativeInsightSchema>;
//# sourceMappingURL=insight.d.ts.map