import { Router } from 'express';
import { register } from '../controllers/authController';

const router = Router();

/**
 * POST /api/auth/register
 * Registrar nuevo usuario
 */
router.post('/register', register);

export default router;
