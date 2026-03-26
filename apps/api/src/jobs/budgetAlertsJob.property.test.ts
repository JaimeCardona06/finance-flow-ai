import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import mongoose from 'mongoose';
import { executeBudgetAlertsJob } from './budgetAlertsJob';
import { SavingsPlan } from '../models/SavingsPlan';
import { Transaction } from '../models/Transaction';
import * as notificationService from '../services/notificationService';

// Mock the models and services
vi.mock('../models/SavingsPlan');
vi.mock('../models/Transaction');
vi.mock('../services/notificationService');

describe('Budget Alerts Job - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Feature: financeflow-ai, Property 4: Budget Threshold Detection
  describe('Property 4: Budget Threshold Detection', () => {
    it('should correctly detect 80% and 100% thresholds', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            targetAmount: fc.integer({ min: 100000, max: 1000000 }), // 100k-1M COP
            spendingPercentage: fc.integer({ min: 0, max: 150 }), // 0-150%
            category: fc.constantFrom('alimentación', 'transporte', 'entretenimiento', 'salud')
          }),
          async (testData) => {
            // Clear mocks for this iteration - CRITICAL for fast-check
            vi.clearAllMocks();
            
            const userId = new mongoose.Types.ObjectId();
            const now = new Date();
            const startDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
            const endDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days from now
            
            // Calculate current spending based on percentage
            const currentAmount = Math.floor((testData.targetAmount * testData.spendingPercentage) / 100);
            
            // Create mock plan
            const mockPlan = {
              _id: new mongoose.Types.ObjectId(),
              userId,
              category: testData.category,
              targetAmount: testData.targetAmount,
              startDate,
              endDate,
              status: 'active',
              notified80: false,
              notified100: false,
              save: vi.fn().mockResolvedValue(true)
            };

            // Mock SavingsPlan.find to return our plan
            vi.mocked(SavingsPlan.find).mockResolvedValue([mockPlan] as any);

            // Mock Transaction.aggregate to return current spending
            vi.mocked(Transaction.aggregate).mockResolvedValue([
              { _id: null, total: currentAmount }
            ]);

            vi.mocked(notificationService.createNotification).mockResolvedValue({} as any);

            // Execute job
            await executeBudgetAlertsJob();

            // Verify behavior based on spending percentage
            if (testData.spendingPercentage >= 100) {
              // Should trigger 100% alert
              expect(mockPlan.notified100).toBe(true);
              expect(mockPlan.save).toHaveBeenCalled();
            } else if (testData.spendingPercentage >= 80) {
              // Should trigger 80% alert
              expect(mockPlan.notified80).toBe(true);
              expect(mockPlan.save).toHaveBeenCalled();
            } else {
              // Should not trigger any alert
              expect(notificationService.createNotification).not.toHaveBeenCalled();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: financeflow-ai, Property 5: Budget Alert Idempotency
  describe('Property 5: Budget Alert Idempotency', () => {
    it('should never create duplicate alerts when notified flags are true', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            targetAmount: fc.integer({ min: 100000, max: 1000000 }),
            spendingPercentage: fc.integer({ min: 80, max: 150 }), // Always above 80%
            category: fc.constantFrom('alimentación', 'transporte', 'entretenimiento'),
            executionCount: fc.integer({ min: 2, max: 5 })
          }),
          async (testData) => {
            // Clear mocks for this iteration - CRITICAL for fast-check
            vi.clearAllMocks();
            
            const userId = new mongoose.Types.ObjectId();
            const now = new Date();
            const startDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
            const endDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
            
            const currentAmount = Math.floor((testData.targetAmount * testData.spendingPercentage) / 100);
            
            // Create mock plan with notified flags already set
            const mockPlan = {
              _id: new mongoose.Types.ObjectId(),
              userId,
              category: testData.category,
              targetAmount: testData.targetAmount,
              startDate,
              endDate,
              status: 'active',
              notified80: testData.spendingPercentage >= 80,
              notified100: testData.spendingPercentage >= 100,
              save: vi.fn().mockResolvedValue(true)
            };

            vi.mocked(SavingsPlan.find).mockResolvedValue([mockPlan] as any);
            vi.mocked(Transaction.aggregate).mockResolvedValue([
              { _id: null, total: currentAmount }
            ]);
            vi.mocked(notificationService.createNotification).mockResolvedValue({} as any);

            // Execute job multiple times
            for (let i = 0; i < testData.executionCount; i++) {
              await executeBudgetAlertsJob();
            }

            // Verify no notifications were created (idempotency)
            expect(notificationService.createNotification).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
