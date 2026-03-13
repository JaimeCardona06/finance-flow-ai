# @financeflow/web

Frontend de FinanceFlow AI construido con Next.js 14 (App Router).

## Stack

- Next.js 14
- React 18
- TypeScript 5.3+
- Tailwind CSS
- Framer Motion
- React Hook Form + Zod
- TanStack Query

## Desarrollo

```bash
# Desde la raíz del monorepo
npm run dev

# O específicamente este workspace
npm run dev --workspace=@financeflow/web
```

El servidor de desarrollo corre en http://localhost:3000

## Estructura

```
apps/web/
├── app/              # Rutas y páginas (App Router)
├── components/       # Componentes específicos de la app
├── lib/              # Utilidades y helpers
└── public/           # Assets estáticos
```
