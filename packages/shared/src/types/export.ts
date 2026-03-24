/**
 * Tipos compartidos para funcionalidad de exportación
 */

export interface ExportOptions {
  startDate?: string; // ISO 8601
  endDate?: string;   // ISO 8601
  format?: 'xlsx' | 'csv';
}

export interface ExportStats {
  totalTransactions: number;
  microExpenses: number;
  totalAmount: number;
  exportDate: string; // ISO 8601
}

export interface ExportResponse {
  success: boolean;
  filename?: string;
  error?: string;
}

export type ExportFormat = 'xlsx' | 'csv';

export interface ExportRequest {
  userId: string;
  options: ExportOptions;
}
