import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import mongoose from 'mongoose';
import { executeWeeklyDigestJob } from './weeklyDigestJob';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';
import { WeeklyDigestLog } from '../models/WeeklyDigestLog';
import * as notificationService from '../services/notificationService';

// Mock the models and services
vi.mock('../models/User');
vi.mock('../models/Transaction');
vi.mock('../models/WeeklyDigestLog');
vi.mock('../services/notificationService');

describe('Weekly Digest Job - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Feature: financeflow-ai, Property 9: Weekly Digest Calculations
  describe('Property 9: Weekly Digest Calculations', () => {
    it('should correctly calculate total spending, top categories, and trends', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            transactionCount: fc.integer({ min: 1, max: 50 }),
            categories: fc.array(
              fc.constantFrom('alimentación', 'transporte', 'entretenimiento', 'salud'),
              { minLength: 1, maxLength: 4 }
            )
          }),
          async (testData) => {
            // Clear mocks for this iteration - CRITICAL for fast-check
            vi.clearAllMocks();
            
            const userId = new mongoose.Types.ObjectId();
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

            // Generate random transactions for current week
            const currentWeekTransactions = [];
            let expectedTotal = 0;
            const categoryTotals: Record<string, number> = {};

            for (let i = 0; i < testData.transactionCount; i++) {
              const category = testData.categories[i % testData.categories.length];
              const amount = Math.floor(Math.random() * 50000) + 10000; // 10k-60k COP
              const date = new Date(
                sevenDaysAgo.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000
              );

              currentWeekTransactions.push({
                _id: new mongoose.Types.ObjectId(),
                userId,
                date: date.toISOString(),
                amount,
                category,
                description: 'Test transaction'
              });

              expectedTotal += amount;
              categoryTotals[category] = (categoryTotals[category] || 0) + amount;
            }

            // Calculate expected top 3 categories
            const sortedCategories = Object.entries(categoryTotals)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3);

            // Generate previous week transactions for trend
            const previousWeekTotal = Math.floor(expectedTotal * (0.5 + Math.random())); // 50-150% of current
            const previousWeekTransactions = [
              {
                _id: new mongoose.Types.ObjectId(),
                userId,
                date: new Date(fourteenDaysAgo.getTime() + 24 * 60 * 60 * 1000).toISOString(),
                amount: previousWeekTotal,
                category: 'alimentación'
              }
            ];

            // Calculate expected trend
            let expectedTrend = 'estable';
            if (expectedTotal > previousWeekTotal * 1.1) {
              expectedTrend = 'al alza';
            } else if (expectedTotal < previousWeekTotal * 0.9) {
              expectedTrend = 'a la baja';
            }

            // Mock User.find
            vi.mocked(User.find).mockResolvedValue([
              { _id: userId, email: 'test@example.com' }
            ] as any);

            // Mock WeeklyDigestLog.findOne (no existing log)
            vi.mocked(WeeklyDigestLog.findOne).mockResolvedValue(null);

            // Mock Transaction.find for current week and previous week
            let callCount = 0;
            vi.mocked(Transaction.find).mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                // First call: current week transactions
                return Promise.resolve(currentWeekTransactions) as any;
              } else {
                // Second call: previous week transactions
                return Promise.resolve(previousWeekTransactions) as any;
              }
            });

            // Mock createNotification
            let capturedMessage = '';
            vi.mocked(notificationService.createNotification).mockImplementation(async (data: any) => {
              capturedMessage = data.message;
              return {} as any;
            });

            vi.mocked(WeeklyDigestLog.create).mockResolvedValue({} as any);

            // Execute job
            await executeWeeklyDigestJob();

            // Verify notification was created
            expect(notificationService.createNotification).toHaveBeenCalled();

            // Verify message contains expected total
            expect(capturedMessage).toContain(expectedTotal.toLocaleString('es-CO'));

            // Verify message contains expected trend
            expect(capturedMessage).toContain(expectedTrend);

            // Verify top categories are mentioned (at least the top one)
            if (sortedCategories.length > 0) {
              expect(capturedMessage).toContain(sortedCategories[0][0]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: financeflow-ai, Property 12: Weekly Digest Idempotency
  describe('Property 12: Weekly Digest Idempotency', () => {
    it('should never create duplicate digests for same week', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            transactionCount: fc.integer({ min: 5, max: 20 }),
            executionCount: fc.integer({ min: 2, max: 5 })
          }),
          async (testData) => {
            // Clear mocks for this iteration - CRITICAL for fast-check
            vi.clearAllMocks();
            
            const userId = new mongoose.Types.ObjectId();
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            // Generate transactions
            const transactions = [];
            for (let i = 0; i < testData.transactionCount; i++) {
              transactions.push({
                _id: new mongoose.Types.ObjectId(),
                userId,
                date: new Date(sevenDaysAgo.getTime() + i * 60 * 60 * 1000).toISOString(),
                amount: 10000 + i * 1000,
                category: 'alimentación'
              });
            }

            vi.mocked(User.find).mockResolvedValue([
              { _id: userId, email: 'test@example.com' }
            ] as any);

            // First execution: no existing log
            vi.mocked(WeeklyDigestLog.findOne).mockResolvedValueOnce(null);

            // Subsequent executions: existing log found
            for (let i = 1; i < testData.executionCount; i++) {
              vi.mocked(WeeklyDigestLog.findOne).mockResolvedValueOnce({
                userId,
                weekStartDate: new Date(),
                sentAt: new Date()
              } as any);
            }

            vi.mocked(Transaction.find).mockResolvedValue(transactions as any);
            vi.mocked(notificationService.createNotification).mockResolvedValue({} as any);
            vi.mocked(WeeklyDigestLog.create).mockResolvedValue({} as any);

            // Execute job multiple times
            for (let i = 0; i < testData.executionCount; i++) {
              await executeWeeklyDigestJob();
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
