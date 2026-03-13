# @financeflow/api

Backend de FinanceFlow AI construido con Node.js + Express.

## Stack

- Node.js 20 LTS
- Express.js
- TypeScript 5.3+
- MongoDB Atlas + Mongoose
- Redis (cache)
- JWT (autenticación)
- Google Gemini Flash (IA)

## Desarrollo

```bash
# Desde la raíz del monorepo
npm run dev

# O específicamente este workspace
npm run dev --workspace=@financeflow/api
```

El servidor de desarrollo corre en http://localhost:4000

## Estructura

```
apps/api/
├── src/
│   ├── routes/       # Endpoints REST
│   ├── services/     # Lógica de negocio
│   ├── middleware/   # Auth, validation, error handling
│   ├── db/           # Database queries y schemas
│   └── server.ts     # Entry point
```

## Variables de Entorno

Crear archivo `.env` en `apps/api/`:

```
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
JWT_SECRET=...
GEMINI_API_KEY=...
```
