import { Request, Response } from 'express';
import {
  getUserNotifications,
  markAsRead,
  getUserPreferences,
  updateUserPreferences,
  UpdatePreferencesData
} from '../services/notificationService';

/**
 * GET /api/notifications
 * Obtener notificaciones del usuario autenticado
 */
export async function getNotifications(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuario no autenticado'
        }
      });
      return;
    }

    const notifications = await getUserNotifications(userId);

    res.status(200).json({
      success: true,
      data: {
        notifications
      }
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);

    // Error de validación
    if (error instanceof Error && error.message.includes('Invalid')) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error al obtener notificaciones'
      }
    });
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Marcar notificación como leída
 */
export async function markNotificationAsRead(req: Request, res: Response): Promise<void> {
  try {
    const notificationId = req.params.id;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuario no autenticado'
        }
      });
      return;
    }

    const notification = await markAsRead(notificationId, userId);

    if (!notification) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notificación no encontrada o no pertenece al usuario'
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        notification
      }
    });
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);

    // Error de validación
    if (error instanceof Error && error.message.includes('Invalid')) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error al marcar notificación como leída'
      }
    });
  }
}

/**
 * GET /api/notifications/preferences
 * Obtener preferencias de notificación del usuario
 */
export async function getPreferences(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuario no autenticado'
        }
      });
      return;
    }

    const preferences = await getUserPreferences(userId);

    res.status(200).json({
      success: true,
      data: {
        preferences
      }
    });
  } catch (error) {
    console.error('Error al obtener preferencias:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error al obtener preferencias'
      }
    });
  }
}

/**
 * POST /api/notifications/preferences
 * Actualizar preferencias de notificación del usuario
 */
export async function updatePreferences(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuario no autenticado'
        }
      });
      return;
    }

    const data: UpdatePreferencesData = req.body;

    const preferences = await updateUserPreferences(userId, data);

    res.status(200).json({
      success: true,
      data: {
        preferences
      }
    });
  } catch (error) {
    console.error('Error al actualizar preferencias:', error);

    // Error de validación
    if (error instanceof Error && (error.message.includes('Invalid') || error.message.includes('must be'))) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error al actualizar preferencias'
      }
    });
  }
}
