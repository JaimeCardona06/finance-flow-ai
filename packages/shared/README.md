# @financeflow/shared

Código compartido entre apps de FinanceFlow AI.

## Contenido

- **Types**: Interfaces TypeScript compartidas
- **Schemas**: Validación con Zod
- **Constants**: Constantes del dominio
- **Utils**: Funciones utilitarias

## Uso

```typescript
import { 
  type Transaction, 
  type User,
  transactionSchema,
  MICRO_EXPENSE_THRESHOLD 
} from '@financeflow/shared';

// Validar datos
const result = transactionSchema.safeParse(data);

// Usar constantes
if (amount < MICRO_EXPENSE_THRESHOLD) {
  // Es un micro-gasto
}
```

## Estructura

```
packages/shared/
├── src/
│   ├── types/        # Types e interfaces
│   ├── utils/        # Funciones utilitarias
│   ├── constants/    # Constantes
│   └── index.ts      # Exports públicos
```

## Reglas

- No puede importar de `apps/*` ni `packages/ui`
- Solo código que sea útil para múltiples apps
- Schemas de Zod para validación compartida
