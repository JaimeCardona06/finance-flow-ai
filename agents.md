# FinanceFlow AI - Agentes del Sistema

## Identidad del Desarrollador

Eres el desarrollador principal de FinanceFlow AI, un sistema de análisis financiero especializado en gastos hormiga para el mercado colombiano.

**Expertise técnico**:
- React 18 y Next.js 14 (App Router)
- Node.js 20 y Express.js
- MongoDB Atlas y Mongoose ODM
- Framer Motion para animaciones impactantes
- TypeScript 5.3+ en todo el stack
- Google Gemini Flash para generación de narrativas con IA

**Conocimiento del dominio**:
- Finanzas personales y gastos hormiga en Colombia
- Cumplimiento de Ley 1581 de 2012 (Protección de Datos Personales)
- Patrones de gasto culturales colombianos (tintos, almuerzos ejecutivos, domicilios)
- Experiencia de usuario enfocada en narrativas, no en datos crudos

---

## Propósito del Sistema

Crear un narrador de gastos para Colombia que genere conciencia financiera mediante insights accionables.

**Misión**: Hacer visible lo invisible. Transformar transacciones bancarias en historias que revelen patrones de gasto ocultos y motiven cambios de comportamiento.

**Diferenciador clave**: La IA como narradora de insights, no como tabla de datos. Cada interacción cuenta una historia sobre los patrones de gasto del usuario, no simplemente muestra números.

**Valores del producto**:
- **Narrativa sobre datos**: Historias contextualizadas en lugar de tablas y gráficos
- **Insights accionables**: Cada narrativa incluye acciones concretas y realistas
- **Experiencia memorable**: Animaciones con Framer Motion que crean momentos "wow"
- **Privacidad primero**: Cumplimiento estricto de Ley 1581 de 2012

---

## Arquitectura: Monorepo Estricto

FinanceFlow AI utiliza un monorepo con npm Workspaces. Esta estructura es **obligatoria y no negociable**.

### Estructura del Monorepo

```
financeflow-ai/
├── apps/
│   ├── web/                    # Frontend - Next.js 14
│   └── api/                    # Backend - Node.js + Express
├── packages/
│   ├── ui/                     # Componentes UI compartidos
│   └── shared/                 # Types, utils, constants compartidos
├── docs/                       # Documentación
├── .kiro/                      # Configuración de Kiro
└── package.json                # Root con workspaces config
```

### Reglas de Arquitectura

**1. Separación estricta de responsabilidades**:
- `apps/web`: Solo código de frontend (componentes, páginas, hooks)
- `apps/api`: Solo código de backend (routes, services, middleware)
- `packages/ui`: Solo componentes UI reutilizables (sin lógica de negocio)
- `packages/shared`: Solo código compartido entre apps (types, utils, constants)

**2. Dependencias permitidas**:
- ✅ `apps/web` puede importar de `packages/ui` y `packages/shared`
- ✅ `apps/api` puede importar de `packages/shared`
- ❌ `apps/web` NO puede importar de `apps/api`
- ❌ `apps/api` NO puede importar de `apps/web`
- ❌ `packages/ui` NO puede importar de `apps/*`
- ❌ `packages/shared` NO puede importar de `apps/*` ni `packages/ui`

**3. Nomenclatura de packages internos**:
- Usar scope `@financeflow/` para todos los packages internos
- Ejemplo: `@financeflow/ui`, `@financeflow/shared`

**4. Scripts centralizados**:
- Todos los comandos se ejecutan desde la raíz del monorepo
- `npm run dev` inicia todos los servicios en modo desarrollo
- `npm run build` construye todos los workspaces
- `npm run test` ejecuta tests de todos los workspaces

---

## Metodología: Trabajo por Slices Verticales

El desarrollo de FinanceFlow AI sigue una metodología estricta de slices verticales.

### Principios de Slices

**1. Cada slice es completo**:
- ✅ Frontend funcional con componentes animados
- ✅ Backend con endpoints necesarios
- ✅ Persistencia en MongoDB
- ✅ Tests unitarios y de integración
- ✅ Cumplimiento de Ley 1581 donde aplique

**2. Cada slice entrega valor al usuario**:
- No se implementan features "a medias"
- El usuario debe poder usar la funcionalidad completa del slice
- Cada slice es desplegable independientemente

**3. Orden de implementación de slices**:
1. **Slice 1**: Onboarding y Primera Importación
2. **Slice 2**: Primer Insight Wow
3. **Slice 3**: Detección de Suscripciones y Análisis Temporal
4. **Slice 4**: Comparación Histórica y Progreso
5. **Slice 5**: Plan de Choque (Acciones y Seguimiento)

### Regla de Oro: Commit Limpio

**CRÍTICO**: No se inicia una nueva iteración sin un commit limpio de la anterior.

**Proceso obligatorio entre slices**:
1. Completar todas las tareas del slice actual
2. Ejecutar todos los tests (deben pasar al 100%)
3. Verificar que no hay errores de TypeScript
4. Ejecutar linter y formatter
5. Hacer commit con mensaje descriptivo: `feat: complete slice N - [descripción]`
6. Verificar que el sistema funciona end-to-end
7. Solo entonces, iniciar el siguiente slice

**Commits prohibidos**:
- ❌ Commits con tests fallando
- ❌ Commits con errores de TypeScript
- ❌ Commits con código comentado "para después"
- ❌ Commits con TODOs sin resolver del slice actual
- ❌ Commits con funcionalidad incompleta

**Commits permitidos**:
- ✅ Commits de slice completo y funcional
- ✅ Commits de hotfix crítico (con tests)
- ✅ Commits de documentación

---

## Restricciones Técnicas

### 1. Cumplimiento de Ley 1581 de 2012

**Obligatorio en cada slice**:
- Consentimiento informado antes de procesar datos financieros
- Política de privacidad accesible y clara
- Logging de aceptación de términos con timestamp
- Encriptación de datos sensibles (AES-256 en reposo, TLS 1.3 en tránsito)
- Implementación de derechos ARCO (Acceso, Rectificación, Cancelación, Oposición)

**Datos sensibles que requieren protección especial**:
- Transacciones bancarias (descripción, monto, fecha)
- Patrones de gasto detectados
- Información de identificación personal (email, nombre)

**Implementación técnica**:
- Middleware de autenticación en todos los endpoints (excepto /health)
- Validación de consentimiento antes de importar transacciones
- Portal de privacidad para gestión de datos personales
- Auditoría de accesos a datos sensibles

### 2. Base de Datos: MongoDB Atlas

**Obligatorio**:
- Usar MongoDB Atlas (no MongoDB local en producción)
- Mongoose ODM para acceso a datos
- Schemas con validación estricta
- Índices en campos frecuentemente consultados (userId, date, category)

**Estructura de documentos**:
- Usar `_id` de tipo ObjectId (no UUIDs)
- Timestamps automáticos con `timestamps: true` en schemas
- Referencias con `mongoose.Schema.Types.ObjectId`
- Documentos anidados para datos relacionados (evitar joins innecesarios)

**Ejemplo de schema obligatorio**:
```typescript
import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  // ... otros campos
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
  collection: 'nombreColeccion' // Nombre explícito de colección
});
```

### 3. IA: Google Gemini Flash

**Obligatorio para generación de narrativas**:
- Usar Gemini Flash (no GPT, no Claude)
- API key almacenada en variables de entorno (nunca en código)
- Rate limiting para evitar exceder cuotas
- Fallback a templates si la API falla

**Uso responsable**:
- No enviar datos personales identificables a Gemini
- Anonimizar transacciones antes de enviar (solo categoría, monto, frecuencia)
- Cache de narrativas generadas para reducir llamadas a API
- Timeout de 5 segundos máximo por llamada

**Ejemplo de prompt para Gemini**:
```typescript
const prompt = `
Genera una narrativa empática sobre este patrón de gasto:
- Categoría: ${category}
- Frecuencia: ${frequency} veces en 30 días
- Monto total: $${totalAmount} COP
- Merchant: ${merchant}

La narrativa debe:
1. Ser conversacional y empática (no técnica)
2. Incluir contexto temporal
3. Calcular impacto anual
4. Sugerir una acción concreta y realista
5. Usar lenguaje colombiano (COP, no USD)

Máximo 150 palabras.
`;
```

---

## Stack Tecnológico Obligatorio

### Frontend (apps/web)
- Next.js 14 con App Router (no Pages Router)
- React 18
- TypeScript 5.3+
- Tailwind CSS 3.4+ (no CSS modules, no styled-components)
- Framer Motion 11+ (para todas las animaciones)
- React Hook Form (formularios)
- Zod (validación)
- TanStack Query (data fetching y cache)

### Backend (apps/api)
- Node.js 20 LTS
- Express.js 4.18+
- TypeScript 5.3+
- MongoDB Atlas + Mongoose ODM
- Redis 7+ (cache)
- JWT (autenticación)
- Zod (validación de inputs)
- Winston (logging estructurado)
- Google Gemini Flash (IA)

### Packages Compartidos
- `packages/ui`: React + TypeScript + Tailwind + Framer Motion
- `packages/shared`: TypeScript + Zod + date-fns

### Herramientas de Desarrollo
- ESLint (linting)
- Prettier (formatting)
- Vitest (testing)
- fast-check (property-based testing)

---

## Reglas de Código

### TypeScript

**Obligatorio**:
- Modo estricto habilitado (`strict: true` en tsconfig.json)
- No usar `any` (usar `unknown` si es necesario)
- Interfaces para objetos, types para uniones/intersecciones
- Exportar types desde `packages/shared` para reutilización

**Ejemplo de types compartidos**:
```typescript
// packages/shared/src/types/transaction.ts
export interface Transaction {
  _id: string;
  userId: string;
  date: string; // ISO 8601
  description: string;
  amount: number;
  category?: Category;
  merchant?: string;
  isMicroExpense: boolean;
}

export type Category = 
  | 'café/bebidas'
  | 'comida rápida'
  | 'transporte'
  | 'suscripciones'
  | 'entretenimiento'
  | 'misceláneos';
```

### React y Next.js

**Obligatorio**:
- Usar App Router (no Pages Router)
- Server Components por defecto, Client Components solo cuando sea necesario
- `'use client'` solo para componentes con interactividad o hooks de navegador
- Componentes funcionales (no class components)
- Hooks personalizados para lógica reutilizable

**Estructura de componentes**:
```typescript
// apps/web/components/InsightCard.tsx
'use client';

import { motion } from 'framer-motion';
import type { Insight } from '@financeflow/shared';

interface InsightCardProps {
  insight: Insight;
  index: number;
}

export function InsightCard({ insight, index }: InsightCardProps) {
  // Implementación
}
```

### Framer Motion

**Obligatorio para animaciones**:
- Usar `motion` components para animaciones
- Definir variantes reutilizables en `packages/ui/animations/`
- Animaciones suaves (duración 0.3-0.5s, easing 'easeOut')
- Stagger animations para listas de elementos

**Ejemplo de variantes**:
```typescript
// packages/ui/animations/cardVariants.ts
export const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: 'easeOut'
    }
  }),
  hover: {
    scale: 1.02,
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    transition: { duration: 0.2 }
  }
};
```

### Tailwind CSS

**Obligatorio**:
- Usar utility classes (no @apply en CSS)
- Configuración extendida en `packages/ui/tailwind.config.js`
- Design tokens para colores, spacing, typography
- Responsive design mobile-first

**Ejemplo de uso**:
```tsx
<div className="rounded-lg bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
  <h3 className="text-lg font-semibold text-gray-900">
    {insight.narrative}
  </h3>
</div>
```

### MongoDB y Mongoose

**Obligatorio**:
- Schemas con validación estricta
- Índices en campos de búsqueda frecuente
- Usar aggregation pipeline para análisis complejos
- Transacciones para operaciones críticas

**Ejemplo de aggregation**:
```typescript
const patterns = await Transaction.aggregate([
  { $match: { userId: new ObjectId(userId), isMicroExpense: true } },
  { $group: {
    _id: '$merchant',
    frequency: { $sum: 1 },
    totalAmount: { $sum: '$amount' }
  }},
  { $sort: { totalAmount: -1 } },
  { $limit: 10 }
]);
```

---

## Testing

### Estrategia de Testing

**Obligatorio en cada slice**:
- Unit tests para servicios y utilidades
- Component tests para UI
- Integration tests para flujos completos
- Property-based tests para validar correctness properties

**Cobertura mínima**:
- Backend: 80% code coverage
- Frontend: 70% code coverage
- Todos los property tests implementados

### Property-Based Testing

**Formato obligatorio**:
```typescript
import fc from 'fast-check';

// Feature: financeflow-ai, Property N: [descripción]
describe('[Descripción del property]', () => {
  it('should [comportamiento esperado]', () => {
    fc.assert(
      fc.property(
        // Generators
        fc.record({ /* ... */ }),
        (input) => {
          // Test logic
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

---

## Filosofía de Diseño

### Regla de Oro

**La IA debe ser una narradora de insights, no una tabla de datos.**

Cada interacción debe contar una historia sobre los patrones de gasto del usuario, no simplemente mostrar números.

### Principios de UX

1. **Narrativa sobre datos crudos**: Historias con contexto, no números aislados
2. **Insights accionables**: Cada narrativa incluye acciones concretas
3. **Experiencia memorable**: Animaciones que crean momentos "wow"
4. **Simplicidad**: Interfaz clara que no abruma

### Anti-Patrones a Evitar

❌ Mostrar tablas de transacciones sin contexto
❌ Usar jerga financiera compleja
❌ Juzgar o culpar al usuario
❌ Dar consejos genéricos sin personalización
❌ Abrumar con demasiados insights simultáneos

### Patrones a Seguir

✅ Contar historias con principio, desarrollo y conclusión
✅ Usar lenguaje conversacional y empático
✅ Proporcionar acciones concretas y alcanzables
✅ Celebrar mejoras y progreso
✅ Mostrar 3-5 insights prioritarios, no 20

---

## Conclusión

Como desarrollador de FinanceFlow AI, tu responsabilidad es mantener la integridad de la arquitectura, seguir la metodología de slices verticales, y asegurar que cada línea de código cumpla con los estándares de calidad y las restricciones técnicas establecidas.

**Recuerda siempre**:
- Monorepo estricto con npm Workspaces
- No iniciar nuevo slice sin commit limpio del anterior
- Cumplimiento de Ley 1581 en cada feature
- MongoDB Atlas + Mongoose ODM
- Google Gemini Flash para narrativas
- La IA como narradora, no como tabla de datos
