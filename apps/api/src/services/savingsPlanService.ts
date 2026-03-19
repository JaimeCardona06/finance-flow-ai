import { SavingsPlan, ISavingsPlan } from '../models/SavingsPlan';
import mongoose from 'mongoose';

interface CreatePlanInput {
  userId: string;
  category: string;
  targetAmount: number;
  durationMonths: number;
}

interface PlanWithProgress {
  _id: any;
  userId: mongoose.Types.ObjectId;
  category: string;
  targetAmount: number;
  currentAmount: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  progressPercentage: number;
  daysRemaining: number;
  statusColor: 'green' | 'yellow' | 'red';
}

export const savingsPlanService = {
  /**
   * Crear un nuevo plan de ahorro
   */
  async createPlan(input: CreatePlanInput): Promise<ISavingsPlan> {
    const { userId, category, targetAmount, durationMonths } = input;

    // Verificar si ya existe un plan activo para esta categoría
    const existingPlan = await SavingsPlan.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      category: category.toLowerCase(),
      status: 'active'
    });

    if (existingPlan) {
      throw new Error(`Ya existe un plan activo para la categoría "${category}"`);
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);

    const plan = new SavingsPlan({
      userId: new mongoose.Types.ObjectId(userId),
      category: category.toLowerCase(),
      targetAmount,
      currentAmount: 0,
      startDate,
      endDate,
      status: 'active'
    });

    await plan.save();
    return plan;
  },

  /**
   * Obtener planes activos de un usuario con información de progreso
   */
  async getActivePlans(userId: string): Promise<PlanWithProgress[]> {
    const plans = await SavingsPlan.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: 'active'
    }).sort({ createdAt: -1 });

    return plans.map(plan => {
      const progressPercentage = plan.getProgressPercentage();
      const now = new Date();
      const daysRemaining = Math.ceil((plan.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      let statusColor: 'green' | 'yellow' | 'red' = 'green';
      if (progressPercentage >= 100) {
        statusColor = 'red';
      } else if (progressPercentage >= 80) {
        statusColor = 'yellow';
      }

      const planObj = plan.toObject();
      return {
        _id: planObj._id,
        userId: planObj.userId,
        category: planObj.category,
        targetAmount: planObj.targetAmount,
        currentAmount: planObj.currentAmount,
        startDate: planObj.startDate,
        endDate: planObj.endDate,
        status: planObj.status,
        createdAt: planObj.createdAt,
        updatedAt: planObj.updatedAt,
        progressPercentage,
        daysRemaining,
        statusColor
      };
    });
  },

  /**
   * Obtener todos los planes de un usuario (activos, completados, fallidos)
   */
  async getAllPlans(userId: string): Promise<ISavingsPlan[]> {
    return await SavingsPlan.find({
      userId: new mongoose.Types.ObjectId(userId)
    }).sort({ createdAt: -1 });
  },

  /**
   * Actualizar el monto actual de un plan cuando se agrega una transacción
   */
  async updatePlanAmount(userId: string, category: string, amount: number): Promise<void> {
    const plan = await SavingsPlan.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      category: category.toLowerCase(),
      status: 'active'
    });

    if (!plan) {
      return; // No hay plan activo para esta categoría
    }

    // Incrementar el monto actual
    plan.currentAmount += amount;

    // Actualizar estado si es necesario
    plan.updateStatus();

    await plan.save();
  },

  /**
   * Verificar y actualizar el estado de todos los planes activos de un usuario
   */
  async checkAndUpdatePlanStatuses(userId: string): Promise<void> {
    const activePlans = await SavingsPlan.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: 'active'
    });

    for (const plan of activePlans) {
      plan.updateStatus();
      await plan.save();
    }
  },

  /**
   * Eliminar un plan
   */
  async deletePlan(planId: string, userId: string): Promise<boolean> {
    const result = await SavingsPlan.deleteOne({
      _id: new mongoose.Types.ObjectId(planId),
      userId: new mongoose.Types.ObjectId(userId)
    });

    return result.deletedCount > 0;
  },

  /**
   * Obtener resumen de planes para incluir en narrativas de IA
   */
  async getPlansForAI(userId: string): Promise<Array<{
    category: string;
    targetAmount: number;
    currentAmount: number;
    progressPercentage: number;
    statusColor: 'green' | 'yellow' | 'red';
    daysRemaining: number;
  }>> {
    const plans = await this.getActivePlans(userId);
    
    return plans.map(plan => ({
      category: plan.category,
      targetAmount: plan.targetAmount,
      currentAmount: plan.currentAmount,
      progressPercentage: plan.progressPercentage,
      statusColor: plan.statusColor,
      daysRemaining: plan.daysRemaining
    }));
  }
};
