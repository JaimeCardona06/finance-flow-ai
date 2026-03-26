import cron from 'node-cron';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';
import { WeeklyDigestLog } from '../models/WeeklyDigestLog';
import { createNotification } from '../services/notificationService';

/**
 * Get Monday of current week (normalized to midnight)
 */
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Weekly spending digest logic
 * Analyzes previous 7 days and sends summary to all active users
 */
export async function executeWeeklyDigestJob(): Promise<void> {
  const startTime = Date.now();
  console.log('[Weekly Digest Job] Starting execution...');

  try {
    // Get all users
    const users = await User.find({});

    // Calculate date range: previous 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get Monday of current week for idempotency
    const weekStartDate = getMondayOfWeek(now);

    let notificationsCreated = 0;
    let notificationsSkipped = 0;

    for (const user of users) {
      // Check if digest already sent for this week
      const existingLog = await WeeklyDigestLog.findOne({
        userId: user._id,
        weekStartDate
      });

      if (existingLog) {
        notificationsSkipped++;
        continue; // Already sent this week
      }

      // Query transactions for previous 7 days
      const transactions = await Transaction.find({
        userId: user._id,
        date: {
          $gte: sevenDaysAgo.toISOString(),
          $lte: now.toISOString()
        }
      });

      // Skip users with no transactions
      if (transactions.length === 0) {
        notificationsSkipped++;
        continue;
      }

      // Calculate total spending
      const totalSpending = transactions.reduce((sum, t) => sum + t.amount, 0);

      // Get top 3 categories
      const categoryTotals = transactions.reduce((acc: any, t) => {
        const cat = t.category || 'misceláneos';
        acc[cat] = (acc[cat] || 0) + t.amount;
        return acc;
      }, {});

      const topCategories = Object.entries(categoryTotals)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 3)
        .map(([cat, amount]: any) => `${cat} ($${Math.round(amount).toLocaleString('es-CO')} COP)`);

      // Calculate trend (compare to previous week)
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const previousWeekTransactions = await Transaction.find({
        userId: user._id,
        date: {
          $gte: fourteenDaysAgo.toISOString(),
          $lt: sevenDaysAgo.toISOString()
        }
      });

      const previousWeekSpending = previousWeekTransactions.reduce(
        (sum, t) => sum + t.amount,
        0
      );

      let trend = 'estable';
      if (totalSpending > previousWeekSpending * 1.1) {
        trend = 'al alza';
      } else if (totalSpending < previousWeekSpending * 0.9) {
        trend = 'a la baja';
      }

      // Generate message
      const message = 
        `Esta semana gastaste $${Math.round(totalSpending).toLocaleString('es-CO')} COP. ` +
        `Tus principales categorías fueron: ${topCategories.join(', ')}. ` +
        `Tendencia: ${trend} respecto a la semana anterior.`;

      // Create notification
      const notification = await createNotification({
        userId: user._id.toString(),
        type: 'weekly_digest',
        title: 'Resumen Semanal de Gastos',
        message,
        actionUrl: '/analysis'
      });

      if (notification) {
        // Log the digest to prevent duplicates
        try {
          await WeeklyDigestLog.create({
            userId: user._id,
            weekStartDate,
            sentAt: new Date()
          });
          notificationsCreated++;
        } catch (error: any) {
          // Handle duplicate key error (race condition)
          if (error.code === 11000) {
            notificationsSkipped++;
          } else {
            throw error;
          }
        }
      } else {
        notificationsSkipped++; // User has preference disabled
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[Weekly Digest Job] Completed in ${duration}ms. ` +
      `Created: ${notificationsCreated}, Skipped: ${notificationsSkipped}`
    );
  } catch (error) {
    console.error('[Weekly Digest Job] Error:', error);
    // Don't throw - let job continue on schedule
  }
}

/**
 * Cron job: Every Monday at 8:00 AM Colombia time
 */
export const weeklyDigestJob = cron.schedule(
  '0 8 * * 1',
  executeWeeklyDigestJob,
  {
    timezone: 'America/Bogota',
    scheduled: false // Don't start automatically, wait for initializeJobs()
  }
);
