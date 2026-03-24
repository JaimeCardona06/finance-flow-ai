import { Request, Response } from 'express';
import { exportService } from '../services/exportService';

export class ExportController {
  /**
   * GET /api/export/excel
   * Genera y descarga un archivo Excel con las transacciones del usuario
   */
  async exportToExcel(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      // Obtener parámetros opcionales de fecha
      const { startDate, endDate } = req.query;

      const options = {
        userId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      };

      // Generar archivo Excel
      const buffer = await exportService.generateExcelReport(options);

      // Configurar headers para descarga
      const filename = `financeflow-transacciones-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);

      // Enviar archivo
      res.send(buffer);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      res.status(500).json({ 
        error: 'Error al generar el archivo Excel',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * GET /api/export/stats
   * Obtiene estadísticas de exportación
   */
  async getExportStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const stats = await exportService.getExportStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ 
        error: 'Error al obtener estadísticas',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}

export const exportController = new ExportController();
