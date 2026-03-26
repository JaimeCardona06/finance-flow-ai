import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { executeSubscriptionAlertsJob } from './subscriptionAlertsJob';
import { Transaction } from '../models/Transaction';
import { SubscriptionAlertLog } from '../models/SubscriptionAlertLog';
import * as notificationService from '../services/notificationService';

// Mock the models and services
vi.mock('../models/Transaction');
vi.mock('../models/SubscriptionAlertLog');
vi.mock('../services/notificationService');

describe('Subscription Alerts Job', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeSubscriptionAlertsJob', () => {
    it('should detect subscription expiring in 24-48 hours', async () => {
      const userId = new mongoose.Types.ObjectId();
      const now = new Date();
      // Create transactions that will predict next charge in ~36 hours
      // If we have charges 30 days apart, and the last one was ~35 hours ago,
      // the next predicted charge will be in ~29 days + 1 day = ~30 days - 35 hours = ~28.5 days from now
      // We need: last charge was (30 days - 36 hours) ago
      const hoursAgo = 30 * 24 - 36; // 30 days minus 36 hours
      const lastCharge = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
      const previousCharge = new Date(lastCharge.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Mock aggregation to return recurring subscription
      vi.mocked(Transaction.aggregate).mockResolvedValue([
        {
          _id: { userId, merchant: 'Netflix' },
          transactions: [
            { date: previousCharge.toISOString(), amount: 45000 },
            { date: lastCharge.toISOString(), amount: 45000 }
          ],
          avgAmount: 45000,
          count: 2
        }
      ]);

      // Mock no existing log
      vi.mocked(SubscriptionAlertLog.findOne).mockResolvedValue(null);

      // Mock notification creation
      vi.mocked(notificationService.createNotification).mockResolvedValue({
        _id: 'notification-id',
        userId,
        type: 'subscription',
        title: 'Test',
        message: 'Test',
        read: false
      } as any);

      // Mock log creation
      vi.mocked(SubscriptionAlertLog.create).mockResolvedValue({} as any);

      await executeSubscriptionAlertsJob();

      // Verify createNotification was called with correct parameters
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userId.toString(),
          type: 'subscription',
          actionUrl: '/subscriptions'
        })
      );

      // Verify log was created
      expect(SubscriptionAlertLog.create).toHaveBeenCalled();
    });

    it('should not create duplicate alerts', async () => {
      const userId = new mongoose.Types.ObjectId();
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Mock aggregation
      vi.mocked(Transaction.aggregate).mockResolvedValue([
        {
          _id: { userId, merchant: 'Netflix' },
          transactions: [
            { date: sixtyDaysAgo.toISOString(), amount: 45000 },
            { date: thirtyDaysAgo.toISOString(), amount: 45000 }
          ],
          avgAmount: 45000,
          count: 2
        }
      ]);

      // Mock existing log (already notified)
      vi.mocked(SubscriptionAlertLog.findOne).mockResolvedValue({
        userId,
        merchant: 'Netflix',
        expectedChargeDate: new Date(),
        sentAt: new Date()
      } as any);

      await executeSubscriptionAlertsJob();

      // Verify createNotification was NOT called
      expect(notificationService.createNotification).not.toHaveBeenCalled();
    });

    it('should handle null return from createNotification (preference disabled)', async () => {
      const userId = new mongoose.Types.ObjectId();
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Mock aggregation
      vi.mocked(Transaction.aggregate).mockResolvedValue([
        {
          _id: { userId, merchant: 'Netflix' },
          transactions: [
            { date: sixtyDaysAgo.toISOString(), amount: 45000 },
            { date: thirtyDaysAgo.toISOString(), amount: 45000 }
          ],
          avgAmount: 45000,
          count: 2
        }
      ]);

      // Mock no existing log
      vi.mocked(SubscriptionAlertLog.findOne).mockResolvedValue(null);

      // Mock notification creation returning null (preference disabled)
      vi.mocked(notificationService.createNotification).mockResolvedValue(null);

      await executeSubscriptionAlertsJob();

      // Verify log was NOT created when notification is null
      expect(SubscriptionAlertLog.create).not.toHaveBeenCalled();
    });

    it('should handle duplicate key error gracefully', async () => {
      const userId = new mongoose.Types.ObjectId();
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Mock aggregation
      vi.mocked(Transaction.aggregate).mockResolvedValue([
        {
          _id: { userId, merchant: 'Netflix' },
          transactions: [
            { date: sixtyDaysAgo.toISOString(), amount: 45000 },
            { date: thirtyDaysAgo.toISOString(), amount: 45000 }
          ],
          avgAmount: 45000,
          count: 2
        }
      ]);

      // Mock no existing log initially
      vi.mocked(SubscriptionAlertLog.findOne).mockResolvedValue(null);

      // Mock notification creation
      vi.mocked(notificationService.createNotification).mockResolvedValue({
        _id: 'notification-id',
        userId,
        type: 'subscription'
      } as any);

      // Mock duplicate key error on log creation
      const duplicateError: any = new Error('Duplicate key');
      duplicateError.code = 11000;
      vi.mocked(SubscriptionAlertLog.create).mockRejectedValue(duplicateError);

      // Should not throw
      await expect(executeSubscriptionAlertsJob()).resolves.not.toThrow();
    });

    it('should catch and log errors without throwing', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock aggregation to throw error
      vi.mocked(Transaction.aggregate).mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(executeSubscriptionAlertsJob()).resolves.not.toThrow();

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Subscription Alerts Job] Error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should skip subscriptions not in 24-48 hour window', async () => {
      const userId = new mongoose.Types.ObjectId();
      const now = new Date();
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);

      // Mock aggregation with subscription that won't be in window
      vi.mocked(Transaction.aggregate).mockResolvedValue([
        {
          _id: { userId, merchant: 'Spotify' },
          transactions: [
            { date: twentyDaysAgo.toISOString(), amount: 15000 },
            { date: tenDaysAgo.toISOString(), amount: 15000 }
          ],
          avgAmount: 15000,
          count: 2
        }
      ]);

      await executeSubscriptionAlertsJob();

      // Verify createNotification was NOT called (not in window)
      expect(notificationService.createNotification).not.toHaveBeenCalled();
    });

    it('should format message in Spanish with COP currency', async () => {
      const userId = new mongoose.Types.ObjectId();
      const now = new Date();
      // Create transactions that will predict next charge in ~36 hours
      const hoursAgo = 30 * 24 - 36; // 30 days minus 36 hours
      const lastCharge = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
      const previousCharge = new Date(lastCharge.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Mock aggregation
      vi.mocked(Transaction.aggregate).mockResolvedValue([
        {
          _id: { userId, merchant: 'Netflix' },
          transactions: [
            { date: previousCharge.toISOString(), amount: 45000 },
            { date: lastCharge.toISOString(), amount: 45000 }
          ],
          avgAmount: 45000,
          count: 2
        }
      ]);

      vi.mocked(SubscriptionAlertLog.findOne).mockResolvedValue(null);
      vi.mocked(notificationService.createNotification).mockResolvedValue({} as any);
      vi.mocked(SubscriptionAlertLog.create).mockResolvedValue({} as any);

      await executeSubscriptionAlertsJob();

      // Verify message contains Spanish text and COP
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Renovación de suscripción próxima',
          message: expect.stringContaining('COP')
        })
      );
    });
  });
});
