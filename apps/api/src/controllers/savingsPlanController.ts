import { Request, Response } from 'express';
import { savingsPlanService } from '../services/savingsPlanService';

export const savingsPlanController = {
  /**
   * POST /api/plans
   * Crear un nuevo plan de ahorro
   */
  async createPlan(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
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

      const { category, targetAmount, durationMonths } = req.body;

      // Validaciones
      if (!category || typeof category !== 'string') {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CATEGORY',
            message: 'La categoría es requerida y debe ser un string'
          }
        });
        return;
      }

      if (!targetAmount || typeof targetAmount !== 'number' || targetAmount <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TARGET_AMOUNT',
            message: 'El monto meta debe ser un número mayor a 0'
          }
        });
        return;
      }

      if (!durationMonths || typeof durationMonths !== 'number' || durationMonths <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DURATION',
            message: 'La duración debe ser un número de meses mayor a 0'
          }
        });
        return;
      }

      const plan = await savingsPlanService.createPlan({
        userId,
        category,
        targetAmount,
        durationMonths
      });

      res.status(201).json({
        success: true,
        data: {
          plan: {
            _id: plan._id,
            category: plan.category,
            targetAmount: plan.targetAmount,
            currentAmount: plan.currentAmount,
            startDate: plan.startDate,
            endDate: plan.endDate,
            status: plan.status,
            progressPercentage: plan.getProgressPercentage()
          }
        }
      });
    } catch (error: any) {
      console.error('Error creating savings plan:', error);
      
      if (error.message.includes('Ya existe un plan activo')) {
        res.status(409).json({
          success: false,
          error: {
            code: 'PLAN_ALREADY_EXISTS',
            message: error.message
          }
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error al crear el plan de ahorro'
        }
      });
    }
  },

  /**
   * GET /api/plans/active
   * Obtener planes activos del usuario
   */
  async getActivePlans(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
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

      // Actualizar estados de planes antes de retornar
      await savingsPlanService.checkAndUpdatePlanStatuses(userId);

      const plans = await savingsPlanService.getActivePlans(userId);

      res.status(200).json({
        success: true,
        data: {
          plans: plans.map(plan => ({
            _id: plan._id,
            category: plan.category,
            targetAmount: plan.targetAmount,
            currentAmount: plan.currentAmount,
            startDate: plan.startDate,
            endDate: plan.endDate,
            status: plan.status,
            progressPercentage: plan.progressPercentage,
            daysRemaining: plan.daysRemaining,
            statusColor: plan.statusColor
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching active plans:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error al obtener los planes activos'
        }
      });
    }
  },

  /**
   * GET /api/plans
   * Obtener todos los planes del usuario
   */
  async getAllPlans(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
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

      const plans = await savingsPlanService.getAllPlans(userId);

      res.status(200).json({
        success: true,
        data: {
          plans: plans.map(plan => ({
            _id: plan._id,
            category: plan.category,
            targetAmount: plan.targetAmount,
            currentAmount: plan.currentAmount,
            startDate: plan.startDate,
            endDate: plan.endDate,
            status: plan.status,
            progressPercentage: plan.getProgressPercentage()
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching all plans:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error al obtener los planes'
        }
      });
    }
  },

  /**
   * DELETE /api/plans/:id
   * Eliminar un plan
   */
  async deletePlan(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
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

      const { id } = req.params;
      const deleted = await savingsPlanService.deletePlan(id, userId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: {
            code: 'PLAN_NOT_FOUND',
            message: 'Plan no encontrado'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          message: 'Plan eliminado exitosamente'
        }
      });
    } catch (error) {
      console.error('Error deleting plan:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error al eliminar el plan'
        }
      });
    }
  }
};
