import { z } from 'zod';
import { categorySchema } from './transaction';

/**
 * Prioridad de un insight
 */
export const prioritySchema = z.enum(['high', 'medium', 'low']);
export type Priority = z.infer<typeof prioritySchema>;

/**
 * Tipo de acción sugerida
 */
export const actionTypeSchema = z.enum([
  'cancel_subscription',
  'set_limit',
  'find_alternative',
  'track_spending'
]);
export type ActionType = z.infer<typeof actionTypeSchema>;

/**
 * Schema para acción sugerida
 */
export const actionSchema = z.object({
  label: z.string(),
  type: z.enum(['primary', 'secondary']),
  actionType: actionTypeSchema,
  estimatedSavings: z.number().optional(),
  data: z.record(z.unknown()).optional()
});

export type Action = z.infer<typeof actionSchema>;

/**
 * Schema para patrón de gasto
 */
export const spendingPatternSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  category: categorySchema,
  merchant: z.string(),
  frequency: z.number().int().positive(),
  totalAmount: z.number().positive(),
  averageAmount: z.number().positive(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  patternType: z.enum(['recurring', 'temporal', 'subscription']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type SpendingPattern = z.infer<typeof spendingPatternSchema>;

/**
 * Schema para insight narrativo generado por IA
 */
export const narrativeInsightSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  patternId: z.string().optional(),
  narrative: z.string(),
  priority: prioritySchema,
  pattern: z.record(z.unknown()), // Estructura flexible para datos del patrón
  actions: z.array(actionSchema),
  aiMetadata: z.object({
    model: z.string().default('gemini-flash'),
    confidence: z.number().min(0).max(1).optional(),
    generatedAt: z.string().datetime()
  }).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type NarrativeInsight = z.infer<typeof narrativeInsightSchema>;
