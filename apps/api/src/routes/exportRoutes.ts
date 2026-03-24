import { Router } from 'express';
import { exportController } from '../controllers/exportController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * Todas las rutas de exportación requieren autenticación
 */
router.use(authenticateToken);

/**
 * GET /api/export/excel
 * Exportar transacciones a Excel
 * Query params opcionales: startDate, endDate
 */
router.get('/excel', exportController.exportToExcel.bind(exportController));

/**
 * GET /api/export/stats
 * Obtener estadísticas de exportación
 */
router.get('/stats', exportController.getExportStats.bind(exportController));

export default router;
