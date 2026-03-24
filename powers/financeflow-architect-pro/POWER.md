---
name: "financeflow-architect-pro"
displayName: "FinanceFlow Architect Pro"
description: "Automatiza la creación de Slices verticales completos para FinanceFlow AI siguiendo la arquitectura de monorepo estricta (Next.js 14 + Node/Express). Investiga mejores prácticas, genera código backend/frontend, ejecuta tests automáticamente y actualiza documentación."
keywords: ["financeflow", "monorepo", "slice", "arquitectura", "nextjs", "express", "mongodb", "vertical-slice", "testing"]
author: "FinanceFlow AI Team"
---

# FinanceFlow Architect Pro

## Overview

FinanceFlow Architect Pro es un Power especializado que automatiza la creación de Slices verticales completos para el proyecto FinanceFlow AI, siguiendo estrictamente la arquitectura de monorepo definida en `agents.md`.

Este Power integra capacidades de búsqueda web y ejecución de terminal para:
- Investigar mejores prácticas técnicas antes de generar código
- Crear estructura completa de backend (Model, Service, Controller, Routes)
- Generar tipos compartidos en `packages/shared`
- Crear componentes y hooks de frontend
- Generar y ejecutar tests automáticamente
- Actualizar documentación del proyecto

El Power garantiza que cada Slice sea completo, funcional y cumpla con todos los estándares de calidad antes de permitir avanzar al siguiente.

## Available Steering Files

Este Power incluye documentación adicional para casos de uso avanzados:

- **advanced-patterns** - Patrones avanzados para Slices complejos (IA, MongoDB aggregations, animaciones, Ley 1581, WebSockets, caching con Redis)

Para acceder a estos patrones avanzados:
```
Call action "readSteering" with powerName="financeflow-architect-pro", steeringFile="advanced-patterns.md"
```

## Available MCP Servers

Este Power utiliza dos servidores MCP:

### 1. brave-search
Servidor de búsqueda web usando Brave Search API para investigar documentación técnica, mejores prácticas y soluciones actualizadas.

**Herramientas disponibles:**
- `brave_web_search`: Buscar información técnica en la web

### 2. fetch
Servidor para obtener contenido de URLs específicas, útil para leer documentación oficial.

**Herramientas disponibles:**
- `fetch`: Obtener contenido de una URL específica

## Onboarding

### Prerequisites

Antes de usar este Power, asegúrate de tener:

1. **Proyecto FinanceFlow AI configurado** con la estructura de monorepo:
   ```
   financeflow-ai/
   ├── apps/
   │   ├── web/          # Next.js 14
   │   └── api/          # Node.js + Express
   ├── packages/
   │   ├── ui/           # Componentes UI
   │   └── shared/       # Types compartidos
   └── docs/
   ```

2. **Archivo `agents.md`** en la raíz del proyecto con las reglas de arquitectura

3. **Brave API Key** (para búsquedas web):
   - Obtén tu API key en: https://brave.com/search/api/
   - Configura la variable de entorno `BRAVE_API_KEY`

4. **Python con uv instalado** (para el servidor fetch):
   - Instala uv: https://docs.astral.sh/uv/getting-started/installation/

### Installation

1. **Instala el Power** usando el panel de Powers en Kiro:
   - Abre el panel de Powers (Ctrl/Cmd + Shift + P → "Open Kiro Powers")
   - Click en "Add Custom Power"
   - Selecciona "Local Directory"
   - Proporciona la ruta: `{workspace}/powers/financeflow-architect-pro`

2. **Configura la API Key de Brave**:
   - Edita `.kiro/settings/mcp.json` en tu workspace
   - Reemplaza `BRAVE_API_KEY` con tu API key real:
   ```json
   {
     "mcpServers": {
       "brave-search": {
         "env": {
           "BRAVE_API_KEY": "tu-api-key-aqui"
         }
       }
     }
   }
   ```

3. **Verifica la instalación**:
   - Abre el panel de MCP Servers en Kiro
   - Verifica que `brave-search` y `fetch` estén conectados
   - Si hay errores, reconecta los servidores desde el panel

### Configuration

**Variables de entorno requeridas:**
- `BRAVE_API_KEY`: Tu API key de Brave Search (requerida)

**Configuración opcional:**
- Puedes deshabilitar el servidor `fetch` si solo necesitas búsquedas web
- Puedes ajustar el nivel de logs en `env.FASTMCP_LOG_LEVEL`

## Common Workflows

### Workflow 1: Crear un Nuevo Slice Completo

Este es el flujo principal del Power. Automatiza la creación de un Slice vertical completo desde cero.

**Prompt sugerido:**
```
"Kiro, usando FinanceFlow Architect Pro, crea el Slice 6: [Nombre del Slice].

Funcionalidad requerida:
- [Descripción de la feature]
- [Requisitos específicos]
- [Integraciones necesarias]

Sigue el flujo completo: investigar, backend, shared, frontend, tests y documentación."
```

**Pasos que ejecuta el Power:**

1. **INVESTIGAR**: Usa MCP brave-search para buscar mejores prácticas actuales
   - Busca patrones de implementación
   - Investiga librerías recomendadas
   - Verifica versiones actuales de dependencias

2. **BACKEND**: Crea estructura en `apps/api/src/`
   - `models/`: Schema de Mongoose con validación
   - `services/`: Lógica de negocio
   - `controllers/`: Handlers de Express
   - `routes/`: Definición de endpoints

3. **SHARED**: Define tipos en `packages/shared/src/types/`
   - Interfaces TypeScript
   - Types compartidos entre frontend y backend
   - Validaciones con Zod

4. **FRONTEND**: Crea componentes en `apps/web/`
   - `hooks/`: Custom hooks con TanStack Query
   - `components/`: Componentes React con Framer Motion
   - Integración con Tailwind CSS

5. **TESTS**: Genera archivos de prueba
   - `*.test.ts` para cada Service
   - `*.test.ts` para cada Hook
   - Property-based tests con fast-check
   - Ejecuta tests automáticamente

6. **DOCUMENTACIÓN**: Actualiza archivos del proyecto
   - Actualiza `agents.md` con nuevos patrones
   - Crea `SLICE-N-TESTING.md` con instrucciones de prueba
   - Documenta endpoints en README

**Ejemplo completo:**

```
Usuario: "Kiro, usando FinanceFlow Architect Pro, crea el Slice 6: Notificaciones Push.

Funcionalidad:
- Enviar notificaciones cuando se detecta un gasto hormiga recurrente
- Configuración de preferencias de notificación por usuario
- Historial de notificaciones enviadas

Sigue el flujo completo."

Kiro ejecutará:
1. Buscar mejores prácticas de notificaciones push en Node.js
2. Crear Model: Notification.ts
3. Crear Service: notificationService.ts
4. Crear Controller: notificationController.ts
5. Crear Routes: notificationRoutes.ts
6. Crear types en shared: notification.ts
7. Crear Hook: useNotifications.ts
8. Crear Componente: NotificationCenter.tsx
9. Generar tests para service y hook
10. Ejecutar tests y corregir si fallan
11. Actualizar agents.md y crear SLICE-6-TESTING.md
```

### Workflow 2: Investigar Antes de Implementar

Usa el Power solo para investigar mejores prácticas sin generar código todavía.

**Prompt sugerido:**
```
"Kiro, usando FinanceFlow Architect Pro, investiga las mejores prácticas actuales para [tecnología/patrón].

Necesito saber:
- Librerías recomendadas en 2026
- Patrones de implementación
- Consideraciones de seguridad
- Ejemplos de código"
```

**Ejemplo:**
```
Usuario: "Kiro, investiga las mejores prácticas para implementar WebSockets en Express.js con TypeScript."

Kiro usará brave-search para:
1. Buscar "express websocket typescript best practices 2026"
2. Buscar "socket.io vs ws library comparison"
3. Obtener documentación oficial con fetch
4. Resumir hallazgos y recomendar approach
```

### Workflow 3: Generar Solo Tests

Genera tests para código existente que no los tiene.

**Prompt sugerido:**
```
"Kiro, usando FinanceFlow Architect Pro, genera tests para [archivo].

Incluye:
- Unit tests
- Property-based tests
- Edge cases"
```

**Ejemplo:**
```
Usuario: "Kiro, genera tests para apps/api/src/services/aiService.ts"

Kiro:
1. Lee el código del service
2. Identifica funciones a testear
3. Genera aiService.test.ts con:
   - Tests unitarios para cada función
   - Property tests para validar correctness
   - Mocks de dependencias externas (Gemini API)
4. Ejecuta los tests
5. Corrige el código si los tests fallan
```

### Workflow 4: Actualizar Documentación

Actualiza la documentación del proyecto después de cambios.

**Prompt sugerido:**
```
"Kiro, usando FinanceFlow Architect Pro, actualiza la documentación para reflejar los cambios en [feature/slice]."
```

**Ejemplo:**
```
Usuario: "Kiro, actualiza la documentación para reflejar los cambios en el Slice 3."

Kiro:
1. Lee los archivos modificados del Slice 3
2. Actualiza agents.md con nuevos patrones encontrados
3. Actualiza SLICE-3-TESTING.md con nuevas instrucciones
4. Actualiza README.md si hay nuevos endpoints
```

## Best Practices

### 1. Siempre Investigar Primero
Antes de generar código, usa el Power para investigar mejores prácticas actuales. La tecnología evoluciona rápido y las recomendaciones de hace 6 meses pueden estar desactualizadas.

### 2. Un Slice a la Vez
No intentes crear múltiples Slices simultáneamente. Completa un Slice, haz commit, y luego avanza al siguiente.

### 3. Ejecutar Tests Antes de Commit
El Power ejecuta tests automáticamente, pero siempre verifica que todos pasen antes de hacer commit. La regla de "commit limpio" es sagrada.

### 4. Revisar Código Generado
Aunque el Power genera código siguiendo las mejores prácticas, siempre revisa el código generado para asegurarte de que cumple con tus requisitos específicos.

### 5. Mantener agents.md Actualizado
Cada vez que descubras un nuevo patrón o mejor práctica, actualiza `agents.md` para que el Power lo use en futuros Slices.

### 6. Usar Prompts Descriptivos
Cuanto más detallado sea tu prompt, mejor será el código generado. Incluye requisitos específicos, edge cases y consideraciones de seguridad.

### 7. Validar Cumplimiento de Ley 1581
Para features que manejan datos personales, asegúrate de que el Power incluya validaciones de consentimiento y encriptación.

## Troubleshooting

### Error: "Brave API Key not configured"

**Causa:** La variable de entorno `BRAVE_API_KEY` no está configurada o es inválida.

**Solución:**
1. Verifica que tienes una API key válida de Brave Search
2. Edita `.kiro/settings/mcp.json` en tu workspace
3. Reemplaza el placeholder con tu API key real
4. Reconecta el servidor MCP desde el panel de MCP Servers

### Error: "uvx command not found"

**Causa:** Python con uv no está instalado en tu sistema.

**Solución:**
1. Instala uv siguiendo: https://docs.astral.sh/uv/getting-started/installation/
2. Verifica la instalación: `uvx --version`
3. Reinicia Kiro
4. Reconecta el servidor `fetch` desde el panel de MCP Servers

### Error: "Tests failing after generation"

**Causa:** El código generado tiene errores o los tests son demasiado estrictos.

**Solución:**
1. El Power intentará corregir automáticamente los errores
2. Si persisten, revisa los mensajes de error en los tests
3. Ajusta el código manualmente si es necesario
4. Ejecuta `npm test` para verificar

### Error: "Cannot find module '@financeflow/shared'"

**Causa:** Los packages del monorepo no están linkeados correctamente.

**Solución:**
1. Desde la raíz del proyecto: `npm install`
2. Verifica que `package.json` tenga configurado workspaces
3. Ejecuta `npm run build` en `packages/shared`
4. Reinicia el servidor de desarrollo

### Error: "MongoDB connection failed"

**Causa:** La base de datos no está configurada o las credenciales son incorrectas.

**Solución:**
1. Verifica que MongoDB Atlas esté configurado
2. Revisa las credenciales en `apps/api/.env`
3. Verifica que la IP esté en la whitelist de MongoDB Atlas
4. Prueba la conexión: `npm run dev` en `apps/api`

### Warning: "Power generated code without investigating first"

**Causa:** El Power saltó el paso de investigación.

**Solución:**
1. Esto puede pasar si la búsqueda web falla
2. Investiga manualmente las mejores prácticas
3. Proporciona contexto adicional en tu prompt
4. Considera usar el Workflow 2 (Investigar Antes de Implementar) primero

## MCP Config Placeholders

Antes de usar este Power, reemplaza los siguientes placeholders en `mcp.json`:

- **`BRAVE_API_KEY`**: Tu API key de Brave Search.
  - **Cómo obtenerla:**
    1. Ve a https://brave.com/search/api/
    2. Crea una cuenta o inicia sesión
    3. Navega a "API Keys" en el dashboard
    4. Click en "Create API Key"
    5. Copia la API key generada
    6. Pégala en `.kiro/settings/mcp.json` reemplazando `BRAVE_API_KEY`

**Después de reemplazar el placeholder, tu configuración debería verse así:**

```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "BSA_tu_api_key_real_aqui"
      }
    },
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"]
    }
  }
}
```

## Architecture Compliance

Este Power está diseñado específicamente para FinanceFlow AI y sigue estrictamente las reglas definidas en `agents.md`:

### Monorepo Estricto
- Respeta la separación de responsabilidades entre `apps/` y `packages/`
- No permite imports cruzados entre apps
- Usa `@financeflow/` scope para packages internos

### Metodología de Slices
- Cada Slice es completo (backend + frontend + tests + docs)
- No permite avanzar sin commit limpio
- Valida que todos los tests pasen antes de continuar

### Stack Tecnológico
- Next.js 14 con App Router (no Pages Router)
- Express.js con arquitectura en capas
- MongoDB Atlas con Mongoose ODM
- TypeScript estricto en todo el stack
- Framer Motion para animaciones
- TanStack Query para data fetching

### Cumplimiento Legal
- Valida cumplimiento de Ley 1581 de 2012
- Incluye validaciones de consentimiento
- Documenta manejo de datos sensibles

### Testing
- Genera tests con cobertura mínima (80% backend, 70% frontend)
- Incluye property-based tests con fast-check
- Ejecuta tests automáticamente y corrige errores

---

**Package:** `@modelcontextprotocol/server-brave-search`, `mcp-server-fetch`
**MCP Servers:** brave-search, fetch
**Project:** FinanceFlow AI
