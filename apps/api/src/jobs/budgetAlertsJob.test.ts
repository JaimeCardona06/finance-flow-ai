import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { executeBudgetAlertsJob } from './budgetAlertsJob';
import { SavingsPlan } from '../models/SavingsPlan';
import { Transaction } from '../models/Transaction';
import * as notificationService from '../services/notificationService';

// Mock the models and services
vi.mock('../models/SavingsPlan');
vi.mock('../models/Transaction');
vi.mock('../services/notificationService');

describe('Budget Alerts Job', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeBudgetAlertsJob', () => {
    it('should detect 80% threshold and create notification', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockPlan = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        category: 'comida',
        targetAmount: 100000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: 'active',
        notified80: false,
        notified100: false,
        save: vi.fn().mockResolvedValue(true)
      };

      // Mock active plans
      vi.mocked(SavingsPlan.find).mockResolvedValue([mockPlan] as any);

      // Mock spending at 85% (85,000 COP)
      vi.mocked(Transaction.aggregate).mockResolvedValue([
        { _id: null, total: 85000 }
      ]);

      // Mock notification creation
      vi.mocked(notificationService.createNotification).mockResolvedValue({
        _id: 'notification-id',
        type: 'plan_alert'
      } as any);

      await executeBudgetAlertsJob();

      // Verify notification was created with 80% alert
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userId.toString(),
          type: 'plan_alert',
          title: '⚠️ Alerta de presupuesto: 80% alcanzado',
          actionUrl: '/plans'
        })
      );

      // Verify plan was updated
      expect(mockPlan.notified80).toBe(true);
      expect(mockPlan.lastAlertDate).toBeInstanceOf(Date);
      expect(mockPlan.save).toHaveBeenCalled();
    });

    it('should detect 100% threshold and create notification', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockPlan = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        category: 'transporte',
        targetAmount: 50000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: 'active',
        notified80: true, // Already notified 80%
        notified100: false,
        save: vi.fn().mockResolvedValue(true)
      };

      vi.mocked(SavingsPlan.find).mockResolvedValue([mockPlan] as any);

      // Mock spending at 105% (52,500 COP)
      vi.mocked(Transaction.aggregate).mockResolvedValue([
        { _id: null, total: 52500 }
      ]);

      vi.mocked(notificationService.createNotification).mockResolvedValue({
        _id: 'notification-id',
        type: 'plan_alert'
      } as any);

      await executeBudgetAlertsJob();

      // Verify notification was created with 100% alert
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userId.toString(),
          type: 'plan_alert',
          title: '🚨 Presupuesto excedido'
        })
      );

      // Verify plan was updated
      expect(mockPlan.notified100).toBe(true);
      expect(mockPlan.save).toHaveBeenCalled();
    });

    it('should not create duplicate 80% alert when already notified', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockPlan = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        category: 'comida',
        targetAmount: 100000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: 'active',
        notified80: true, // Already notified
        notified100: false,
        save: vi.fn()
      };

      vi.mocked(SavingsPlan.find).mockResolvedValue([mockPlan] as any);

      // Mock spending at 85%
      vi.mocked(Transaction.aggregate).mockResolvedValue([
        { _id: null, total: 85000 }
      ]);

      await executeBudgetAlertsJob();

      // Verify notification was NOT created
      expect(notificationService.createNotification).not.toHaveBeenCalled();
      expect(mockPlan.save).not.toHaveBeenCalled();
    });

    it('should not create duplicate 100% alert when already notified', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockPlan = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        category: 'comida',
        targetAmount: 100000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: 'active',
        notified80: true,
        notified100: true, // Already notified
        save: vi.fn()
      };

      vi.mocked(SavingsPlan.find).mockResolvedValue([mockPlan] as any);

      // Mock spending at 110%
      vi.mocked(Transaction.aggregate).mockResolvedValue([
        { _id: null, total: 110000 }
      ]);

      await executeBudgetAlertsJob();

      // Verify notification was NOT created
      expect(notificationService.createNotification).not.toHaveBeenCalled();
    });

    it('should handle null return from createNotification (preference disabled)', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockPlan = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        category: 'comida',
        targetAmount: 100000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: 'active',
        notified80: false,
        notified100: false,
        save: vi.fn()
      };

      vi.mocked(SavingsPlan.find).mockResolvedValue([mockPlan] as any);

      // Mock spending at 85%
      vi.mocked(Transaction.aggregate).mockResolvedValue([
        { _id: null, total: 85000 }
      ]);

      // Mock notification returning null (preference disabled)
      vi.mocked(notificationService.createNotification).mockResolvedValue(null);

      await executeBudgetAlertsJob();

      // Verify plan was NOT updated when notification is null
      expect(mockPlan.save).not.toHaveBeenCalled();
    });

    it('should handle backward compatibility with undefined notified fields', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockPlan = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        category: 'comida',
        targetAmount: 100000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: 'active',
        // notified80 and notified100 are undefined (old document)
        save: vi.fn().mockResolvedValue(true)
      };

      vi.mocked(SavingsPlan.find).mockResolvedValue([mockPlan] as any);

      // Mock spending at 85%
      vi.mocked(Transaction.aggregate).mockResolvedValue([
        { _id: null, total: 85000 }
      ]);

      vi.mocked(notificationService.createNotification).mockResolvedValue({
        _id: 'notification-id'
      } as any);

      await executeBudgetAlertsJob();

      // Verify notification was created (undefined treated as false)
      expect(notificationService.createNotification).toHaveBeenCalled();
      expect(mockPlan.save).toHaveBeenCalled();
    });

    it('should catch and log errors without throwing', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock find to throw error
      vi.mocked(SavingsPlan.find).mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(executeBudgetAlertsJob()).resolves.not.toThrow();

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Budget Alerts Job] Error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should format messages in Spanish with COP currency', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockPlan = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        category: 'comida',
        targetAmount: 100000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: 'active',
        notified80: false,
        notified100: false,
        save: vi.fn().mockResolvedValue(true)
      };

      vi.mocked(SavingsPlan.find).mockResolvedValue([mockPlan] as any);
      vi.mocked(Transaction.aggregate).mockResolvedValue([
        { _id: null, total: 85000 }
      ]);
      vi.mocked(notificationService.createNotification).mockResolvedValue({} as any);

      await executeBudgetAlertsJob();

      // Verify message contains Spanish text and COP
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('COP')
        })
      );
    });

    it('should handle zero spending correctly', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockPlan = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        category: 'comida',
        targetAmount: 100000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: 'active',
        notified80: false,
        notified100: false,
        save: vi.fn()
      };

      vi.mocked(SavingsPlan.find).mockResolvedValue([mockPlan] as any);

      // Mock no spending (empty aggregation result)
      vi.mocked(Transaction.aggregate).mockResolvedValue([]);

      await executeBudgetAlertsJob();

      // Verify no notification was created (0% spending)
      expect(notificationService.createNotification).not.toHaveBeenCalled();
    });
  });
});
