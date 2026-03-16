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
