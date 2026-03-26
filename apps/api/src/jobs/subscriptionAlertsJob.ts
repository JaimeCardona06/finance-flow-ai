import cron from 'node-cron';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction';
import { SubscriptionAlertLog } from '../models/SubscriptionAlertLog';
import { createNotification } from '../services/notificationService';

/**
 * Subscription detection logic
 * Identifies subscriptions with next charge in 24-48 hours
 */
export async function executeSubscriptionAlertsJob(): Promise<void> {
  const startTime = Date.now();
  console.log('[Subscription Alerts Job] Starting execution...');

  try {
    // Calculate date range: 24-48 hours from now
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Query transactions with category 'suscripciones'
    // Group by userId and merchant to find recurring patterns
    const subscriptions = await Transaction.aggregate([
      {
        $match: {
          category: 'suscripciones'
        }
      },
      {
        $group: {
          _id: {
            userId: '$userId',
            merchant: '$merchant'
          },
          transactions: { $push: { date: '$date', amount: '$amount' } },
          avgAmount: { $avg: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gte: 2 } // At least 2 transactions to identify pattern
        }
      }
    ]);

    let notificationsCreated = 0;
    let notificationsSkipped = 0;

    for (const sub of subscriptions) {
      const { userId, merchant } = sub._id;
      const transactions = sub.transactions;
      const avgAmount = sub.avgAmount;

      // Calculate next expected charge date based on transaction history
      // Sort transactions by date
      transactions.sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Calculate average interval between charges (in days)
      let totalInterval = 0;
      for (let i = 1; i < transactions.length; i++) {
        const diff = new Date(transactions[i].date).getTime() - 
                     new Date(transactions[i-1].date).getTime();
        totalInterval += diff / (1000 * 60 * 60 * 24); // Convert to days
      }
      const avgInterval = totalInterval / (transactions.length - 1);

      // Predict next charge date
      const lastChargeDate = new Date(transactions[transactions.length - 1].date);
      const nextChargeDate = new Date(
        lastChargeDate.getTime() + avgInterval * 24 * 60 * 60 * 1000
      );

      // Check if next charge is in 24-48 hour window
      if (nextChargeDate >= in24Hours && nextChargeDate <= in48Hours) {
        // Normalize date to midnight for idempotency check
        const normalizedDate = new Date(nextChargeDate);
        normalizedDate.setHours(0, 0, 0, 0);

        // Check if alert already sent for this subscription + date
        const existingLog = await SubscriptionAlertLog.findOne({
          userId: new mongoose.Types.ObjectId(userId),
          merchant,
          expectedChargeDate: normalizedDate
        });

        if (existingLog) {
          notificationsSkipped++;
          continue; // Already notified
        }

        // Create notification
        const notification = await createNotification({
          userId: userId.toString(),
          type: 'subscription',
          title: 'Renovación de suscripción próxima',
          message: `Tu suscripción a ${merchant} se renovará pronto por aproximadamente $${Math.round(avgAmount).toLocaleString('es-CO')} COP. Revisa si deseas mantenerla.`,
          actionUrl: '/subscriptions'
        });

        if (notification) {
          // Log the alert to prevent duplicates
          try {
            await SubscriptionAlertLog.create({
              userId: new mongoose.Types.ObjectId(userId),
              merchant,
              expectedChargeDate: normalizedDate,
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
    }

    const duration = Date.now() - startTime;
    console.log(
      `[Subscription Alerts Job] Completed in ${duration}ms. ` +
      `Created: ${notificationsCreated}, Skipped: ${notificationsSkipped}`
    );
  } catch (error) {
    console.error('[Subscription Alerts Job] Error:', error);
    // Don't throw - let job continue on schedule
  }
}

/**
 * Cron job: Daily at 9:00 AM Colombia time
 */
export const subscriptionAlertsJob = cron.schedule(
  '0 9 * * *',
  executeSubscriptionAlertsJob,
  {
    timezone: 'America/Bogota',
    scheduled: false // Don't start automatically, wait for initializeJobs()
  }
);
