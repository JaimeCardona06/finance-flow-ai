import express from 'express';
import { savingsPlanController } from '../controllers/savingsPlanController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// POST /api/plans - Crear nuevo plan de ahorro
router.post('/', savingsPlanController.createPlan);

// GET /api/plans/active - Obtener planes activos
router.get('/active', savingsPlanController.getActivePlans);

// GET /api/plans - Obtener todos los planes
router.get('/', savingsPlanController.getAllPlans);

// DELETE /api/plans/:id - Eliminar un plan
router.delete('/:id', savingsPlanController.deletePlan);

export default router;
