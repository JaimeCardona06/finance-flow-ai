import { Request, Response } from 'express';
import { User } from '../models/User';
import { userRegistrationSchema } from '@financeflow/shared';

/**
 * POST /api/auth/register
 * Registrar nuevo usuario con validación de Ley 1581
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    // Validar datos con Zod
    const validationResult = userRegistrationSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos de registro inválidos',
          details: validationResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }
      });
      return;
    }

    const { name, email, password, consentAccepted } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: 'Ya existe una cuenta con este email'
        }
      });
      return;
    }

    // Crear nuevo usuario
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      acceptedPrivacyPolicy: consentAccepted,
      privacyPolicyAcceptedAt: consentAccepted ? new Date() : null
    });

    await user.save();

    // Respuesta exitosa (sin enviar password)
    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          acceptedPrivacyPolicy: user.acceptedPrivacyPolicy,
          privacyPolicyAcceptedAt: user.privacyPolicyAcceptedAt,
          createdAt: user.createdAt
        }
      },
      message: 'Usuario registrado exitosamente'
    });

  } catch (error) {
    console.error('Error en registro:', error);

    // Error de validación de Mongoose
    if ((error as any).name === 'ValidationError') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Error de validación',
          details: Object.values((error as any).errors).map((err: any) => ({
            field: err.path,
            message: err.message
          }))
        }
      });
      return;
    }

    // Error genérico del servidor
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error al registrar usuario'
      }
    });
  }
}

/**
 * POST /api/auth/login
 * Iniciar sesión y obtener JWT
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CREDENTIALS',
          message: 'Email y contraseña son requeridos'
        }
      });
      return;
    }

    // Buscar usuario
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email o contraseña incorrectos'
        }
      });
      return;
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email o contraseña incorrectos'
        }
      });
      return;
    }

    // Generar JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET no está configurado');
    }

    const token = require('jsonwebtoken').sign(
      {
        userId: user._id.toString(),
        email: user.email
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email
        }
      },
      message: 'Inicio de sesión exitoso'
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error al iniciar sesión'
      }
    });
  }
}
