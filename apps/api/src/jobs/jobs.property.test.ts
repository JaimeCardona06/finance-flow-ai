import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import mongoose from 'mongoose';
import { executeSubscriptionAlertsJob } from './subscriptionAlertsJob';
import { executeBudgetAlertsJob } from './budgetAlertsJob';
import { executeWeeklyDigestJob } from './weeklyDigestJob';
import { Transaction } from '../models/Transaction';
import { SavingsPlan } from '../models/SavingsPlan';
import { User } from '../models/User';
import { SubscriptionAlertLog } from '../models/SubscriptionAlertLog';
import { WeeklyDigestLog } from '../models/WeeklyDigestLog';
import * as notificationService from '../services/notificationService';

// Mock the models and services
vi.mock('../models/Transaction');
vi.mock('../models/SavingsPlan');
vi.mock('../models/User');
vi.mock('../models/SubscriptionAlertLog');
vi.mock('../models/WeeklyDigestLog');
vi.mock('../services/notificationService');

describe('Cross-Job Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Feature: financeflow-ai, Property 13: User Preference Respect
  describe('Property 13: User Preference Respect', () => {
    it('should respect user preferences and continue without error when createNotification returns null', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('subscription', 'budget', 'digest'),
          async (notificationType) => {
            // Clear mocks for this iteration - CRITICAL for fast-check
            vi.clearAllMocks();
            
            const userId = new mongoose.Types.ObjectId();
            const now = new Date();

            // Mock createNotification to return null (preference disabled)
            vi.mocked(notificationService.createNotification).mockResolvedValue(null);

            if (notificationType === 'subscription') {
              // Setup subscription scenario
              const hoursAgo = 30 * 24 - 36; // 36 hours until next charge
              const lastCharge = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
              const previousCharge = new Date(lastCharge.getTime() - 30 * 24 * 60 * 60 * 1000);

              vi.mocked(Transaction.aggregate).mockResolvedValue([
                {
                  _id: { userId, merchant: 'Netflix' },
                  transactions: [
                    { date: previousCharge.toISOString(), amount: 50000 },
                    { date: lastCharge.toISOString(), amount: 50000 }
                  ],
                  avgAmount: 50000,
                  count: 2
                }
              ]);

              vi.mocked(SubscriptionAlertLog.findOne).mockResolvedValue(null);
              vi.mocked(SubscriptionAlertLog.create).mockResolvedValue({} as any);

              // Execute job - should not throw
              await expect(executeSubscriptionAlertsJob()).resolves.not.toThrow();

              // Verify createNotification was called but returned null
              expect(notificationService.createNotification).toHaveBeenCalled();
            } else if (notificationType === 'budget') {
              // Setup budget scenario
              const startDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
              const endDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
              const targetAmount = 500000;
              const currentAmount = 450000; // 90% - triggers 80% alert

              const mockPlan = {
                _id: new mongoose.Types.ObjectId(),
                userId,
                category: 'alimentación',
                targetAmount,
                startDate,
                endDate,
                status: 'active',
                notified80: false,
                notified100: false,
                save: vi.fn().mockResolvedValue(true)
              };

              vi.mocked(SavingsPlan.find).mockResolvedValue([mockPlan] as any);
              vi.mocked(Transaction.aggregate).mockResolvedValue([
                { _id: null, total: currentAmount }
              ]);

              // Execute job - should not throw
              await expect(executeBudgetAlertsJob()).resolves.not.toThrow();

              // Verify createNotification was called but returned null
              expect(notificationService.createNotification).toHaveBeenCalled();
            } else {
              // Setup digest scenario
              const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

              vi.mocked(User.find).mockResolvedValue([
                { _id: userId, email: 'test@example.com' }
              ] as any);

              vi.mocked(WeeklyDigestLog.findOne).mockResolvedValue(null);

              vi.mocked(Transaction.find).mockResolvedValue([
                {
                  _id: new mongoose.Types.ObjectId(),
                  userId,
                  date: sevenDaysAgo.toISOString(),
                  amount: 100000,
                  category: 'alimentación'
                }
              ] as any);

              vi.mocked(WeeklyDigestLog.create).mockResolvedValue({} as any);

              // Execute job - should not throw
              await expect(executeWeeklyDigestJob()).resolves.not.toThrow();

              // Verify createNotification was called but returned null
              expect(notificationService.createNotification).toHaveBeenCalled();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: financeflow-ai, Property 15: Error Handling Without Crash
  describe('Property 15: Error Handling Without Crash', () => {
    it('should catch errors, log them, and not re-throw', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            jobType: fc.constantFrom('subscription', 'budget', 'digest'),
            errorType: fc.constantFrom('database', 'validation', 'network')
          }),
          async (testData) => {
            // Clear mocks for this iteration - CRITICAL for fast-check
            vi.clearAllMocks();
            
            const errorMessage = `${testData.errorType} error occurred`;
            const error = new Error(errorMessage);

            // Mock console.error to verify logging
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            if (testData.jobType === 'subscription') {
              // Mock Transaction.aggregate to throw error
              vi.mocked(Transaction.aggregate).mockRejectedValue(error);

              // Execute job - should not throw
              await expect(executeSubscriptionAlertsJob()).resolves.not.toThrow();

              // Verify error was logged
              expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('[Subscription Alerts Job] Error:'),
                error
              );
            } else if (testData.jobType === 'budget') {
              // Mock SavingsPlan.find to throw error
              vi.mocked(SavingsPlan.find).mockRejectedValue(error);

              // Execute job - should not throw
              await expect(executeBudgetAlertsJob()).resolves.not.toThrow();

              // Verify error was logged
              expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('[Budget Alerts Job] Error:'),
                error
              );
            } else {
              // Mock User.find to throw error
              vi.mocked(User.find).mockRejectedValue(error);

              // Execute job - should not throw
              await expect(executeWeeklyDigestJob()).resolves.not.toThrow();

              // Verify error was logged
              expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('[Weekly Digest Job] Error:'),
                error
              );
            }

            consoleErrorSpy.mockRestore();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
