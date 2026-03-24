import { Request, Response } from 'express';
import { getMonthlyComparison, getProgressData, saveMilestone } from '../services/statsService';

/**
 * GET /api/stats/comparison
 * Comparar mes actual vs mes anterior
 */
export const getComparison = async (req: Request, res: Response): Promise<void> => {
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
    
    const comparison = await getMonthlyComparison(userId);
    
    if (!comparison) {
      res.status(200).json({
        success: true,
        data: {
          comparison: null,
          message: 'No hay suficientes datos para comparar'
        }
      });
      return;
    }

    // Guardar milestone si hay mejora >= 15%
    if (comparison.improvement && Math.abs(comparison.delta.percentage) >= 15) {
      await saveMilestone(
        userId,
        'first_15_reduction',
        Math.abs(comparison.delta.amount),
        {
          percentage: comparison.delta.percentage,
          currentMonth: comparison.currentMonth.month,
          previousMonth: comparison.previousMonth.month
        }
      );
    }
    
    res.status(200).json({
      success: true,
      data: {
        comparison
      }
    });
    
  } catch (error) {
    console.error('Error al obtener comparación:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error al obtener comparación'
      }
    });
  }
};

/**
 * GET /api/stats/progress?months=6&microExpensesOnly=true
 * Obtener progreso histórico con filtros opcionales
 */
export const getProgress = async (req: Request, res: Response): Promise<void> => {
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

    // Parsear query params
    const months = req.query.months ? parseInt(req.query.months as string) : 6;
    const microExpensesOnly = req.query.microExpensesOnly === 'true';

    // Validar months
    if (months < 1 || months > 12) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'El parámetro months debe estar entre 1 y 12'
        }
      });
      return;
    }
    
    const progress = await getProgressData(userId, { months, microExpensesOnly });
    
    res.status(200).json({
      success: true,
      data: {
        progress
      }
    });
    
  } catch (error) {
    console.error('Error al obtener progreso:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error al obtener progreso'
      }
    });
  }
};
