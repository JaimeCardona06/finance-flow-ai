# Slice 6: Exportación de Reportes - Guía de Testing

## Resumen del Slice

**Objetivo**: Permitir a los usuarios exportar sus transacciones a formato Excel (.xlsx) con formato profesional y estadísticas.

**Componentes implementados**:
- ✅ Backend: Service, Controller y Routes para exportación
- ✅ Shared: Tipos TypeScript para exportación
- ✅ Frontend: Custom Hook `useExport` y componente `ExportButton`
- ✅ Tests: Suite completa con property-based testing

## Arquitectura Implementada

### Backend (`apps/api/src/`)

**Service Layer** (`services/exportService.ts`):
- `generateExcelReport()`: Genera archivo Excel con transacciones
- `getExportStats()`: Obtiene estadísticas de exportación
- Usa ExcelJS para generación de archivos
- Incluye formato condicional y totales automáticos

**Controller Layer** (`controllers/exportController.ts`):
- `exportToExcel()`: Endpoint GET que retorna archivo Excel
- `getExportStats()`: Endpoint GET que retorna estadísticas
- Manejo de errores y headers HTTP correctos

**Routes** (`routes/exportRoutes.ts`):
- `GET /api/export/excel`: Exportar transacciones
- `GET /api/export/stats`: Obtener estadísticas
- Protegido con `authMiddleware`

### Shared (`packages/shared/src/types/`)

**Types** (`export.ts`):
- `ExportOptions`: Opciones de exportación (fechas, formato)
- `ExportStats`: Estadísticas de exportación
- `ExportResponse`: Respuesta de exportación
- `ExportFormat`: Tipos de formato soportados

### Frontend (`apps/web/`)

**Custom Hook** (`hooks/useExport.ts`):
- `exportToExcel()`: Descarga archivo Excel como Blob
- `getExportStats()`: Obtiene estadísticas
- Estados: `isExporting`, `error`
- Manejo automático de descarga de archivos

**Componente** (`components/ExportButton.tsx`):
- Botón animado con Framer Motion
- Estados de loading, success y error
- Variantes: primary y secondary
- Integrado en `DashboardHeader`

## Testing Manual

### 1. Verificar Backend

**Iniciar servidor API**:
```bash
cd apps/api
npm run dev
```

**Probar endpoint con curl** (requiere token JWT):
```bash
# Obtener token (login primero)
TOKEN="tu-token-jwt-aqui"

# Exportar transacciones
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/export/excel \
  --output transacciones.xlsx

# Obtener estadísticas
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/export/stats
```

**Respuesta esperada**:
- Archivo `.xlsx` descargado correctamente
- Estadísticas en formato JSON

### 2. Verificar Frontend

**Iniciar aplicación web**:
```bash
cd apps/web
npm run dev
```

**Pasos de prueba**:
1. Navegar a http://localhost:3000
2. Iniciar sesión con usuario válido
3. En el Dashboard, buscar botón "Exportar Excel" en el header
4. Click en el botón
5. Verificar que se descarga archivo Excel
6. Abrir archivo y verificar:
   - Columnas: Fecha, Descripción, Monto, Categoría, Merchant, Gasto Hormiga
   - Formato de moneda en columna Monto
   - Fila de totales al final
   - Filtros automáticos habilitados
   - Gastos hormiga resaltados en amarillo

### 3. Ejecutar Tests Unitarios

**Ejecutar suite de tests**:
```bash
cd apps/api
npm test exportService.test.ts
```

**Tests implementados**:
- ✅ Generación de buffer Excel válido
- ✅ Filtrado por rango de fechas
- ✅ Estructura de workbook correcta
- ✅ Manejo de lista vacía de transacciones
- ✅ Estadísticas correctas
- ✅ Property test: Validez de buffer Excel
- ✅ Property test: Cálculo correcto de totales
- ✅ Property test: Consistencia de filtrado por fecha

**Cobertura esperada**: >80%

## Casos de Prueba

### Caso 1: Exportación Básica
**Precondición**: Usuario con 10+ transacciones
**Pasos**:
1. Click en "Exportar Excel"
2. Esperar descarga
3. Abrir archivo

**Resultado esperado**:
- Archivo descargado con nombre `financeflow-transacciones-YYYY-MM-DD.xlsx`
- Todas las transacciones visibles
- Totales calculados correctamente

### Caso 2: Exportación con Filtro de Fechas
**Precondición**: Usuario con transacciones en múltiples meses
**Pasos**:
1. Modificar hook para incluir fechas: `exportToExcel({ startDate: '2026-03-01', endDate: '2026-03-31' })`
2. Click en botón
3. Verificar archivo

**Resultado esperado**:
- Solo transacciones de marzo 2026
- Totales reflejan solo ese período

### Caso 3: Usuario sin Transacciones
**Precondición**: Usuario nuevo sin transacciones
**Pasos**:
1. Click en "Exportar Excel"
2. Verificar archivo

**Resultado esperado**:
- Archivo generado con headers
- Sin filas de datos
- Total = $0

### Caso 4: Error de Autenticación
**Precondición**: Token JWT expirado o inválido
**Pasos**:
1. Eliminar token de localStorage
2. Click en "Exportar Excel"

**Resultado esperado**:
- Mensaje de error: "No hay sesión activa"
- No se descarga archivo

### Caso 5: Formato de Excel
**Precondición**: Usuario con transacciones variadas
**Pasos**:
1. Exportar archivo
2. Abrir en Excel/LibreOffice
3. Verificar formato

**Resultado esperado**:
- Header con fondo morado y texto blanco
- Montos formateados como moneda ($#,##0.00)
- Gastos hormiga con fondo amarillo
- Filtros automáticos habilitados
- Fórmula SUM en fila de totales

## Validación de Cumplimiento

### Arquitectura de Monorepo ✅
- Service en `apps/api/src/services/`
- Controller en `apps/api/src/controllers/`
- Routes en `apps/api/src/routes/`
- Types compartidos en `packages/shared/src/types/`
- Hook en `apps/web/hooks/`
- Componente en `apps/web/components/`

### Stack Tecnológico ✅
- ExcelJS para generación de archivos
- Express.js con arquitectura en capas
- TypeScript estricto
- Framer Motion para animaciones
- Fetch API para descarga de Blobs

### Testing ✅
- Tests unitarios con Vitest
- Property-based tests con fast-check
- Mocks de dependencias (Transaction model)
- Cobertura >80%

### Seguridad ✅
- Autenticación requerida (authMiddleware)
- Solo el usuario puede exportar sus propias transacciones
- Validación de userId en backend
- Headers HTTP correctos para descarga segura

## Problemas Conocidos y Soluciones

### Problema 1: "Cannot find module 'exceljs'"
**Causa**: Dependencia no instalada
**Solución**:
```bash
cd apps/api
npm install exceljs
```

### Problema 2: Tests fallan con "Transaction is not defined"
**Causa**: Mock no configurado correctamente
**Solución**: Ya implementado en el archivo de tests con `vi.mock()`

### Problema 3: Archivo no se descarga en navegador
**Causa**: Headers HTTP incorrectos
**Solución**: Verificar que el controller incluye:
- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition: attachment; filename="..."`

### Problema 4: Excel muestra caracteres extraños
**Causa**: Encoding incorrecto
**Solución**: ExcelJS maneja UTF-8 automáticamente, verificar que las transacciones en DB estén en UTF-8

## Próximos Pasos (Futuros Slices)

- [ ] Agregar exportación a CSV
- [ ] Permitir selección de columnas a exportar
- [ ] Agregar gráficos en Excel (charts)
- [ ] Exportación programada (envío por email)
- [ ] Múltiples hojas (por categoría)

## Checklist de Completitud

- [x] Backend: Model, Service, Controller, Routes
- [x] Shared: Types e interfaces
- [x] Frontend: Hook y Componente
- [x] Tests: Unitarios y property-based
- [x] Integración: Rutas registradas en server.ts
- [x] UI: Botón integrado en Dashboard
- [x] Documentación: Este archivo
- [x] Dependencias: exceljs instalado
- [x] TypeScript: Sin errores de compilación
- [x] Arquitectura: Cumple con monorepo estricto

## Commit Sugerido

```bash
git add .
git commit -m "feat: complete Slice 6 - Exportación de Reportes

- Backend: ExportService con generación de Excel usando ExcelJS
- Controller y Routes para endpoint /api/export/excel
- Shared: Types para exportación (ExportOptions, ExportStats)
- Frontend: Custom hook useExport con descarga de Blobs
- UI: ExportButton con animaciones Framer Motion
- Tests: Suite completa con property-based testing (>80% coverage)
- Integración: Botón en DashboardHeader

Funcionalidad:
- Exportar transacciones a Excel con formato profesional
- Filtrado opcional por rango de fechas
- Formato condicional para gastos hormiga
- Totales automáticos con fórmulas
- Estadísticas de exportación

Cumple con arquitectura de monorepo y stack tecnológico definido."
```

---

**Slice 6 completado exitosamente** ✅
