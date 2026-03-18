import { Transaction } from '../models/Transaction';
import { ProgressMilestone } from '../models/ProgressMilestone';
import mongoose from 'mongoose';

interface MonthlyStats {
  month: string; // YYYY-MM
  year: number;
  monthNumber: number;
  totalAmount: number;
  microExpensesAmount: number;
  transactionCount: number;
  categoryBreakdown: Record<string, number>;
  averagePerDay: number;
}

interface GetProgressOptions {
  months?: number; // Número de meses a obtener (default: 6)
  microExpensesOnly?: boolean; // Solo gastos hormiga (default: false)
}

interface ComparisonResult {
  currentMonth: MonthlyStats;
  previousMonth: MonthlyStats;
  delta: {
    amount: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  };
  improvement: boolean; // true si bajó el gasto
}

interface ProgressData {
  monthlyHistory: MonthlyStats[];
  totalSavings: number;
  bestMonth: MonthlyStats | null;
  worstMonth: MonthlyStats | null;
  averageMonthlySpending: number;
  improvementStreak: number; // Meses consecutivos con reducción
}

/**
 * Obtener estadísticas de un mes específico
 */
async function getMonthStats(
  userId: string, 
  year: number, 
  month: number,
  microExpensesOnly: boolean = false
): Promise<MonthlyStats | null> {
  try {
    // Construir fechas de inicio y fin del mes
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Construir query base
    const query: any = {
      userId: new mongoose.Types.ObjectId(userId),
      date: { $gte: startDateStr, $lte: endDateStr }
    };

    // Filtrar solo gastos hormiga si se solicita
    if (microExpensesOnly) {
      query.isMicroExpense = true;
    }
    
    // Obtener transacciones del mes
    const transactions = await Transaction.find(query).lean();
    
    if (transactions.length === 0) {
      return null;
    }
    
    // Calcular estadísticas
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const microExpensesAmount = transactions
      .filter(t => t.isMicroExpense)
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Breakdown por categoría
    const categoryBreakdown = transactions.reduce((acc, t) => {
      const cat = t.category || 'misceláneos';
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    
    // Días del mes
    const daysInMonth = endDate.getDate();
    const averagePerDay = totalAmount / daysInMonth;
    
    return {
      month: `${year}-${String(month).padStart(2, '0')}`,
      year,
      monthNumber: month,
      totalAmount,
      microExpensesAmount,
      transactionCount: transactions.length,
      categoryBreakdown,
      averagePerDay
    };
    
  } catch (error) {
    console.error('Error al obtener estadísticas del mes:', error);
    throw error;
  }
}

/**
 * Comparar mes actual vs mes anterior
 */
export async function getMonthlyComparison(userId: string): Promise<ComparisonResult | null> {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // Calcular mes anterior
    let previousYear = currentYear;
    let previousMonth = currentMonth - 1;
    if (previousMonth === 0) {
      previousMonth = 12;
      previousYear -= 1;
    }
    
    // Obtener estadísticas de ambos meses
    const currentStats = await getMonthStats(userId, currentYear, currentMonth);
    const previousStats = await getMonthStats(userId, previousYear, previousMonth);
    
    // Si no hay datos del mes actual, no hay comparación
    if (!currentStats) {
      return null;
    }
    
    // Si no hay mes anterior, crear uno vacío para comparación
    if (!previousStats) {
      return {
        currentMonth: currentStats,
        previousMonth: {
          month: `${previousYear}-${String(previousMonth).padStart(2, '0')}`,
          year: previousYear,
          monthNumber: previousMonth,
          totalAmount: 0,
          microExpensesAmount: 0,
          transactionCount: 0,
          categoryBreakdown: {},
          averagePerDay: 0
        },
        delta: {
          amount: currentStats.totalAmount,
          percentage: 100,
          trend: 'up'
        },
        improvement: false
      };
    }
    
    // Calcular delta
    const deltaAmount = currentStats.totalAmount - previousStats.totalAmount;
    const deltaPercentage = previousStats.totalAmount > 0
      ? (deltaAmount / previousStats.totalAmount) * 100
      : 100;
    
    // Determinar tendencia
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(deltaPercentage) < 5) {
      trend = 'stable';
    } else if (deltaAmount > 0) {
      trend = 'up';
    } else {
      trend = 'down';
    }
    
    // Improvement = true si bajó el gasto
    const improvement = deltaAmount < 0;
    
    return {
      currentMonth: currentStats,
      previousMonth: previousStats,
      delta: {
        amount: deltaAmount,
        percentage: deltaPercentage,
        trend
      },
      improvement
    };
    
  } catch (error) {
    console.error('Error al comparar meses:', error);
    throw error;
  }
}

/**
 * Obtener progreso histórico con opciones de filtrado
 */
export async function getProgressData(
  userId: string, 
  options: GetProgressOptions = {}
): Promise<ProgressData> {
  try {
    const { months = 6, microExpensesOnly = false } = options;
    
    const now = new Date();
    const monthlyHistory: MonthlyStats[] = [];
    
    // Obtener últimos N meses
    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      
      const stats = await getMonthStats(userId, year, month, microExpensesOnly);
      if (stats) {
        monthlyHistory.push(stats);
      }
    }
    
    if (monthlyHistory.length === 0) {
      return {
        monthlyHistory: [],
        totalSavings: 0,
        bestMonth: null,
        worstMonth: null,
        averageMonthlySpending: 0,
        improvementStreak: 0
      };
    }
    
    // Calcular métricas
    const totalSpending = monthlyHistory.reduce((sum, m) => sum + m.totalAmount, 0);
    const averageMonthlySpending = totalSpending / monthlyHistory.length;
    
    // Mejor mes (menor gasto)
    const bestMonth = monthlyHistory.reduce((best, current) => 
      current.totalAmount < best.totalAmount ? current : best
    );
    
    // Peor mes (mayor gasto)
    const worstMonth = monthlyHistory.reduce((worst, current) => 
      current.totalAmount > worst.totalAmount ? current : worst
    );
    
    // Calcular ahorro total (comparando con el promedio)
    const totalSavings = monthlyHistory.reduce((savings, month) => {
      const diff = averageMonthlySpending - month.totalAmount;
      return diff > 0 ? savings + diff : savings;
    }, 0);
    
    // Calcular racha de mejora (meses consecutivos con reducción desde el final)
    let improvementStreak = 0;
    for (let i = monthlyHistory.length - 1; i > 0; i--) {
      if (monthlyHistory[i].totalAmount < monthlyHistory[i - 1].totalAmount) {
        improvementStreak++;
      } else {
        break;
      }
    }
    
    return {
      monthlyHistory,
      totalSavings,
      bestMonth,
      worstMonth,
      averageMonthlySpending,
      improvementStreak
    };
    
  } catch (error) {
    console.error('Error al obtener datos de progreso:', error);
    throw error;
  }
}

/**
 * Guardar milestone de progreso
 */
export async function saveMilestone(
  userId: string,
  milestoneType: string,
  amountSaved: number,
  metadata: any = {}
): Promise<void> {
  try {
    await ProgressMilestone.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId), milestoneType },
      {
        userId: new mongoose.Types.ObjectId(userId),
        milestoneType,
        achievedAt: new Date(),
        amountSaved,
        metadata
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    // Si falla por duplicado, ignorar (ya existe el milestone)
    if ((error as any).code !== 11000) {
      console.error('Error al guardar milestone:', error);
    }
  }
}
