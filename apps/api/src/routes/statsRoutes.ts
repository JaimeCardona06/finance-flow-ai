import { Router } from 'express';
import { getComparison, getProgress } from '../controllers/statsController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/stats/comparison - Comparar mes actual vs anterior
router.get('/comparison', getComparison);

// GET /api/stats/progress - Obtener progreso histórico
router.get('/progress', getProgress);

export default router;
