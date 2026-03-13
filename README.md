# FinanceFlow AI

Sistema de análisis financiero especializado en detectar, categorizar y narrar insights sobre gastos hormiga (micro-gastos) en Colombia.

## 🎯 Propósito

Hacer visible lo invisible: transformar transacciones bancarias en narrativas accionables que ayudan a los usuarios a tomar conciencia de patrones de gasto ocultos.

**Diferenciador clave**: La IA como narradora de insights, no como tabla de datos.

## 🏗️ Arquitectura

Monorepo con npm Workspaces:

```
financeflow-ai/
├── apps/
│   ├── web/          # Frontend - Next.js 14
│   └── api/          # Backend - Node.js + Express
├── packages/
│   ├── ui/           # Componentes UI compartidos
│   └── shared/       # Types, utils, constants
└── docs/             # Documentación
```

## 🚀 Quick Start

```bash
# Instalar dependencias
npm install

# Iniciar todos los servicios en desarrollo
npm run dev

# Frontend: http://localhost:3000
# Backend: http://localhost:4000
```

## 📦 Workspaces

- **@financeflow/web**: Frontend con Next.js 14, React 18, Tailwind CSS, Framer Motion
- **@financeflow/api**: Backend con Node.js 20, Express, MongoDB Atlas, Gemini Flash
- **@financeflow/ui**: Componentes UI reutilizables con animaciones
- **@financeflow/shared**: Types, schemas de validación y utilidades compartidas

## 🛠️ Stack Tecnológico

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript 5.3+
- Tailwind CSS 3.4+
- Framer Motion 11+
- React Hook Form + Zod
- TanStack Query

### Backend
- Node.js 20 LTS
- Express.js 4.18+
- MongoDB Atlas + Mongoose
- Redis 7+ (cache)
- JWT (autenticación)
- Google Gemini Flash (IA)
- Winston (logging)

## 📋 Scripts

```bash
# Desarrollo
npm run dev              # Inicia todos los servicios

# Build
npm run build            # Build de todos los workspaces

# Testing
npm run test             # Tests de todos los workspaces

# Linting
npm run lint             # Lint de todos los workspaces

# Formatting
npm run format           # Format con Prettier
```

## 🔒 Cumplimiento Legal

FinanceFlow AI cumple estrictamente con la **Ley 1581 de 2012** de Protección de Datos Personales de Colombia:

- Consentimiento informado antes de procesar datos financieros
- Encriptación de datos sensibles (AES-256 en reposo, TLS 1.3 en tránsit)
- Implementación de derechos ARCO (Acceso, Rectificación, Cancelación, Oposición)
- Auditoría de accesos a datos sensibles

## 📖 Documentación

- [Solution Document](docs/Solution-Document.md): Arquitectura y decisiones técnicas
- [Product Discovery](docs/Product-Discovery-Document.md): Problema y solución
- [Agents](agents.md): Guía para desarrolladores

## 🎨 Filosofía de Diseño

**Regla de Oro**: La IA debe ser una narradora de insights, no una tabla de datos.

Principios:
- Narrativa sobre datos crudos
- Insights accionables
- Experiencia visual memorable
- Simplicidad que no abruma

## 📝 Metodología

Desarrollo por **slices verticales**:

1. Slice 1: Onboarding y Primera Importación
2. Slice 2: Primer Insight Wow
3. Slice 3: Detección de Suscripciones y Análisis Temporal
4. Slice 4: Comparación Histórica y Progreso
5. Slice 5: Plan de Choque (Acciones y Seguimiento)

**Regla**: No se inicia un nuevo slice sin un commit limpio del anterior.

## 🤝 Contribución

Este es un proyecto privado. Para contribuir:

1. Seguir la arquitectura de monorepo estricta
2. Respetar las reglas de dependencias entre workspaces
3. Cumplir con los estándares de código (TypeScript strict mode)
4. Escribir tests para nueva funcionalidad
5. Hacer commit solo cuando el slice esté completo

## 📄 Licencia

Privado - Todos los derechos reservados
