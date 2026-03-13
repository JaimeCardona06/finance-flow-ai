/**
 * @financeflow/shared
 * 
 * Código compartido entre apps de FinanceFlow AI
 * Incluye: types, schemas de validación, constantes y utilidades
 */

// Types y schemas de User
export {
  type User,
  type UserRegistration,
  type UserLogin,
  userSchema,
  userRegistrationSchema,
  userLoginSchema
} from './types/user';

// Types y schemas de Transaction
export {
  type Transaction,
  type TransactionImport,
  type Category,
  transactionSchema,
  transactionImportSchema,
  categorySchema,
  MICRO_EXPENSE_THRESHOLD
} from './types/transaction';

// Types y schemas de Insight
export {
  type NarrativeInsight,
  type SpendingPattern,
  type Action,
  type Priority,
  type ActionType,
  narrativeInsightSchema,
  spendingPatternSchema,
  actionSchema,
  prioritySchema,
  actionTypeSchema
} from './types/insight';
