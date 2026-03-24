import ExcelJS from 'exceljs';
import { Transaction } from '../models/Transaction';
import type { ITransaction } from '../models/Transaction';

export interface ExportOptions {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  format?: 'xlsx' | 'csv';
}

export class ExportService {
  /**
   * Genera un archivo Excel con las transacciones del usuario
   */
  async generateExcelReport(options: ExportOptions): Promise<Buffer> {
    const { userId, startDate, endDate } = options;

    // Obtener transacciones del usuario
    const query: any = { userId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .lean<ITransaction[]>();

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FinanceFlow AI';
    workbook.created = new Date();

    // Crear worksheet
    const worksheet = workbook.addWorksheet('Transacciones', {
      properties: { tabColor: { argb: 'FF00FF00' } }
    });

    // Definir columnas con estilos
    worksheet.columns = [
      { header: 'Fecha', key: 'date', width: 15 },
      { header: 'Descripción', key: 'description', width: 40 },
      { header: 'Monto (COP)', key: 'amount', width: 15 },
      { header: 'Categoría', key: 'category', width: 20 },
      { header: 'Merchant', key: 'merchant', width: 25 },
      { header: 'Gasto Hormiga', key: 'isMicroExpense', width: 15 }
    ];

    // Estilo del header
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Agregar datos
    transactions.forEach((transaction) => {
      const row = worksheet.addRow({
        date: new Date(transaction.date).toLocaleDateString('es-CO'),
        description: transaction.description,
        amount: transaction.amount,
        category: transaction.category || 'Sin categoría',
        merchant: transaction.merchant || 'N/A',
        isMicroExpense: transaction.isMicroExpense ? 'Sí' : 'No'
      });

      // Formato condicional para gastos hormiga
      if (transaction.isMicroExpense) {
        row.getCell('isMicroExpense').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEF3C7' }
        };
      }

      // Formato de moneda
      row.getCell('amount').numFmt = '$#,##0.00';
      row.getCell('amount').alignment = { horizontal: 'right' };
    });

    // Agregar totales
    const totalRow = worksheet.addRow({
      date: '',
      description: 'TOTAL',
      amount: { formula: `SUM(C2:C${transactions.length + 1})` },
      category: '',
      merchant: '',
      isMicroExpense: ''
    });

    totalRow.font = { bold: true };
    totalRow.getCell('amount').numFmt = '$#,##0.00';
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' }
    };

    // Auto-filtro
    worksheet.autoFilter = {
      from: 'A1',
      to: `F${transactions.length + 1}`
    };

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Obtiene estadísticas de exportación para el usuario
   */
  async getExportStats(userId: string) {
    const totalTransactions = await Transaction.countDocuments({ userId });
    const microExpenses = await Transaction.countDocuments({ 
      userId, 
      isMicroExpense: true 
    });

    const totalAmount = await Transaction.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return {
      totalTransactions,
      microExpenses,
      totalAmount: totalAmount[0]?.total || 0,
      exportDate: new Date()
    };
  }
}

export const exportService = new ExportService();
