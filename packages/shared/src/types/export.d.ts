export interface ExportOptions {
    startDate?: string;
    endDate?: string;
    format?: 'xlsx' | 'csv';
}
export interface ExportStats {
    totalTransactions: number;
    microExpenses: number;
    totalAmount: number;
    exportDate: string;
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
//# sourceMappingURL=export.d.ts.map