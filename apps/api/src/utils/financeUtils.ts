/**
 * Utilidades para formateo y cálculos financieros
 */

/**
 * Formatea un monto en pesos colombianos con separador de miles
 * @param amount - Monto a formatear
 * @returns String formateado (ej: "1.234.567")
 */
export function formatCOP(amount: number): string {
  return amount.toLocaleString('es-CO');
}

/**
 * Formatea un monto con el sufijo COP
 * @param amount - Monto a formatear
 * @returns String formateado con COP (ej: "1.234.567 COP")
 */
export function formatCOPWithSuffix(amount: number): string {
  return `${formatCOP(amount)} COP`;
}

/**
 * Calcula el porcentaje de progreso
 * @param current - Monto actual
 * @param target - Monto objetivo
 * @returns Porcentaje redondeado
 */
export function calculateProgressPercentage(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.round((current / target) * 100);
}

/**
 * Determina el color de estado basado en el porcentaje de progreso
 * @param percentage - Porcentaje de progreso
 * @returns Color de estado ('green' | 'yellow' | 'red')
 */
export function getStatusColor(percentage: number): 'green' | 'yellow' | 'red' {
  if (percentage >= 100) return 'red';
  if (percentage >= 80) return 'yellow';
  return 'green';
}
