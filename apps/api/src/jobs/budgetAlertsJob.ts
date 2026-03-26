import cron from 'node-cron';
import { SavingsPlan } from '../models/SavingsPlan';
import { Transaction } from '../models/Transaction';
import { createNotification } from '../services/notificationService';

/**
 * Budget threshold detection logic
 * Checks active savings plans and sends alerts at 80% and 100% thresholds
 */
export async function executeBudgetAlertsJob(): Promise<void> {
  const startTime = Date.now();
  console.log('[Budget Alerts Job] Starting execution...');

  try {
    // Query all active savings plans
    const activePlans = await SavingsPlan.find({ status: 'active' });

    let notificationsCreated = 0;
    let notificationsSkipped = 0;

    for (const plan of activePlans) {
      // Calculate current spending for this plan
      const startDate = new Date(plan.startDate);
      const endDate = new Date(plan.endDate);

      const spending = await Transaction.aggregate([
        {
          $match: {
            userId: plan.userId,
            category: plan.category.toLowerCase(),
            date: {
              $gte: startDate.toISOString(),
              $lte: endDate.toISOString()
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const currentAmount = spending.length > 0 ? spending[0].total : 0;
      const percentage = (currentAmount / plan.targetAmount) * 100;

      // Check 80% threshold
      if (percentage >= 80 && percentage < 100 && !plan.notified80) {
        const notification = await createNotification({
          userId: plan.userId.toString(),
          type: 'plan_alert',
          title: '⚠️ Alerta de presupuesto: 80% alcanzado',
          message: `Has gastado $${Math.round(currentAmount).toLocaleString('es-CO')} COP de tu presupuesto de $${plan.targetAmount.toLocaleString('es-CO')} COP en ${plan.category}. ¡Cuidado con los gastos restantes!`,
          actionUrl: '/plans'
        });

        if (notification) {
          // Mark threshold as notified
          plan.notified80 = true;
          plan.lastAlertDate = new Date();
          await plan.save();
          notificationsCreated++;
        } else {
          notificationsSkipped++;
        }
      }

      // Check 100% threshold
      if (percentage >= 100 && !plan.notified100) {
        const notification = await createNotification({
          userId: plan.userId.toString(),
          type: 'plan_alert',
          title: '🚨 Presupuesto excedido',
          message: `Has superado tu presupuesto de $${plan.targetAmount.toLocaleString('es-CO')} COP en ${plan.category}. Gasto actual: $${Math.round(currentAmount).toLocaleString('es-CO')} COP.`,
          actionUrl: '/plans'
        });

        if (notification) {
          // Mark threshold as notified
          plan.notified100 = true;
          plan.lastAlertDate = new Date();
          await plan.save();
          notificationsCreated++;
        } else {
          notificationsSkipped++;
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[Budget Alerts Job] Completed in ${duration}ms. ` +
      `Created: ${notificationsCreated}, Skipped: ${notificationsSkipped}`
    );
  } catch (error) {
    console.error('[Budget Alerts Job] Error:', error);
    // Don't throw - let job continue on schedule
  }
}

/**
 * Cron job: Every 6 hours
 */
export const budgetAlertsJob = cron.schedule(
  '0 */6 * * *',
  executeBudgetAlertsJob,
  {
    scheduled: false // Don't start automatically, wait for initializeJobs()
  }
);
