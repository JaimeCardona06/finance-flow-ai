import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
  getNotifications,
  markNotificationAsRead,
  getPreferences,
  updatePreferences
} from '../controllers/notificationController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/notifications - Obtener notificaciones del usuario
router.get('/', getNotifications);

// PATCH /api/notifications/:id/read - Marcar notificación como leída
router.patch('/:id/read', markNotificationAsRead);

// GET /api/notifications/preferences - Obtener preferencias
router.get('/preferences', getPreferences);

// POST /api/notifications/preferences - Actualizar preferencias
router.post('/preferences', updatePreferences);

export default router;
