import { Router } from 'express';
import { getSubscriptions } from '../controllers/subscriptionController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/subscriptions - Detectar suscripciones
router.get('/', getSubscriptions);

export default router;
