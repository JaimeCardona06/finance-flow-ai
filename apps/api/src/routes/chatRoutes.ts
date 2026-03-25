import { Router } from 'express';
import { chatController } from '../controllers/chatController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

/**
 * POST /api/chat/message
 * Enviar mensaje al asistente financiero (requiere autenticación)
 */
router.post('/message', authenticateToken, (req, res) => chatController.sendMessage(req, res));

/**
 * GET /api/chat/health
 * Verificar configuración del servicio de chat
 */
router.get('/health', (req, res) => chatController.checkHealth(req, res));

export default router;
