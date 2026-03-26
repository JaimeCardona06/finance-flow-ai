import { describe, it, expect, beforeEach, vi } from 'vitest';
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

describe('Weekly Digest Job', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeWeeklyDigestJob', () => {
    it('should create digest for user with transactions', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockUser = { _id: userId, email: 'test@example.com' };

      // Mock users
      vi.mocked(User.find).mockResolvedValue([mockUser] as any);

      // Mock no existing log
      vi.mocked(WeeklyDigestLog.findOne).mockResolvedValue(null);

      // Mock current week transactions
      const mockTransactions = [
        { userId, amount: 50000, category: 'comida', date: new Date().toISOString() },
        { userId, amount: 30000, category: 'transporte', date: new Date().toISOString() },
        { userId, amount: 20000, category: 'comida', date: new Date().toISOString() }
      ];

      // Mock previous week transactions
      const mockPreviousTransactions = [
        { userId, amount: 40000, category: 'comida', date: new Date().toISOString() }
      ];

      // First call: current week, second call: previous week
      vi.mocked(Transaction.find)
        .mockResolvedValueOnce(mockTransactions as any)
        .mockResolvedValueOnce(mockPreviousTransactions as any);

      // Mock notification creation
      vi.mocked(notificationService.createNotification).mockResolvedValue({
        _id: 'notification-id',
        type: 'weekly_digest'
      } as any);

      // Mock log creation
      vi.mocked(WeeklyDigestLog.create).mockResolvedValue({} as any);

      await executeWeeklyDigestJob();

      // Verify notification was created
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: userId.toString(),
          type: 'weekly_digest',
          title: 'Resumen Semanal de Gastos',
          actionUrl: '/analysis'
        })
      );

      // Verify log was created
      expect(WeeklyDigestLog.create).toHaveBeenCalled();
    });

    it('should skip users with zero transactions', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockUser = { _id: userId, email: 'test@example.com' };

      vi.mocked(User.find).mockResolvedValue([mockUser] as any);
      vi.mocked(WeeklyDigestLog.findOne).mockResolvedValue(null);

      // Mock no transactions
      vi.mocked(Transaction.find).mockResolvedValue([]);

      await executeWeeklyDigestJob();

      // Verify notification was NOT created
      expect(notificationService.createNotification).not.toHaveBeenCalled();
    });

    it('should not create duplicate digest (idempotency)', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockUser = { _id: userId, email: 'test@example.com' };

      vi.mocked(User.find).mockResolvedValue([mockUser] as any);

      // Mock existing log (already sent this week)
      vi.mocked(WeeklyDigestLog.findOne).mockResolvedValue({
        userId,
        weekStartDate: new Date(),
        sentAt: new Date()
      } as any);

      await executeWeeklyDigestJob();

      // Verify notification was NOT created
      expect(notificationService.createNotification).not.toHaveBeenCalled();
    });

    it('should calculate total spending correctly', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockUser = { _id: userId, email: 'test@example.com' };

      vi.mocked(User.find).mockResolvedValue([mockUser] as any);
      vi.mocked(WeeklyDigestLog.findOne).mockResolvedValue(null);

      const mockTransactions = [
        { userId, amount: 50000, category: 'comida', date: new Date().toISOString() },
        { userId, amount: 30000, category: 'transporte', date: new Date().toISOString() },
        { userId, amount: 20000, category: 'comida', date: new Date().toISOString() }
      ];

      vi.mocked(Transaction.find)
        .mockResolvedValueOnce(mockTransactions as any)
        .mockResolvedValueOnce([] as any); // Previous week

      vi.mocked(notificationService.createNotification).mockResolvedValue({} as any);
      vi.mocked(WeeklyDigestLog.create).mockResolvedValue({} as any);

      await executeWeeklyDigestJob();

      // Verify message contains correct total (100,000 COP)
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('100')
        })
      );
    });

    it('should identify top 3 categories correctly', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockUser = { _id: userId, email: 'test@example.com' };

      vi.mocked(User.find).mockResolvedValue([mockUser] as any);
      vi.mocked(WeeklyDigestLog.findOne).mockResolvedValue(null);

      const mockTransactions = [
        { userId, amount: 50000, category: 'comida', date: new Date().toISOString() },
        { userId, amount: 30000, category: 'transporte', date: new Date().toISOString() },
        { userId, amount: 20000, category: 'entretenimiento', date: new Date().toISOString() },
        { userId, amount: 10000, category: 'café/bebidas', date: new Date().toISOString() }
      ];

      vi.mocked(Transaction.find)
        .mockResolvedValueOnce(mockTransactions as any)
        .mockResolvedValueOnce([] as any);

      vi.mocked(notificationService.createNotification).mockResolvedValue({} as any);
      vi.mocked(WeeklyDigestLog.create).mockResolvedValue({} as any);

      await executeWeeklyDigestJob();

      // Verify message contains top 3 categories (comida, transporte, entretenimiento)
      const call = vi.mocked(notificationService.createNotification).mock.calls[0][0];
      expect(call.message).toContain('comida');
      expect(call.message).toContain('transporte');
      expect(call.message).toContain('entretenimiento');
      expect(call.message).not.toContain('café/bebidas'); // 4th category should not be included
    });

    it('should calculate trend as "al alza" when spending increases >10%', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockUser = { _id: userId, email: 'test@example.com' };

      vi.mocked(User.find).mockResolvedValue([mockUser] as any);
      vi.mocked(WeeklyDigestLog.findOne).mockResolvedValue(null);

      // Current week: 110,000 COP
      const mockCurrentTransactions = [
        { userId, amount: 110000, category: 'comida', date: new Date().toISOString() }
      ];

      // Previous week: 90,000 COP (increase of 22%)
      const mockPreviousTransactions = [
        { userId, amount: 90000, category: 'comida', date: new Date().toISOString() }
      ];

      vi.mocked(Transaction.find)
        .mockResolvedValueOnce(mockCurrentTransactions as any)
        .mockResolvedValueOnce(mockPreviousTransactions as any);

      vi.mocked(notificationService.createNotification).mockResolvedValue({} as any);
      vi.mocked(WeeklyDigestLog.create).mockResolvedValue({} as any);

      await executeWeeklyDigestJob();

      // Verify trend is "al alza"
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('al alza')
        })
      );
    });

    it('should calculate trend as "a la baja" when spending decreases >10%', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockUser = { _id: userId, email: 'test@example.com' };

      vi.mocked(User.find).mockResolvedValue([mockUser] as any);
      vi.mocked(WeeklyDigestLog.findOne).mockResolvedValue(null);

      // Current week: 80,000 COP
      const mockCurrentTransactions = [
        { userId, amount: 80000, category: 'comida', date: new Date().toISOString() }
      ];

      // Previous week: 100,000 COP (decrease of 20%)
      const mockPreviousTransactions = [
        { userId, amount: 100000, category: 'comida', date: new Date().toISOString() }
      ];

      vi.mocked(Transaction.find)
        .mockResolvedValueOnce(mockCurrentTransactions as any)
        .mockResolvedValueOnce(mockPreviousTransactions as any);

      vi.mocked(notificationService.createNotification).mockResolvedValue({} as any);
      vi.mocked(WeeklyDigestLog.create).mockResolvedValue({} as any);

      await executeWeeklyDigestJob();

      // Verify trend is "a la baja"
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('a la baja')
        })
      );
    });

    it('should calculate trend as "estable" when spending changes <10%', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockUser = { _id: userId, email: 'test@example.com' };

      vi.mocked(User.find).mockResolvedValue([mockUser] as any);
      vi.mocked(WeeklyDigestLog.findOne).mockResolvedValue(null);

      // Current week: 105,000 COP
      const mockCurrentTransactions = [
        { userId, amount: 105000, category: 'comida', date: new Date().toISOString() }
      ];

      // Previous week: 100,000 COP (increase of 5%)
      const mockPreviousTransactions = [
        { userId, amount: 100000, category: 'comida', date: new Date().toISOString() }
      ];

      vi.mocked(Transaction.find)
        .mockResolvedValueOnce(mockCurrentTransactions as any)
        .mockResolvedValueOnce(mockPreviousTransactions as any);

      vi.mocked(notificationService.createNotification).mockResolvedValue({} as any);
      vi.mocked(WeeklyDigestLog.create).mockResolvedValue({} as any);

      await executeWeeklyDigestJob();

      // Verify trend is "estable"
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('estable')
        })
      );
    });

    it('should handle null return from createNotification (preference disabled)', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockUser = { _id: userId, email: 'test@example.com' };

      vi.mocked(User.find).mockResolvedValue([mockUser] as any);
      vi.mocked(WeeklyDigestLog.findOne).mockResolvedValue(null);

      const mockTransactions = [
        { userId, amount: 50000, category: 'comida', date: new Date().toISOString() }
      ];

      vi.mocked(Transaction.find)
        .mockResolvedValueOnce(mockTransactions as any)
        .mockResolvedValueOnce([] as any);

      // Mock notification returning null (preference disabled)
      vi.mocked(notificationService.createNotification).mockResolvedValue(null);

      await executeWeeklyDigestJob();

      // Verify log was NOT created when notification is null
      expect(WeeklyDigestLog.create).not.toHaveBeenCalled();
    });

    it('should handle duplicate key error gracefully', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockUser = { _id: userId, email: 'test@example.com' };

      vi.mocked(User.find).mockResolvedValue([mockUser] as any);
      vi.mocked(WeeklyDigestLog.findOne).mockResolvedValue(null);

      const mockTransactions = [
        { userId, amount: 50000, category: 'comida', date: new Date().toISOString() }
      ];

      vi.mocked(Transaction.find)
        .mockResolvedValueOnce(mockTransactions as any)
        .mockResolvedValueOnce([] as any);

      vi.mocked(notificationService.createNotification).mockResolvedValue({} as any);

      // Mock duplicate key error on log creation
      const duplicateError: any = new Error('Duplicate key');
      duplicateError.code = 11000;
      vi.mocked(WeeklyDigestLog.create).mockRejectedValue(duplicateError);

      // Should not throw
      await expect(executeWeeklyDigestJob()).resolves.not.toThrow();
    });

    it('should catch and log errors without throwing', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock User.find to throw error
      vi.mocked(User.find).mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(executeWeeklyDigestJob()).resolves.not.toThrow();

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Weekly Digest Job] Error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should format message in Spanish with COP currency', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockUser = { _id: userId, email: 'test@example.com' };

      vi.mocked(User.find).mockResolvedValue([mockUser] as any);
      vi.mocked(WeeklyDigestLog.findOne).mockResolvedValue(null);

      const mockTransactions = [
        { userId, amount: 50000, category: 'comida', date: new Date().toISOString() }
      ];

      vi.mocked(Transaction.find)
        .mockResolvedValueOnce(mockTransactions as any)
        .mockResolvedValueOnce([] as any);

      vi.mocked(notificationService.createNotification).mockResolvedValue({} as any);
      vi.mocked(WeeklyDigestLog.create).mockResolvedValue({} as any);

      await executeWeeklyDigestJob();

      // Verify message contains Spanish text and COP
      expect(notificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Resumen Semanal de Gastos',
          message: expect.stringContaining('COP')
        })
      );
    });
  });
});
