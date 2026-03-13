# @financeflow/ui

Componentes UI compartidos de FinanceFlow AI.

## Stack

- React 18
- TypeScript 5.3+
- Tailwind CSS
- Framer Motion

## Uso

```typescript
import { InsightCard, Button } from '@financeflow/ui';

function MyComponent() {
  return (
    <InsightCard insight={data} index={0} />
  );
}
```

## Estructura

```
packages/ui/
├── src/
│   ├── components/   # Componentes reutilizables
│   ├── animations/   # Variantes de Framer Motion
│   └── index.ts      # Exports públicos
```

## Principios

- Componentes reutilizables sin lógica de negocio
- Animaciones con Framer Motion integradas
- Estilos con Tailwind CSS
- Props type-safe con TypeScript
