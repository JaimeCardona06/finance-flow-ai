import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import fc from 'fast-check';
import mongoose from 'mongoose';
import { executeSubscriptionAlertsJob } from './subscriptionAlertsJob';
import { Transaction } from '../models/Transaction';
import { SubscriptionAlertLog } from '../models/SubscriptionAlertLog';
import * as notificationService from '../services/notificationService';

// Mock the models and services
vi.mock('../models/Transaction');
vi.mock('../models/SubscriptionAlertLog');
vi.mock('../services/notificationService');

describe('Subscription Alerts Job - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Feature: financeflow-ai, Property 1: Subscription Detection Pipeline
  describe('Property 1: Subscription Detection Pipeline', () => {
    it('should correctly identify subscriptions with next charge in 24-48h window', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate subscription patterns
          fc.record({
            merchant: fc.constantFrom('Netflix', 'Spotify', 'Amazon Prime', 'Disney+', 'HBO Max'),
            intervalDays: fc.constantFrom(30), // Monthly subscriptions for simplicity
            amount: fc.integer({ min: 10000, max: 100000 }), // 10k-100k COP
            hoursUntilNextCharge: fc.integer({ min: 0, max: 96 }) // 0-96 hours
          }),
          async (subscription) => {
            // Clear mocks for this iteration
            vi.clearAllMocks();
            
            const userId = new mongoose.Types.ObjectId();
            const now = new Date();
            
            // Calculate when the last charge was based on hoursUntilNextCharge
            // If next charge is in X hours, and interval is 30 days, last charge was (30 days - X hours) ago
            const hoursAgo = (subscription.intervalDays * 24) - subscription.hoursUntilNextCharge;
            const lastCharge = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
            const previousCharge = new Date(lastCharge.getTime() - subscription.intervalDays * 24 * 60 * 60 * 1000);

            // Mock aggregation
            vi.mocked(Transaction.aggregate).mockResolvedValue([
              {
                _id: { userId, merchant: subscription.merchant },
                transactions: [
                  { date: previousCharge.toISOString(), amount: subscription.amount },
                  { date: lastCharge.toISOString(), amount: subscription.amount }
                ],
                avgAmount: subscription.amount,
                count: 2
              }
            ]);

            // Mock no existing log
            vi.mocked(SubscriptionAlertLog.findOne).mockResolvedValue(null);
            vi.mocked(notificationService.createNotification).mockResolvedValue({} as any);
            vi.mocked(SubscriptionAlertLog.create).mockResolvedValue({} as any);

            // Execute job
            await executeSubscriptionAlertsJob();
            
            // Verify behavior based on window
            const inWindow = subscription.hoursUntilNextCharge >= 24 && 
                            subscription.hoursUntilNextCharge <= 48;
            
            if (inWindow) {
              // Should create notification
              expect(notificationService.createNotification).toHaveBeenCalled();
            } else {
              // Should NOT create notification
              expect(notificationService.createNotification).not.toHaveBeenCalled();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: financeflow-ai, Property 3: Subscription Alert Idempotency
  describe('Property 3: Subscription Alert Idempotency', () => {
    it('should never create duplicate alerts for same subscription + date', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            merchant: fc.constantFrom('Netflix', 'Spotify', 'Amazon Prime'),
            amount: fc.integer({ min: 10000, max: 100000 }),
            executionCount: fc.integer({ min: 2, max: 5 })
          }),
          async (testData) => {
            // Clear mocks for this iteration
            vi.clearAllMocks();
            
            const userId = new mongoose.Types.ObjectId();
            const now = new Date();
            
            // Create transactions that will trigger alert (36 hours until next charge)
            const hoursAgo = 30 * 24 - 36;
            const lastCharge = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
            const previousCharge = new Date(lastCharge.getTime() - 30 * 24 * 60 * 60 * 1000);

            const expectedChargeDate = new Date(lastCharge.getTime() + 30 * 24 * 60 * 60 * 1000);
            expectedChargeDate.setHours(0, 0, 0, 0);

            // Mock aggregation - will be called multiple times
            vi.mocked(Transaction.aggregate).mockResolvedValue([
              {
                _id: { userId, merchant: testData.merchant },
                transactions: [
                  { date: previousCharge.toISOString(), amount: testData.amount },
                  { date: lastCharge.toISOString(), amount: testData.amount }
                ],
                avgAmount: testData.amount,
                count: 2
              }
            ]);

            // First execution: no existing log
            vi.mocked(SubscriptionAlertLog.findOne).mockResolvedValueOnce(null);
            
            // Subsequent executions: existing log found
            for (let i = 1; i < testData.executionCount; i++) {
              vi.mocked(SubscriptionAlertLog.findOne).mockResolvedValueOnce({
                userId,
                merchant: testData.merchant,
                expectedChargeDate,
                sentAt: new Date()
              } as any);
            }

            vi.mocked(notificationService.createNotification).mockResolvedValue({} as any);
            vi.mocked(SubscriptionAlertLog.create).mockResolvedValue({} as any);

            // Execute job multiple times
            for (let i = 0; i < testData.executionCount; i++) {
              await executeSubscriptionAlertsJob();
            }

            // Verify notification created exactly once (first execution only)
            expect(notificationService.createNotification).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
