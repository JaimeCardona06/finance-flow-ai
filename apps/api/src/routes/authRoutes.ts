import { Router } from 'express';
import { register, login } from '../controllers/authController';

const router = Router();

/**
 * POST /api/auth/register
 * Registrar nuevo usuario
 */
router.post('/register', register);

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
router.post('/login', login);

export default router;
