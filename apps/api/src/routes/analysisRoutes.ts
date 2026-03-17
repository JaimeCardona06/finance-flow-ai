import { Router } from 'express';
import { createNarrative } from '../controllers/analysisController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * POST /api/analysis/narrative
 * Generar narrativa financiera (requiere autenticación)
 */
router.post('/narrative', authenticateToken, createNarrative);

export default router;
