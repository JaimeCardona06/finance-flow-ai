# Solution Document - FinanceFlow AI

## Executive Summary

FinanceFlow AI es una plataforma de análisis financiero personal especializada en detectar, categorizar y narrar insights sobre gastos hormiga (micro-gastos) en el mercado colombiano. A diferencia de las aplicaciones tradicionales de finanzas personales que presentan datos en tablas y gráficos, FinanceFlow AI utiliza inteligencia artificial para transformar transacciones bancarias en narrativas accionables que ayudan a los usuarios a tomar conciencia de patrones de gasto invisibles.

El sistema cumple con la Ley 1581 de 2012 de Protección de Datos Personales de Colombia, implementando controles de privacidad, consentimiento informado y encriptación de datos financieros sensibles.

**Propuesta de valor única**: La IA como narradora de insights, no como tabla de datos. Cada interacción cuenta una historia sobre los patrones de gasto del usuario, generando momentos "wow" mediante animaciones impactantes con Framer Motion.

---

## Problem Context

### El Dolor de los Gastos Hormiga en Colombia

Los gastos hormiga son pequeñas compras diarias que individualmente parecen insignificantes, pero que acumuladas representan una fuga importante de dinero del presupuesto familiar. En el contexto colombiano, este problema tiene características particulares:

#### Magnitud del Problema

- **Impacto financiero**: Según estudios de educación financiera en Colombia, los gastos hormiga pueden representar entre el 15% y 30% del ingreso mensual de una familia promedio
- **Invisibilidad**: Un tinto de $2.000 COP, un pasabocas de $5.000 COP, o una recarga de transporte de $8.000 COP pasan completamente desapercibidos
- **Acumulación silenciosa**: Al final del mes, pueden faltar entre $200.000 y $500.000 COP sin una explicación clara de dónde se fueron
- **Falta de conciencia**: Las personas subestiman sistemáticamente sus gastos pequeños en un 40-60%

#### Contexto Cultural Colombiano


**Patrones de gasto específicos**:
- **Tintos y cafés**: Consumo frecuente en tiendas de barrio y cafeterías ($2.000 - $8.000 COP por compra)
- **Almuerzos ejecutivos**: Comidas fuera de casa durante la semana laboral ($15.000 - $25.000 COP)
- **Transporte urbano**: Taxis, Uber, DiDi, y transporte público ($5.000 - $20.000 COP por trayecto)
- **Domicilios**: Rappi, Uber Eats, especialmente los fines de semana ($25.000 - $50.000 COP)
- **Recargas y servicios**: Minutos, datos móviles, streaming ($10.000 - $30.000 COP)
- **Antojos y mecato**: Compras impulsivas en tiendas de conveniencia ($3.000 - $15.000 COP)

**Factores culturales que agravan el problema**:
- Cultura de "café con los colegas" como ritual social laboral
- Normalización de domicilios como solución de conveniencia
- Presión social para "salir a comer" o "tomarse algo"
- Falta de educación financiera formal en el sistema educativo colombiano
- Acceso creciente a crédito fácil (tarjetas, apps de préstamos) que enmascara el problema

#### Por Qué las Soluciones Actuales Fallan

**Apps de banca tradicional**:
- Muestran listas de transacciones sin contexto ni análisis
- Categorizaciones genéricas que no reflejan patrones reales
- Interfaz enfocada en operaciones bancarias, no en insights
- No generan conciencia ni cambio de comportamiento

**Apps de finanzas personales existentes**:
- Requieren entrada manual de datos (alta fricción, baja adopción)
- Presentan datos en tablas y gráficos aburridos
- No cuentan historias, solo muestran números
- Experiencia desmotivante que lleva al abandono en 2-3 semanas

**Hojas de cálculo**:
- Requieren disciplina extrema y conocimiento técnico
- Proceso manual tedioso y propenso a errores
- Cero insights automáticos
- Experiencia completamente desmotivante

### Cumplimiento de Ley 1581 de 2012


FinanceFlow AI maneja datos financieros personales sensibles, por lo que debe cumplir estrictamente con la Ley Estatutaria 1581 de 2012 de Protección de Datos Personales en Colombia y su decreto reglamentario 1377 de 2013.

#### Principios Aplicables

**Principio de Finalidad**: Los datos financieros se recopilan exclusivamente para análisis de gastos hormiga y generación de insights personalizados. No se utilizan para otros fines sin consentimiento explícito.

**Principio de Libertad**: Los usuarios tienen control total sobre sus datos y pueden revocar el consentimiento en cualquier momento.

**Principio de Veracidad o Calidad**: El sistema valida la integridad de los datos importados y mantiene registros precisos.

**Principio de Transparencia**: Los usuarios tienen acceso completo a qué datos se almacenan, cómo se procesan y quién tiene acceso.

**Principio de Acceso y Circulación Restringida**: Los datos financieros solo son accesibles por el titular y no se comparten con terceros sin autorización explícita.

**Principio de Seguridad**: Implementación de medidas técnicas y administrativas para proteger los datos contra acceso no autorizado, pérdida o alteración.

#### Obligaciones del Responsable del Tratamiento

**Consentimiento Informado**:
- Solicitud explícita de autorización antes de procesar cualquier dato financiero
- Política de tratamiento de datos clara y accesible en lenguaje sencillo
- Opción de aceptar o rechazar el tratamiento de datos sin afectar funcionalidad básica

**Derechos de los Titulares** (Habeas Data):
- **Derecho de Acceso**: Consultar qué datos personales están almacenados
- **Derecho de Rectificación**: Corregir datos inexactos o incompletos
- **Derecho de Actualización**: Mantener datos actualizados
- **Derecho de Supresión**: Eliminar datos cuando no sean necesarios o se revoque consentimiento
- **Derecho de Oposición**: Oponerse al tratamiento de datos en casos específicos

**Medidas de Seguridad Obligatorias**:
- Encriptación de datos financieros en reposo (AES-256)
- Encriptación de datos en tránsito (TLS 1.3)
- Control de acceso basado en roles (RBAC)
- Auditoría de accesos a datos sensibles
- Backups encriptados con retención de 12 meses
- Plan de respuesta a incidentes de seguridad

**Registro ante la SIC** (Superintendencia de Industria y Comercio):
- Registro de bases de datos que contienen información financiera personal
- Designación de responsable de protección de datos
- Procedimientos documentados para atención de peticiones, quejas y reclamos

#### Implementación Técnica del Cumplimiento


**Consentimiento en Onboarding**:
- Pantalla dedicada explicando qué datos se recopilan y por qué
- Checkbox explícito de aceptación (no pre-marcado)
- Link a política de privacidad completa
- Opción de continuar sin aceptar (funcionalidad limitada)

**Portal de Privacidad del Usuario**:
- Sección en dashboard para gestionar consentimientos
- Descarga de todos los datos personales en formato JSON
- Solicitud de eliminación de cuenta y datos (proceso de 30 días)
- Historial de accesos a datos sensibles

**Anonimización para Análisis Agregado**:
- Datos agregados para métricas de producto no contienen información identificable
- Separación de datos de identidad y datos transaccionales
- Uso de UUIDs en lugar de información personal en logs

**Auditoría y Trazabilidad**:
- Log de todas las operaciones sobre datos sensibles
- Registro de consentimientos con timestamp y versión de política
- Alertas automáticas ante accesos anómalos
- Reportes mensuales de cumplimiento para revisión interna

---

## Product Capability Vision

### La IA como Narradora, No como Tabla de Datos

La diferenciación fundamental de FinanceFlow AI radica en cómo presenta la información financiera al usuario. En lugar de mostrar tablas de transacciones y gráficos de barras, el sistema utiliza inteligencia artificial para **contar historias** sobre los patrones de gasto.

#### Filosofía de Diseño

**Narrativa sobre Datos Crudos**:
- Cada insight es una historia con contexto, no un número aislado
- Uso de lenguaje conversacional y empático, no técnico
- Personalización basada en patrones individuales del usuario
- Conexión emocional que genera conciencia y motivación al cambio

**Insights Accionables**:
- Cada narrativa incluye al menos una acción concreta sugerida
- Evitar sugerencias genéricas como "gasta menos"
- Proporcionar alternativas específicas y realistas
- Facilitar la toma de decisiones con información contextualizada

**Experiencia Visual Memorable**:
- Animaciones impactantes con Framer Motion que crean momentos "wow"
- Interfaz simple pero impactante que no abruma
- Diseño que prioriza la legibilidad y la claridad
- Uso estratégico de color y movimiento para destacar insights prioritarios


#### Ejemplos de Narrativas vs. Datos Tradicionales

**Enfoque Tradicional** (lo que NO hacemos):
```
Categoría: Café
Total: $184.000 COP
Transacciones: 23
Promedio: $8.000 COP
```

**Enfoque FinanceFlow AI** (lo que SÍ hacemos):
```
"En los últimos 30 días, has comprado café 23 veces. Eso es más que 
días laborales en el mes. ¿Qué está pasando los fines de semana?

Has gastado $184.000 COP en total. Si prepararas café en casa, 
podrías ahorrar aproximadamente $140.000 COP al mes. Eso es suficiente 
para una cena especial cada semana.

💡 Acción sugerida: Compra una cafetera de $150.000 COP. Se paga 
sola en 5 semanas y ahorras $1.680.000 COP al año."
```

**Otro ejemplo - Suscripciones Olvidadas**:

Tradicional:
```
Netflix: $44.900 COP/mes
Spotify: $16.900 COP/mes
HBO Max: $35.900 COP/mes
```

FinanceFlow AI:
```
"Tienes 3 suscripciones de streaming activas que suman $97.700 COP 
al mes. Según tu historial, solo has usado Netflix en los últimos 
60 días.

HBO Max y Spotify están en piloto automático, costándote $52.800 COP 
mensuales sin uso. Eso es $633.600 COP al año que podrías destinar 
a otras cosas.

💡 Acción sugerida: Cancela HBO Max y Spotify. Si los extrañas, 
siempre puedes reactivarlos. Pero probablemente no lo harás."
```

#### Capacidades de la IA Narradora

**Detección de Patrones Complejos**:
- Gastos recurrentes por merchant (café, almuerzos, transporte)
- Patrones temporales (gastos que aumentan los viernes, fines de semana)
- Suscripciones olvidadas (cargos recurrentes sin uso aparente)
- Triggers de gasto (eventos que disparan compras impulsivas)
- Comparaciones temporales (este mes vs. meses anteriores)

**Generación de Contexto**:
- Cálculo de impacto anual proyectado
- Comparación con alternativas más económicas
- Traducción de ahorros a "recompensas tangibles" (cenas, viajes, etc.)
- Identificación de días/momentos de mayor gasto
- Análisis de tendencias (mejorando, empeorando, estable)

**Personalización de Narrativas**:
- Tono adaptado al perfil del usuario (formal, casual, motivacional)
- Referencias a contexto colombiano (tintos, almuerzos ejecutivos, domicilios)
- Priorización de insights según impacto financiero
- Sugerencias realistas basadas en comportamiento histórico


**Evitar Anti-Patrones**:
- ❌ No usar jerga financiera compleja
- ❌ No juzgar o culpar al usuario
- ❌ No mostrar solo números sin contexto
- ❌ No dar consejos genéricos sin personalización
- ❌ No abrumar con demasiados insights simultáneos

**Priorizar**:
- ✅ Lenguaje conversacional y empático
- ✅ Historias con principio, desarrollo y conclusión
- ✅ Acciones concretas y alcanzables
- ✅ Celebrar mejoras y progreso
- ✅ Mostrar 3-5 insights prioritarios, no 20

#### Experiencia de Usuario Objetivo

**Momento 1 - Primera Importación**:
Usuario sube su extracto bancario → En 5 segundos ve su primer insight animado → Reacción: "¡Wow! No sabía que gastaba tanto en eso"

**Momento 2 - Descubrimiento**:
Usuario explora dashboard → Descubre patrones que no había notado → Reacción: "Tiene sentido, los viernes siempre pido domicilio"

**Momento 3 - Acción**:
Usuario ve sugerencia concreta → Toma acción (cancela suscripción, cambia hábito) → Reacción: "Esto es fácil de implementar"

**Momento 4 - Validación**:
Usuario importa datos del mes siguiente → Ve mejora reflejada en narrativa → Reacción: "¡Funcionó! Ahorré $150.000 este mes"

**Momento 5 - Hábito**:
Usuario revisa insights semanalmente → Mantiene conciencia de gastos hormiga → Reacción: "Ya es parte de mi rutina financiera"

---

## Architecture Context

### Monorepo con npm Workspaces

FinanceFlow AI se estructura como un monorepo utilizando npm Workspaces para facilitar el desarrollo, compartir código entre frontend y backend, y mantener consistencia en dependencias.

#### Estructura del Monorepo

```
financeflow-ai/
├── apps/
│   ├── web/                    # Frontend - Next.js 14 (App Router)
│   │   ├── app/                # Rutas y páginas
│   │   ├── components/         # Componentes específicos de la app
│   │   ├── lib/                # Utilidades y helpers
│   │   ├── public/             # Assets estáticos
│   │   └── package.json
│   │
│   └── api/                    # Backend - Node.js + Express
│       ├── src/
│       │   ├── routes/         # Endpoints REST
│       │   ├── services/       # Lógica de negocio
│       │   ├── middleware/     # Auth, validation, error handling
│       │   ├── db/             # Database queries y migrations
│       │   └── server.ts       # Entry point
│       └── package.json
│
├── packages/
│   ├── ui/                     # Componentes UI compartidos
│   │   ├── components/         # InsightCard, AnimatedContainer, etc.
│   │   ├── animations/         # Framer Motion variants y hooks
│   │   ├── styles/             # Tailwind config extendido
│   │   └── package.json
│   │
│   └── shared/                 # Código compartido entre apps
│       ├── types/              # TypeScript types e interfaces
│       ├── utils/              # Funciones utilitarias
│       ├── constants/          # Constantes (categorías, límites, etc.)
│       └── package.json
│
├── docs/                       # Documentación del proyecto
│   ├── Solution-Document.md
│   ├── Product-Discovery-Document.md
│   └── API-Specification.md
│
├── .kiro/                      # Configuración de Kiro
│   ├── specs/                  # Especificaciones de features
│   └── steering/               # Reglas y guías
│
├── package.json                # Root package.json con workspaces
├── tsconfig.json               # TypeScript config base
├── .gitignore
└── README.md
```


#### Configuración de npm Workspaces

**Root package.json**:
```json
{
  "name": "financeflow-ai",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "npm run dev --workspaces --if-present",
    "build": "npm run build --workspaces --if-present",
    "test": "npm run test --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "prettier": "^3.1.0",
    "eslint": "^8.55.0"
  }
}
```

#### Ventajas del Monorepo

**Compartir Código sin Fricción**:
- Types compartidos entre frontend y backend (interfaces de API, modelos de datos)
- Componentes UI reutilizables en múltiples apps
- Utilidades y constantes centralizadas
- Cambios en shared se reflejan inmediatamente en todas las apps

**Consistencia de Dependencias**:
- Una sola versión de TypeScript, React, etc. para todo el proyecto
- Evita conflictos de versiones entre packages
- Simplifica actualizaciones de dependencias

**Desarrollo Simplificado**:
- Un solo `npm install` en la raíz instala todo
- Scripts centralizados para dev, build, test
- Hot reload funciona entre packages

**Despliegue Independiente**:
- Cada app en `apps/` puede desplegarse por separado
- Frontend y backend tienen ciclos de despliegue independientes
- Packages son dependencias internas, no se despliegan

#### Stack Tecnológico por Workspace

**apps/web (Frontend)**:
- Next.js 14 con App Router
- React 18
- TypeScript 5.3+
- Tailwind CSS 3.4+
- Framer Motion 11+
- React Hook Form (formularios)
- Zod (validación)
- TanStack Query (data fetching)

**apps/api (Backend)**:
- Node.js 20 LTS
- Express.js 4.18+
- TypeScript 5.3+
- MongoDB Atlas (base de datos)
- Mongoose ODM (database access)
- Redis 7+ (cache)
- Zod (validación de inputs)
- Winston (logging)
- Google Gemini Flash (generación de narrativas IA)

**packages/ui**:
- React 18
- TypeScript 5.3+
- Tailwind CSS 3.4+
- Framer Motion 11+
- Storybook (documentación de componentes)

**packages/shared**:
- TypeScript 5.3+
- Zod (schemas compartidos)
- date-fns (utilidades de fechas)


#### Flujo de Desarrollo

**Desarrollo Local**:
```bash
# Instalar todas las dependencias
npm install

# Iniciar todos los servicios en modo desarrollo
npm run dev

# apps/web corre en http://localhost:3000
# apps/api corre en http://localhost:4000
```

**Agregar Dependencia a un Workspace**:
```bash
# Agregar dependencia a apps/web
npm install react-icons --workspace=apps/web

# Agregar dependencia a packages/ui
npm install clsx --workspace=packages/ui
```

**Usar Package Interno**:
```json
// En apps/web/package.json
{
  "dependencies": {
    "@financeflow/ui": "*",
    "@financeflow/shared": "*"
  }
}
```

**Build y Deploy**:
```bash
# Build de producción de todos los workspaces
npm run build

# Build solo del frontend
npm run build --workspace=apps/web

# Build solo del backend
npm run build --workspace=apps/api
```

---

## Implementation Strategy (Slices)

### Metodología de Desarrollo por Slices Verticales

FinanceFlow AI se implementará mediante **6 slices verticales**, donde cada slice entrega valor completo al usuario (frontend + backend + base de datos + testing). Esta metodología permite:

- Validar hipótesis de producto tempranamente
- Obtener feedback de usuarios reales en cada iteración
- Reducir riesgo al entregar incrementos funcionales
- Mantener el sistema siempre en estado desplegable

Cada slice incluye:
- ✅ Frontend funcional con componentes animados
- ✅ Backend con endpoints necesarios
- ✅ Persistencia de datos
- ✅ Tests unitarios y de integración
- ✅ Cumplimiento de Ley 1581 donde aplique

### Slice 1: Onboarding y Primera Importación

**Objetivo**: Usuario puede crear cuenta, aceptar términos de privacidad, importar su primer extracto bancario CSV y ver su dashboard vacío.

**Valor para el usuario**: Completar el setup inicial y entender qué datos necesita el sistema.

**Alcance**:


**Frontend (apps/web)**:
- Página de landing con propuesta de valor
- Flujo de registro (email + password)
- Pantalla de consentimiento de Ley 1581 (checkbox explícito, link a política)
- Componente de upload CSV con drag & drop
- Dashboard vacío con mensaje de bienvenida
- Animación de carga durante procesamiento

**Backend (apps/api)**:
- POST /api/auth/register (crear usuario)
- POST /api/auth/login (autenticación con JWT)
- POST /api/transactions/import (recibir CSV, validar formato, guardar en DB)
- Middleware de autenticación
- Validación de formato CSV (columnas requeridas: fecha, descripción, monto)
- Detección de duplicados básica

**Base de Datos**:
- Colección `users` (email, passwordHash, consentAccepted, createdAt)
- Colección `transactions` (userId, date, description, amount, rawData, createdAt)
- Colección `consentLogs` (userId, consentType, accepted, version, timestamp)

**Componentes UI (packages/ui)**:
- `<UploadZone>` - Drag & drop con animación
- `<Button>` - Botón base con variantes
- `<Input>` - Input de formulario
- `<AnimatedContainer>` - Wrapper con Framer Motion

**Cumplimiento Ley 1581**:
- Pantalla de consentimiento informado
- Política de privacidad accesible
- Log de aceptación de términos con timestamp

**Criterios de Éxito**:
- ✅ Usuario puede registrarse en < 2 minutos
- ✅ CSV de 500 transacciones se importa en < 3 segundos
- ✅ Validación de CSV detecta errores de formato
- ✅ Duplicados se omiten correctamente
- ✅ Consentimiento se registra en base de datos

**Duración Estimada**: 5 días

---

### Slice 2: Primer Insight Wow

**Objetivo**: Usuario ve su primer insight narrativo animado inmediatamente después de importar transacciones.

**Valor para el usuario**: Experimentar el "momento wow" que diferencia FinanceFlow AI de otras apps.

**Alcance**:

**Frontend (apps/web)**:
- Dashboard con lista de insights
- Componente `<InsightCard>` con animación de entrada
- Animación stagger (cada card aparece secuencialmente)
- Hover effect en cards
- Botón de acción sugerida (sin funcionalidad aún)

**Backend (apps/api)**:
- Servicio de análisis básico:
  - Clasificación de micro-gastos (< $50.000 COP)
  - Categorización simple por palabras clave en descripción
  - Detección de patrón: gastos repetidos por merchant
- Servicio de generación de narrativas:
  - Template de narrativa: "Gastos recurrentes en [merchant]"
  - Interpolación de datos (frecuencia, monto total, promedio)
  - Cálculo de impacto anual
- GET /api/insights (retornar insights generados)
- Procesamiento síncrono (sin jobs en background aún)


**Base de Datos**:
- Colección `insights` (userId, narrative, priority, pattern, actions, aiMetadata, createdAt)
- Colección `patterns` (userId, category, merchant, frequency, totalAmount, periodStart, periodEnd)

**Componentes UI (packages/ui)**:
- `<InsightCard>` - Tarjeta principal con narrativa
- `<ActionButton>` - Botón de acción sugerida
- Variantes de animación en `animations/cardVariants.ts`

**Shared Types (packages/shared)**:
- `Transaction` interface
- `Insight` interface
- `SpendingPattern` interface
- `Category` enum

**Criterios de Éxito**:
- ✅ Usuario ve al menos 1 insight en < 5 segundos después de importar
- ✅ Narrativa es legible y contextualizada
- ✅ Animación de entrada es suave y secuencial
- ✅ Hover effect funciona correctamente
- ✅ Categorización tiene > 70% de precisión en casos comunes

**Duración Estimada**: 5 días

---

### Slice 3: Detección de Suscripciones y Análisis Temporal

**Objetivo**: Usuario descubre suscripciones olvidadas y patrones temporales de gasto (días de la semana, fines de semana).

**Valor para el usuario**: Identificar gastos recurrentes automáticos y triggers temporales de gasto.

**Alcance**:

**Frontend (apps/web)**:
- Sección dedicada "Suscripciones Activas" en dashboard
- Tarjetas de suscripción con costo mensual y anual proyectado
- Botón "Marcar para revisar" en cada suscripción
- Gráfico animado de gastos por día de la semana (Framer Motion)
- Insight destacado para suscripciones sin uso

**Backend (apps/api)**:
- Algoritmo de detección de suscripciones:
  - Transacciones recurrentes (mismo merchant, mismo monto ±$500 COP)
  - Intervalos regulares (25-35 días entre transacciones)
  - Mínimo 3 ocurrencias para clasificar como suscripción
- Análisis temporal:
  - Agrupación de transacciones por día de la semana
  - Detección de spikes (días con gasto > 150% del promedio)
  - Comparación fin de semana vs. días laborales
- Narrativas específicas para suscripciones y patrones temporales
- GET /api/subscriptions (listar suscripciones detectadas)
- PATCH /api/subscriptions/:id/mark (marcar para revisar)

**Base de Datos**:
- Colección `subscriptions` (userId, merchant, amount, frequency, lastCharge, status)
- Colección `temporalPatterns` (userId, dayOfWeek, averageAmount, spikeDetected)

**Componentes UI (packages/ui)**:
- `<SubscriptionCard>` - Tarjeta de suscripción
- `<WeeklyChart>` - Gráfico animado de gastos semanales
- `<Badge>` - Badge para estados (activa, para revisar)

**Criterios de Éxito**:
- ✅ Detección de suscripciones con > 90% de precisión
- ✅ Usuario puede marcar suscripciones para revisar
- ✅ Gráfico semanal se anima suavemente al cargar
- ✅ Narrativa de suscripción incluye costo anual proyectado
- ✅ Detección de spikes temporales funciona correctamente

**Duración Estimada**: 6 días

---


### Slice 4: Comparación Histórica y Progreso

**Objetivo**: Usuario puede importar múltiples meses de datos y ver su progreso en reducción de gastos hormiga.

**Valor para el usuario**: Validar que los cambios de comportamiento están funcionando y mantenerse motivado.

**Alcance**:

**Frontend (apps/web)**:
- Selector de período (último mes, últimos 3 meses, últimos 6 meses)
- Gráfico de tendencia de gastos hormiga mes a mes
- Comparación "Este mes vs. Mes anterior"
- Celebración visual cuando hay mejora (animación especial)
- Sección "Tu Progreso" con métricas clave:
  - Ahorro total logrado
  - Categorías donde más has mejorado
  - Racha de meses con reducción de gastos

**Backend (apps/api)**:
- Análisis comparativo entre períodos
- Cálculo de tendencias (mejorando, empeorando, estable)
- Detección de mejoras significativas (> 15% de reducción)
- Narrativas de progreso personalizadas
- GET /api/insights/comparison?period=3m
- GET /api/progress (métricas de progreso)

**Base de Datos**:
- Colección `monthlySummaries` (userId, month, year, totalMicroExpenses, categoryBreakdown)
- Colección `progressMilestones` (userId, milestoneType, achievedAt, amountSaved)

**Componentes UI (packages/ui)**:
- `<TrendChart>` - Gráfico de tendencia animado
- `<ComparisonCard>` - Tarjeta de comparación mes a mes
- `<ProgressBadge>` - Badge de logro
- `<CelebrationAnimation>` - Animación de celebración con confetti

**Criterios de Éxito**:
- ✅ Usuario puede ver datos de hasta 12 meses atrás
- ✅ Comparación mes a mes es precisa
- ✅ Animación de celebración se muestra cuando hay mejora > 15%
- ✅ Gráfico de tendencia es claro y fácil de interpretar
- ✅ Narrativas de progreso son motivacionales

**Duración Estimada**: 6 días

---

### Slice 5: Plan de Choque (Acciones y Seguimiento)

**Objetivo**: Usuario puede crear un "Plan de Choque" para reducir gastos hormiga específicos y hacer seguimiento de su cumplimiento.

**Valor para el usuario**: Convertir insights en acciones concretas con seguimiento y accountability.

**Alcance**:

**Frontend (apps/web)**:
- Modal "Crear Plan de Choque" desde un insight
- Formulario para definir:
  - Meta de reducción (ej: "Reducir gastos en café en 50%")
  - Acciones específicas (ej: "Preparar café en casa 3 días a la semana")
  - Duración del plan (1 mes, 3 meses)
- Dashboard de "Mi Plan de Choque" con:
  - Progreso visual (barra de progreso animada)
  - Acciones completadas vs. pendientes
  - Ahorro acumulado vs. meta
- Notificaciones de progreso (sin email aún, solo in-app)
- Botón "Marcar acción como completada"

**Backend (apps/api)**:
- POST /api/action-plans (crear plan de choque)
- GET /api/action-plans (listar planes activos)
- PATCH /api/action-plans/:id/actions/:actionId (marcar acción completada)
- Cálculo automático de progreso basado en transacciones nuevas
- Comparación de gasto actual vs. meta del plan
- Generación de narrativas de seguimiento


**Base de Datos**:
- Colección `actionPlans` (userId, category, targetReduction, durationMonths, status, createdAt)
- Colección `planActions` (planId, description, completed, completedAt)
- Colección `planProgress` (planId, month, actualSpending, targetSpending, savings)

**Componentes UI (packages/ui)**:
- `<ActionPlanModal>` - Modal de creación de plan
- `<ProgressBar>` - Barra de progreso animada
- `<ActionCheckbox>` - Checkbox de acción con animación
- `<SavingsCounter>` - Contador animado de ahorro

**Criterios de Éxito**:
- ✅ Usuario puede crear plan de choque desde cualquier insight
- ✅ Progreso se calcula automáticamente con nuevas importaciones
- ✅ Usuario puede marcar acciones como completadas
- ✅ Barra de progreso se anima suavemente al actualizar
- ✅ Narrativa de seguimiento es motivacional y específica
- ✅ Usuario puede tener múltiples planes activos simultáneamente

**Duración Estimada**: 7 días

---

### Slice 6: Exportación de Datos

**Objetivo**: Usuario puede exportar sus transacciones a formato Excel para análisis externo, respaldo de datos, y ejercer su derecho de acceso a datos personales (Ley 1581).

**Valor para el usuario**: Tener control total sobre sus datos financieros, poder analizarlos en herramientas externas, y cumplir con el derecho de portabilidad de datos.

**Alcance**:

**Frontend (apps/web)**:
- Componente `<ExportButton>` con estados de carga y animaciones
- Mensajes de éxito/error con animaciones de Framer Motion
- Hook personalizado `useExport` para lógica de exportación
- Descarga automática del archivo Excel generado
- Integración en dashboard (accesible desde cualquier vista)
- Indicador visual durante proceso de exportación
- Manejo de errores con mensajes claros al usuario

**Backend (apps/api)**:
- GET /api/export/excel (generar y descargar archivo Excel)
  - Parámetros opcionales: startDate, endDate (filtrado por rango de fechas)
  - Autenticación obligatoria con JWT
  - Validación de usuario autenticado
  - Generación de archivo Excel con ExcelJS
  - Headers configurados para descarga automática
  - Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  - Content-Disposition con nombre de archivo dinámico
- GET /api/export/stats (estadísticas de exportación)
  - Total de transacciones del usuario
  - Cantidad de gastos hormiga
  - Monto total acumulado
  - Fecha de exportación
- Servicio completo de exportación (`exportService.ts`)
- Controller dedicado (`exportController.ts`)

**Características del Excel Generado**:

**Estructura del archivo**:
- Nombre de archivo: `financeflow-transacciones-YYYY-MM-DD.xlsx`
- Worksheet: "Transacciones"
- Columnas:
  1. Fecha (formato dd/mm/yyyy localizado a Colombia)
  2. Descripción (texto completo de la transacción)
  3. Monto (COP) (formato de moneda con separador de miles)
  4. Categoría (categoría detectada o "Sin categoría")
  5. Merchant (comercio identificado o "N/A")
  6. Gasto Hormiga (Sí/No)

**Estilos y Formato**:
- Header con fondo azul (#4F46E5), texto blanco, negrita, centrado
- Formato de moneda: `$#,##0.00` con separador de miles
- Alineación de montos a la derecha
- Resaltado amarillo (#FEF3C7) para filas de gastos hormiga
- Fila de totales al final con fórmula SUM automática
- Fondo gris (#E5E7EB) en fila de totales
- Auto-filtro habilitado en todas las columnas
- Anchos de columna optimizados para legibilidad

**Metadata del Workbook**:
- Creator: "FinanceFlow AI"
- Created: Fecha y hora de generación
- Tab color: Verde (#00FF00)

**Funcionalidades Avanzadas**:
- Filtrado por rango de fechas (query params startDate/endDate)
- Ordenamiento por fecha descendente (más recientes primero)
- Fórmula de totales dinámica basada en cantidad de transacciones
- Manejo de transacciones vacías (genera Excel válido sin datos)
- Validación de formato de fechas en query params

**Base de Datos**:
- No requiere nuevas colecciones (usa `transactions` existente)
- Query optimizado con índices en userId y date
- Uso de `.lean()` para mejor performance (no hydrata documentos Mongoose)
- Soporte para agregaciones si se necesitan estadísticas adicionales

**Componentes UI**:
- `<ExportButton>` - Botón principal con variantes (primary/secondary)
  - Estado de carga con spinner animado
  - Animación whileHover (scale 1.02)
  - Animación whileTap (scale 0.98)
  - Disabled state durante exportación
- Mensajes de feedback:
  - Mensaje de éxito con animación fade-in
  - Mensaje de error con detalles del problema
  - Auto-dismiss después de 3 segundos

**Shared Types (packages/shared)**:
- `ExportOptions` interface (userId, startDate, endDate, format)
- `ExportStats` interface (totalTransactions, microExpenses, totalAmount, exportDate)

**Testing**:
- Tests unitarios completos (`exportService.test.ts`)
- Property-based tests con fast-check:
  - Property 1: Excel buffer debe ser válido para cualquier conjunto de transacciones
  - Property 2: Totales deben ser correctos (fórmula SUM)
  - Property 3: Filtrado por fecha debe ser consistente
- Tests de casos edge:
  - Transacciones vacías
  - Rangos de fecha inválidos
  - Usuario sin transacciones
- Cobertura: 100% en exportService
- Validación de estructura del workbook con ExcelJS

**Cumplimiento Ley 1581**:
- **Derecho de Acceso**: Usuario puede consultar todos sus datos almacenados
- **Derecho de Portabilidad**: Datos exportados en formato estándar (Excel)
- **Transparencia**: Usuario ve exactamente qué datos tiene el sistema
- **Control de Acceso**: Solo el usuario autenticado puede exportar sus propios datos
- **Auditoría**: Endpoint de stats permite tracking de exportaciones
- **Seguridad**: Validación de JWT en cada request
- **No compartir con terceros**: Datos solo accesibles por el titular

**Dependencias Técnicas**:
- `exceljs` (^4.3.0): Librería para generación de archivos Excel
  - Soporte completo para XLSX
  - API fluida para estilos y formato
  - Generación de buffers en memoria (no archivos temporales)
  - Soporte para fórmulas, auto-filtros, y formato condicional

**Performance**:
- Generación de Excel: < 2 segundos para 1000 transacciones
- Tamaño de archivo: ~50 KB para 500 transacciones
- Uso de memoria: Buffer en memoria (no archivos temporales)
- Streaming no necesario para MVP (volúmenes manejables)

**Criterios de Éxito**:
- ✅ Usuario puede exportar todas sus transacciones en < 3 segundos
- ✅ Excel generado es válido y se abre correctamente en Excel/Google Sheets
- ✅ Formato de moneda COP es correcto con separador de miles
- ✅ Gastos hormiga están resaltados visualmente
- ✅ Fila de totales calcula correctamente la suma
- ✅ Auto-filtro permite filtrar por categoría, merchant, etc.
- ✅ Filtrado por rango de fechas funciona correctamente
- ✅ Mensajes de error son claros y accionables
- ✅ Animaciones de carga mejoran la experiencia de usuario
- ✅ Solo el usuario autenticado puede exportar sus datos

**Duración Estimada**: 4 días

**Archivos Implementados**:
- `apps/web/components/ExportButton.tsx`
- `apps/web/hooks/useExport.ts`
- `apps/api/src/services/exportService.ts`
- `apps/api/src/services/exportService.test.ts`
- `apps/api/src/controllers/exportController.ts`
- `packages/shared/src/types/export.ts`

---

## Resumen de Slices

| Slice | Objetivo Principal | Duración | Acumulado |
|-------|-------------------|----------|-----------|
| 1 | Onboarding y Primera Importación | 5 días | 5 días |
| 2 | Primer Insight Wow | 5 días | 10 días |
| 3 | Suscripciones y Análisis Temporal | 6 días | 16 días |
| 4 | Comparación Histórica y Progreso | 6 días | 22 días |
| 5 | Plan de Choque | 7 días | 29 días |
| 6 | Exportación de Datos | 4 días | 33 días |

**Total: ~7 semanas de desarrollo** (considerando 5 días laborales por semana)

### Dependencias entre Slices

```
Slice 1 (Onboarding)
    ↓
Slice 2 (Primer Insight) ← Depende de transacciones importadas
    ↓
Slice 3 (Suscripciones) ← Depende de análisis básico
    ↓
Slice 4 (Comparación) ← Depende de múltiples períodos de datos
    ↓
Slice 5 (Plan de Choque) ← Depende de insights y progreso
    ↓
Slice 6 (Exportación) ← Depende de transacciones almacenadas (independiente de otros slices)
```

**Nota sobre Slice 6**: El slice de exportación es técnicamente independiente de los slices 2-5, ya que solo requiere acceso a las transacciones almacenadas (Slice 1). Puede implementarse en paralelo con otros slices si se desea.

Cada slice es desplegable independientemente y entrega valor incremental al usuario.

---

## Technical Decisions

### Base de Datos: MongoDB Atlas

**Justificación**:
- **Flexibilidad de esquema**: Los insights generados por IA tienen estructuras dinámicas y variables que no se ajustan bien a esquemas relacionales rígidos
- **Documentos anidados**: Permite almacenar patrones de gasto, narrativas y metadata en un solo documento sin necesidad de múltiples joins
- **Escalabilidad horizontal nativa**: Sharding automático para crecimiento futuro
- **Agregation Pipeline**: Potente framework para análisis de datos financieros y generación de reportes
- **Atlas Search**: Búsqueda full-text integrada para narrativas e insights
- **Managed service**: MongoDB Atlas maneja backups, replicación y alta disponibilidad automáticamente
- **Transacciones ACID**: Soporte completo desde MongoDB 4.0+ para operaciones críticas financieras

**Estructura de documentos flexible para IA**:
```javascript
// Insight generado por IA con estructura dinámica
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  narrative: "En los últimos 30 días, has comprado café 23 veces...",
  priority: "high",
  pattern: {
    type: "recurring_merchant",
    category: "café/bebidas",
    merchant: "Juan Valdez",
    frequency: 23,
    totalAmount: 184000,
    // Campos dinámicos generados por IA
    temporalInsights: {
      peakDays: ["lunes", "viernes"],
      weekendBehavior: "increased"
    },
    aiMetadata: {
      model: "gemini-flash",
      confidence: 0.92,
      generatedAt: ISODate("2024-01-15T10:30:00Z")
    }
  },
  actions: [
    {
      label: "Preparar café en casa",
      type: "primary",
      estimatedSavings: 140000
    }
  ],
  createdAt: ISODate("2024-01-15T10:30:00Z")
}
```

**Alternativas consideradas**:
- PostgreSQL: Descartado por rigidez de esquema que dificulta almacenar estructuras dinámicas de IA
- MySQL: Descartado por menor soporte para documentos JSON y agregaciones complejas

### Cache: Redis

**Justificación**:
- Reducir latencia en endpoints de lectura frecuente (GET /api/insights)
- TTL automático para invalidación de cache
- Soporte para estructuras de datos complejas
- Excelente rendimiento (< 1ms de latencia)

**Estrategia de cache**:
- Cache de insights generados (TTL: 5 minutos)
- Invalidación al importar nuevas transacciones
- Cache de agregaciones mensuales (TTL: 1 hora)


### ODM: Mongoose

**Justificación**:
- Schema definition con TypeScript support
- Validación de datos integrada
- Middleware hooks para lógica pre/post operaciones
- Population para referencias entre documentos
- Excelente integración con MongoDB Atlas
- Query builder intuitivo y type-safe

**Ejemplo de schema**:
```typescript
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  consentAccepted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String },
  merchant: { type: String },
  isMicroExpense: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, {
  indexes: [
    { userId: 1, date: -1 },
    { userId: 1, category: 1 }
  ]
});

const insightSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  narrative: { type: String, required: true },
  priority: { type: String, enum: ['high', 'medium', 'low'], required: true },
  pattern: { type: mongoose.Schema.Types.Mixed }, // Estructura flexible para IA
  actions: [{ 
    label: String, 
    type: String, 
    estimatedSavings: Number 
  }],
  aiMetadata: { type: mongoose.Schema.Types.Mixed }, // Metadata dinámica de IA
  createdAt: { type: Date, default: Date.now }
});
```

### Autenticación: JWT

**Justificación**:
- Stateless (no requiere almacenamiento de sesiones en servidor)
- Escalable horizontalmente
- Estándar de la industria
- Fácil integración con Next.js

**Implementación**:
- Access token con expiración de 15 minutos
- Refresh token con expiración de 7 días
- Almacenamiento en httpOnly cookies (seguridad contra XSS)

### Validación: Zod

**Justificación**:
- Type-safe validation con inferencia de tipos TypeScript
- Schemas compartidos entre frontend y backend (packages/shared)
- Mensajes de error personalizables
- Excelente integración con React Hook Form

**Ejemplo de schema compartido**:
```typescript
// packages/shared/src/schemas/transaction.ts
import { z } from 'zod';

export const transactionSchema = z.object({
  date: z.string().datetime(),
  description: z.string().min(1).max(255),
  amount: z.number().positive(),
  category: z.enum([
    'café/bebidas',
    'comida rápida',
    'transporte',
    'suscripciones',
    'entretenimiento',
    'misceláneos'
  ]).optional()
});

export type Transaction = z.infer<typeof transactionSchema>;
```

### Animaciones: Framer Motion

**Justificación**:
- API declarativa y fácil de usar
- Rendimiento optimizado (usa GPU acceleration)
- Soporte para gestures y drag & drop
- Animaciones complejas con poco código
- Excelente documentación

**Patrones de uso**:
```typescript
// Animación de entrada de cards
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 }
  })
};

// Hover effect
const hoverVariant = {
  scale: 1.02,
  boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
};
```

### Estilos: Tailwind CSS

**Justificación**:
- Utility-first approach (desarrollo rápido)
- Consistencia de diseño mediante design tokens
- Tree-shaking automático (solo CSS usado se incluye en bundle)
- Excelente integración con Next.js
- Customización mediante tailwind.config.js

**Configuración extendida**:
```javascript
// packages/ui/tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          // ... más tonos
          900: '#0c4a6e'
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444'
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out'
      }
    }
  }
};
```


### Testing: Vitest + React Testing Library + fast-check

**Justificación**:
- **Vitest**: Compatible con Vite, extremadamente rápido, API compatible con Jest
- **React Testing Library**: Testing centrado en comportamiento del usuario
- **fast-check**: Property-based testing para validar propiedades universales

**Estrategia de testing**:
- Unit tests para lógica de negocio (servicios, utilidades)
- Component tests para UI (packages/ui)
- Integration tests para flujos completos (import → analysis → insights)
- Property-based tests para validar correctness properties

**Ejemplo de property test**:
```typescript
import fc from 'fast-check';

// Feature: financeflow-ai, Property 4: Micro-Expense Classification
describe('Micro-Expense Classification', () => {
  it('should classify transactions under $50k COP as micro-expenses', () => {
    fc.assert(
      fc.property(
        fc.record({
          amount: fc.float({ min: 1, max: 200000 })
        }),
        (transaction) => {
          const isMicro = classifyAsMicroExpense(transaction);
          if (transaction.amount < 50000) {
            expect(isMicro).toBe(true);
          } else {
            expect(isMicro).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Deployment

**Frontend (apps/web)**:
- Vercel (optimizado para Next.js)
- Edge functions para mejor latencia global
- Automatic previews para cada PR

**Backend (apps/api)**:
- Railway o Render (Node.js hosting)
- Auto-scaling basado en carga
- Health checks y monitoring

**Base de Datos**:
- MongoDB Atlas managed (tier M10 o superior para producción)
- Backups automáticos diarios con point-in-time recovery
- Réplicas de lectura para escalabilidad futura
- Índices compuestos para queries frecuentes

**Cache**:
- Redis managed (Upstash o Railway)
- Configuración de alta disponibilidad

---

## Security Considerations

### Protección de Datos Financieros

**Encriptación en Reposo**:
- Datos sensibles encriptados con AES-256
- Claves de encriptación rotadas cada 90 días
- Almacenamiento de claves en secrets manager (no en código)

**Encriptación en Tránsito**:
- TLS 1.3 obligatorio para todas las comunicaciones
- HSTS headers para forzar HTTPS
- Certificate pinning en producción

**Control de Acceso**:
- Autenticación obligatoria para todos los endpoints (excepto /health)
- Rate limiting por IP y por usuario
- CORS configurado estrictamente (solo dominios autorizados)

### Prevención de Vulnerabilidades Comunes

**SQL Injection**:
- Uso de Mongoose ODM (queries parametrizadas automáticamente)
- Validación de inputs con Zod
- Nunca concatenar strings para queries
- Sanitización de operadores MongoDB ($where, $regex)

**XSS (Cross-Site Scripting)**:
- React escapa automáticamente contenido
- CSP headers configurados
- Sanitización de inputs de usuario

**CSRF (Cross-Site Request Forgery)**:
- Tokens CSRF en formularios
- SameSite cookies
- Validación de origin headers

**Dependency Vulnerabilities**:
- Dependabot habilitado para alertas automáticas
- npm audit en CI pipeline
- Actualizaciones regulares de dependencias


### Logging y Monitoring

**Logging**:
- Winston para logging estructurado
- Niveles: error, warn, info, debug
- No loggear datos sensibles (passwords, tokens, montos completos)
- Logs centralizados (Datadog, LogRocket, o similar)

**Monitoring**:
- Uptime monitoring (Pingdom, UptimeRobot)
- Error tracking (Sentry)
- Performance monitoring (Vercel Analytics, New Relic)
- Alertas automáticas para errores críticos

**Métricas clave**:
- Tiempo de respuesta de endpoints (p50, p95, p99)
- Tasa de errores por endpoint
- Tiempo de procesamiento de CSV
- Tiempo de generación de insights
- Tasa de conversión de onboarding

---

## Performance Targets

### Frontend

- **First Contentful Paint (FCP)**: < 1.5 segundos
- **Largest Contentful Paint (LCP)**: < 2.5 segundos
- **Time to Interactive (TTI)**: < 3.5 segundos
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Bundle size**: < 200 KB (gzipped)

**Estrategias de optimización**:
- Code splitting por ruta
- Lazy loading de componentes pesados
- Image optimization con Next.js Image
- Prefetching de rutas críticas
- Memoization de componentes costosos

### Backend

- **POST /api/transactions/import**: < 3 segundos para 1000 transacciones
- **GET /api/insights**: < 500 ms (con cache), < 2 segundos (sin cache)
- **GET /api/subscriptions**: < 300 ms
- **Throughput**: 100 requests/segundo por instancia

**Estrategias de optimización**:
- Índices de MongoDB en campos frecuentemente consultados (userId, date, category)
- Cache agresivo con Redis
- Queries optimizadas con aggregation pipeline
- Connection pooling para MongoDB
- Compresión de responses (gzip)

### Base de Datos

- **Query time**: < 100 ms para queries simples, < 500 ms para agregaciones
- **Connection pool**: 10-20 conexiones por instancia
- **Índices**: En userId, date, category, merchant para queries frecuentes
- **Aggregation pipeline**: Optimizado para análisis de patrones de gasto

---

## Scalability Considerations

### Escalabilidad Horizontal

**Frontend**:
- Stateless por diseño (Next.js)
- Puede escalar infinitamente en Vercel Edge Network
- CDN para assets estáticos

**Backend**:
- Stateless (JWT, no sesiones en servidor)
- Puede escalar horizontalmente agregando instancias
- Load balancer distribuye tráfico

**Base de Datos**:
- Read replicas para queries de lectura
- Connection pooling para manejar más conexiones concurrentes
- Sharding por userId para distribución horizontal (futuro)
- Índices compuestos optimizados

### Límites Actuales y Planes de Escalamiento

**MVP (0-1,000 usuarios)**:
- 1 instancia de backend
- MongoDB Atlas M10 (shared cluster)
- 1 instancia de Redis
- Costo estimado: $50-100/mes

**Crecimiento (1,000-10,000 usuarios)**:
- 2-3 instancias de backend con load balancer
- MongoDB Atlas M20 con replica set
- Redis con alta disponibilidad
- Costo estimado: $200-400/mes

**Escala (10,000+ usuarios)**:
- Auto-scaling de backend (5-10 instancias)
- MongoDB Atlas M30+ con sharding
- Redis cluster
- CDN premium
- Costo estimado: $1,000-2,000/mes

---

## Roadmap: Próximos Slices (Post-MVP)

### Slice 7: Chat con Asesor Financiero (IA) ✅ FINALIZADO Y TESTEADO

**Estado**: ✅ Completado, testeado y mergeado a `dev`

**Testing**: ✅ Suite completa de 13 tests pasando (100% cobertura crítica)

**Objetivo**: Usuario puede conversar con un asesor financiero virtual impulsado por IA para obtener respuestas personalizadas sobre sus finanzas.

**Valor para el usuario**: Acceso inmediato a asesoría financiera contextualizada basada en su historial real de transacciones, sin necesidad de agendar citas o explicar su situación desde cero.

**Alcance Implementado**:

**Frontend (apps/web)** ✅:
- ✅ `ChatAssistant.tsx`: Panel de chat conversacional con interfaz tipo messenger
- ✅ Burbujas de mensaje con animaciones de entrada (Framer Motion)
- ✅ Indicador de "escribiendo..." mientras la IA genera respuesta (3 puntos animados)
- ✅ Historial de conversaciones en memoria (últimos 6 mensajes para contexto)
- ✅ Sugerencias de preguntas frecuentes (quick replies):
  - "¿En qué categoría gasto más?"
  - "¿Cuánto gasté este mes?"
  - "¿Qué puedo hacer para ahorrar?"
  - "¿Cuáles son mis gastos hormiga?"
- ✅ `ChatFloatingButton.tsx`: Botón flotante de acceso rápido desde dashboard
- ✅ Modal de chat con diseño moderno (gradiente indigo-purple)
- ✅ Soporte para Markdown en respuestas del asistente (negritas en cifras)
- ✅ Contador de caracteres (máximo 500)
- ✅ Manejo de estados: loading, error, success
- ✅ Responsive design (móvil y desktop)

**Backend (apps/api)** ✅:
- ✅ `chatService.ts`: Servicio principal de procesamiento de mensajes
  - Recupera transacciones reales de los últimos 30 días
  - Calcula estadísticas: total gastado, promedio, categorías, merchants
  - Construye contexto financiero detallado para la IA
  - Mantiene historial de conversación (últimos 6 mensajes)
- ✅ `chatController.ts`: Controller con endpoints:
  - POST /api/chat/message (enviar mensaje y recibir respuesta)
  - GET /api/chat/health (verificar configuración)
- ✅ `chatRoutes.ts`: Rutas protegidas con `authMiddleware`
- ✅ Integración con OpenRouter usando **meta-llama/llama-3.1-8b-instruct:free**
- ✅ Reutilización del `SYSTEM_PERSONA` del estratega financiero colombiano
- ✅ Prompt engineering para respuestas empáticas y accionables
- ✅ Validación de inputs (longitud máxima 500 caracteres)
- ✅ Manejo de errores con fallback graceful

**Contexto Financiero Generado**:
- 📊 Resumen general: Total gastado, número de transacciones, promedio
- 📁 Gastos por categoría: Desglose completo con montos y conteos
- 🏪 Comercios más frecuentes: Top 5 merchants con totales
- 📝 Últimas 10 transacciones: Historial reciente detallado

**Características del Chat Implementadas**:
- ✅ Respuestas contextualizadas basadas en datos reales del usuario
- ✅ Análisis de últimos 30 días de transacciones
- ✅ Ejemplos de preguntas que puede responder:
  - "¿Por qué gasté más este mes que el anterior?"
  - "¿Cuánto podría ahorrar si cancelo Netflix?"
  - "¿En qué categoría gasto más los fines de semana?"
  - "Dame consejos para reducir mis gastos en transporte"
- ✅ Tono conversacional y empático (estratega financiero colombiano)
- ✅ Sugerencias de acciones concretas
- ✅ Límite de 300 palabras por respuesta (configurado en prompt)
- ✅ Markdown para resaltar cifras importantes con **negritas**

**Modelo de IA**:
- Proveedor: OpenRouter
- Modelo Chat: `meta-llama/llama-3.1-8b-instruct` (sin sufijo :free para mejor rendimiento)
- Modelo Narrativas: `meta-llama/llama-3.1-8b-instruct:free` (versión gratuita)
- Temperatura: 0.7 (balance entre creatividad y precisión)
- Max tokens: 1000 (respuestas concisas)

**Cumplimiento Ley 1581**:
- ✅ Solo el usuario autenticado puede acceder a su chat (JWT)
- ✅ No se envían datos personales identificables a la IA (solo agregados)
- ✅ Historial de conversación en memoria (no persistido en BD por ahora)
- ✅ Transparencia sobre uso de IA en las respuestas

**Archivos Implementados**:
- Backend:
  - `apps/api/src/services/chatService.ts`
  - `apps/api/src/services/chatService.test.ts` ✅ (13 tests)
  - `apps/api/src/controllers/chatController.ts`
  - `apps/api/src/routes/chatRoutes.ts`
  - `apps/api/src/utils/financeUtils.ts` ✅ (utilidades de formateo)
  - `apps/api/src/server.ts` (registro de rutas)
- Frontend:
  - `apps/web/components/ChatAssistant.tsx`
  - `apps/web/components/ChatFloatingButton.tsx`
  - `apps/web/app/analysis/page.tsx` (integración)

**Suite de Tests Implementada** ✅:
- ✅ **validateChatConfig** (2 tests): Validación de configuración de API key
- ✅ **Test de Resiliencia** (2 tests): Manejo de transacciones vacías sin fallos
- ✅ **Test de Mano Dura** (2 tests): Detección de sobregiro con contexto correcto
- ✅ **Test de Contexto Financiero** (2 tests): Inclusión de resumen y historial
- ✅ **Test de Manejo de Errores** (3 tests): Fallbacks cuando API falla
- ✅ **Test de Formato de Moneda** (1 test): Formato colombiano con separador de miles
- ✅ **Test de Integración** (1 test): Integración con planes de ahorro

**Refactorización Completada** ✅:
- ✅ Creación de `financeUtils.ts` con utilidades reutilizables:
  - `formatCOP()`: Formato con separador de miles
  - `formatCOPWithSuffix()`: Formato con "COP"
  - `calculateProgressPercentage()`: Cálculo de porcentajes
  - `getStatusColor()`: Determinación de color de estado
- ✅ Refactorización de `chatService.ts` para usar utilidades
- ✅ Refactorización de `aiService.ts` para usar utilidades
- ✅ Eliminación de código duplicado de formateo
- ✅ Código más limpio y mantenible

**Criterios de Éxito**:
- ✅ Respuesta de IA en < 3 segundos (depende de OpenRouter)
- ✅ Respuestas relevantes y contextualizadas con datos reales
- ✅ Usuario puede mantener conversación multi-turno coherente
- ✅ Interfaz de chat intuitiva y responsiva
- ✅ Animaciones suaves con Framer Motion
- ✅ Manejo de errores con mensajes claros

**Duración Real**: 5 horas (implementación full-stack + suite de tests + refactorización)

**Estado Final**: ✅ Slice 7 completamente finalizado, testeado y mergeado a `dev`

**Próximos Pasos (Mejoras Futuras)**:
- Persistir historial de conversaciones en MongoDB
- Implementar rate limiting (máximo 20 mensajes por hora)
- Agregar endpoint DELETE /api/chat/history
- Incluir contexto de planes de choque activos en el prompt
- Agregar contexto de progreso histórico
- Implementar sanitización avanzada contra prompt injection
- Agregar analytics de uso del chat

---

### Slice 8: Notificaciones y Alertas Inteligentes

**Objetivo**: Sistema proactivo que avisa al usuario sobre eventos financieros importantes antes de que ocurran.

**Valor para el usuario**: Prevenir sorpresas financieras y mantener al usuario en el camino hacia sus metas de ahorro.

**Alcance**:

**Frontend (apps/web)**:
- Centro de notificaciones en dashboard (icono de campana con badge)
- Panel deslizable con lista de notificaciones
- Notificaciones in-app con animaciones de entrada
- Categorización por tipo (suscripción, plan de choque, insight nuevo)
- Marcar como leída/no leída
- Configuración de preferencias de notificaciones
- Notificaciones push (Web Push API)

**Backend (apps/api)**:
- GET /api/notifications (listar notificaciones del usuario)
- PATCH /api/notifications/:id/read (marcar como leída)
- POST /api/notifications/preferences (configurar preferencias)
- Sistema de jobs programados (cron jobs con node-cron):
  - Job diario: Detectar suscripciones próximas a vencer (3 días antes)
  - Job diario: Verificar desvíos en planes de choque (> 20% sobre meta)
  - Job semanal: Generar resumen semanal de gastos
- Servicio de notificaciones (`notificationService.ts`)
- Plantillas de notificaciones personalizables

**Base de Datos**:
- Colección `notifications` (userId, type, title, message, read, createdAt, actionUrl)
- Colección `notificationPreferences` (userId, subscriptionAlerts, planAlerts, weeklyDigest, pushEnabled)

**Tipos de Alertas**:

1. **Alertas de Suscripciones**:
   - "Netflix se cobrará en 3 días ($44.900 COP)"
   - "Tienes 2 suscripciones que se cobrarán esta semana"

2. **Alertas de Plan de Choque**:
   - "⚠️ Vas 30% sobre tu meta de café este mes"
   - "🎉 ¡Vas por buen camino! Llevas 50% de ahorro en tu plan"

3. **Insights Nuevos**:
   - "Detectamos un nuevo patrón de gasto que deberías revisar"
   - "Tu progreso de este mes merece una celebración"

4. **Resumen Semanal**:
   - "Tu resumen semanal está listo: gastaste $X en Y categoría"

**Canales de Notificación**:
- In-app (siempre habilitado)
- Web Push (opcional, requiere permiso del navegador)
- Email (futuro, no en este slice)

**Criterios de Éxito**:
- ✅ Alertas de suscripciones se envían 3 días antes con > 95% precisión
- ✅ Alertas de desvío en plan de choque se detectan en < 24 horas
- ✅ Usuario puede configurar preferencias fácilmente
- ✅ Notificaciones no son intrusivas ni abrumadoras (máximo 3 por día)
- ✅ Centro de notificaciones es accesible y claro

**Duración Estimada**: 5 días

---

### Slice 9: Gamificación y Logros

**Objetivo**: Motivar al usuario mediante un sistema de recompensas visuales que celebra sus logros financieros.

**Valor para el usuario**: Mantener motivación a largo plazo mediante celebraciones de progreso y reconocimiento de esfuerzos.

**Alcance**:

**Frontend (apps/web)**:
- Sección "Mis Logros" en dashboard
- Galería de insignias (badges) con animaciones de desbloqueo
- Modal de celebración cuando se desbloquea un logro (confetti, animación especial)
- Barra de progreso hacia próximo logro
- Insignias bloqueadas (silueta gris) vs. desbloqueadas (color completo)
- Tooltips explicando cómo desbloquear cada insignia
- Contador de racha de días/semanas cumpliendo metas

**Backend (apps/api)**:
- GET /api/achievements (listar logros del usuario)
- Sistema de detección automática de logros:
  - Trigger al completar acciones (importar transacciones, crear plan, cumplir meta)
  - Verificación periódica de condiciones (rachas, ahorros acumulados)
- Servicio de logros (`achievementService.ts`)
- Definición de logros en configuración (fácil de extender)

**Base de Datos**:
- Colección `achievements` (userId, achievementId, unlockedAt, progress)
- Colección `achievementDefinitions` (id, name, description, icon, condition, tier)

**Categorías de Logros**:

1. **Logros de Inicio**:
   - 🎯 "Primer Paso": Importar primera transacción
   - 📊 "Explorador": Ver tu primer insight
   - 💪 "Comprometido": Crear tu primer plan de choque

2. **Logros de Racha**:
   - 🔥 "Racha de 7 días": Cumplir meta 7 días seguidos
   - 🔥🔥 "Racha de 30 días": Cumplir meta 30 días seguidos
   - 🔥🔥🔥 "Racha de 90 días": Cumplir meta 90 días seguidos

3. **Logros de Ahorro**:
   - 💰 "Ahorrador Novato": Ahorrar $50.000 COP
   - 💰💰 "Ahorrador Experto": Ahorrar $500.000 COP
   - 💰💰💰 "Maestro del Ahorro": Ahorrar $1.000.000 COP

4. **Logros de Categoría**:
   - ☕ "Café en Casa": Reducir gastos en café en 50%
   - 🚗 "Transporte Inteligente": Reducir gastos en transporte en 30%
   - 📺 "Minimalista Digital": Cancelar 2+ suscripciones

5. **Logros Especiales**:
   - 🎉 "Mes Perfecto": Cumplir todas las metas del mes
   - 🏆 "Transformación Total": Reducir gastos hormiga en 50% durante 3 meses
   - 🌟 "Influencer Financiero": Compartir progreso (futuro)

**Sistema de Tiers**:
- Bronce: Logros básicos (fáciles de conseguir)
- Plata: Logros intermedios (requieren constancia)
- Oro: Logros avanzados (requieren dedicación)
- Platino: Logros élite (muy difíciles de conseguir)

**Animaciones y Celebraciones**:
- Animación de desbloqueo con confetti y sonido (opcional)
- Notificación in-app cuando se desbloquea un logro
- Progreso visual hacia próximo logro en dashboard
- Efecto de brillo en insignias recién desbloqueadas

**Criterios de Éxito**:
- ✅ Logros se detectan y desbloquean automáticamente en < 1 minuto
- ✅ Animación de celebración es memorable y no intrusiva
- ✅ Usuario entiende cómo desbloquear logros pendientes
- ✅ Sistema de rachas motiva uso consistente de la app
- ✅ Al menos 80% de usuarios desbloquean 3+ logros en primer mes

**Duración Estimada**: 5 días

---

## Roadmap Extendido: Fases Futuras

### Fase 2: Integraciones Bancarias

- Conexión directa con bancos colombianos vía Open Banking
- Sincronización automática de transacciones (sin CSV manual)
- Soporte para múltiples cuentas bancarias
- Detección automática de nuevas transacciones

### Fase 3: IA Avanzada

- Generación de narrativas con LLM avanzados (GPT-4, Claude)
- Categorización con machine learning personalizado
- Predicción de gastos futuros basada en patrones históricos
- Recomendaciones personalizadas basadas en comportamiento
- Detección de anomalías y fraudes

### Fase 4: Social y Comparación

- Comparación anónima con promedios de usuarios similares
- Desafíos mensuales de ahorro comunitarios
- Compartir progreso en redes sociales
- Leaderboards de ahorro (opcional y anónimo)

### Fase 5: Inversión y Crecimiento

- Recomendaciones de inversión básicas (CDTs, fondos)
- Calculadora de metas financieras (viajes, compras grandes)
- Simulador de escenarios financieros
- Integración con plataformas de inversión colombianas

---

## Conclusion

FinanceFlow AI representa una nueva forma de entender y gestionar gastos hormiga en Colombia. Al combinar análisis inteligente de datos financieros con narrativas empáticas y una experiencia visual memorable, el sistema busca generar conciencia y cambio de comportamiento real en los usuarios.

La arquitectura de monorepo con npm Workspaces facilita el desarrollo ágil y la reutilización de código, mientras que la estrategia de implementación por slices verticales permite entregar valor incremental y validar hipótesis de producto tempranamente.

El cumplimiento estricto de la Ley 1581 de 2012 no es solo una obligación legal, sino un compromiso con la privacidad y seguridad de los datos financieros de nuestros usuarios colombianos. El Slice 6 de exportación de datos materializa este compromiso al permitir a los usuarios ejercer su derecho de acceso a datos personales de forma simple y transparente.

**Estado Actual del MVP**: Con 6 slices verticales completados (Onboarding, Insights, Suscripciones, Progreso, Planes de Choque, y Exportación), FinanceFlow AI cuenta con un MVP robusto y funcional que entrega valor real a los usuarios colombianos.

**Próximos Pasos**: Los Slices 7-9 (Chat con IA, Notificaciones, y Gamificación) están diseñados para aumentar el engagement y la retención de usuarios mediante interacciones más ricas y motivación continua.

Con un MVP enfocado en las capacidades core (importación, análisis, narrativas, acciones, y control de datos), FinanceFlow AI está posicionado para diferenciarse en el mercado de finanzas personales mediante su enfoque único: **la IA como narradora de insights, no como tabla de datos**.
