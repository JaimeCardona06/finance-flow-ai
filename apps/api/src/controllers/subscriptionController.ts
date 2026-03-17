import { Request, Response } from 'express';
import { detectSubscriptions } from '../services/subscriptionService';

/**
 * GET /api/subscriptions
 * Detectar suscripciones del usuario autenticado
 */
export const getSubscriptions = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuario no autenticado'
        }
      });
    }
    
    const subscriptions = await detectSubscriptions(userId);
    
    // Calcular totales
    const totalMonthly = subscriptions.reduce((sum, sub) => sum + sub.monthlyEstimate, 0);
    const totalAnnual = subscriptions.reduce((sum, sub) => sum + sub.annualEstimate, 0);
    
    res.status(200).json({
      success: true,
      data: {
        subscriptions,
        summary: {
          count: subscriptions.length,
          totalMonthly,
          totalAnnual
        }
      }
    });
    
  } catch (error) {
    console.error('Error al obtener suscripciones:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error al detectar suscripciones'
      }
    });
  }
};
