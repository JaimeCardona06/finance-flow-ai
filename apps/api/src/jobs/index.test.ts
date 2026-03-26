import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initializeJobs, stopAllJobs } from './index';
import * as subscriptionAlertsJob from './subscriptionAlertsJob';
import * as budgetAlertsJob from './budgetAlertsJob';
import * as weeklyDigestJob from './weeklyDigestJob';

// Mock the job modules
vi.mock('./subscriptionAlertsJob');
vi.mock('./budgetAlertsJob');
vi.mock('./weeklyDigestJob');

describe('Job Registry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initializeJobs', () => {
    it('should start all three jobs', () => {
      const mockSubscriptionJob = {
        start: vi.fn()
      };
      const mockBudgetJob = {
        start: vi.fn()
      };
      const mockWeeklyJob = {
        start: vi.fn()
      };

      vi.mocked(subscriptionAlertsJob).subscriptionAlertsJob = mockSubscriptionJob as any;
      vi.mocked(budgetAlertsJob).budgetAlertsJob = mockBudgetJob as any;
      vi.mocked(weeklyDigestJob).weeklyDigestJob = mockWeeklyJob as any;

      initializeJobs();

      expect(mockSubscriptionJob.start).toHaveBeenCalled();
      expect(mockBudgetJob.start).toHaveBeenCalled();
      expect(mockWeeklyJob.start).toHaveBeenCalled();
    });

    it('should log success messages for each job', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const mockJob = { start: vi.fn() };
      vi.mocked(subscriptionAlertsJob).subscriptionAlertsJob = mockJob as any;
      vi.mocked(budgetAlertsJob).budgetAlertsJob = mockJob as any;
      vi.mocked(weeklyDigestJob).weeklyDigestJob = mockJob as any;

      initializeJobs();

      expect(consoleLogSpy).toHaveBeenCalledWith('🕐 Initializing cron jobs...');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '✅ Subscription Alerts Job initialized (daily 9:00 AM Colombia)'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '✅ Budget Alerts Job initialized (every 6 hours)'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '✅ Weekly Digest Job initialized (Monday 8:00 AM Colombia)'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '🎉 All cron jobs initialized successfully'
      );

      consoleLogSpy.mockRestore();
    });

    it('should isolate errors - one job failure does not prevent others from starting', () => {
      const mockSubscriptionJob = {
        start: vi.fn().mockImplementation(() => {
          throw new Error('Subscription job failed');
        })
      };
      const mockBudgetJob = {
        start: vi.fn()
      };
      const mockWeeklyJob = {
        start: vi.fn()
      };

      vi.mocked(subscriptionAlertsJob).subscriptionAlertsJob = mockSubscriptionJob as any;
      vi.mocked(budgetAlertsJob).budgetAlertsJob = mockBudgetJob as any;
      vi.mocked(weeklyDigestJob).weeklyDigestJob = mockWeeklyJob as any;

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw
      expect(() => initializeJobs()).not.toThrow();

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Error initializing cron jobs:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should not crash when all jobs fail to start', () => {
      const mockFailingJob = {
        start: vi.fn().mockImplementation(() => {
          throw new Error('Job failed');
        })
      };

      vi.mocked(subscriptionAlertsJob).subscriptionAlertsJob = mockFailingJob as any;
      vi.mocked(budgetAlertsJob).budgetAlertsJob = mockFailingJob as any;
      vi.mocked(weeklyDigestJob).weeklyDigestJob = mockFailingJob as any;

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw
      expect(() => initializeJobs()).not.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('stopAllJobs', () => {
    it('should stop all registered jobs', () => {
      const mockSubscriptionJob = {
        start: vi.fn(),
        stop: vi.fn()
      };
      const mockBudgetJob = {
        start: vi.fn(),
        stop: vi.fn()
      };
      const mockWeeklyJob = {
        start: vi.fn(),
        stop: vi.fn()
      };

      vi.mocked(subscriptionAlertsJob).subscriptionAlertsJob = mockSubscriptionJob as any;
      vi.mocked(budgetAlertsJob).budgetAlertsJob = mockBudgetJob as any;
      vi.mocked(weeklyDigestJob).weeklyDigestJob = mockWeeklyJob as any;

      // Initialize jobs first
      initializeJobs();

      // Stop all jobs
      stopAllJobs();

      expect(mockSubscriptionJob.stop).toHaveBeenCalled();
      expect(mockBudgetJob.stop).toHaveBeenCalled();
      expect(mockWeeklyJob.stop).toHaveBeenCalled();
    });

    it('should log success messages when stopping jobs', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const mockJob = {
        start: vi.fn(),
        stop: vi.fn()
      };

      vi.mocked(subscriptionAlertsJob).subscriptionAlertsJob = mockJob as any;
      vi.mocked(budgetAlertsJob).budgetAlertsJob = mockJob as any;
      vi.mocked(weeklyDigestJob).weeklyDigestJob = mockJob as any;

      initializeJobs();
      stopAllJobs();

      expect(consoleLogSpy).toHaveBeenCalledWith('🛑 Stopping all cron jobs...');
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Job 1 stopped');
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Job 2 stopped');
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Job 3 stopped');
      expect(consoleLogSpy).toHaveBeenCalledWith('🎉 All cron jobs stopped');

      consoleLogSpy.mockRestore();
    });

    it('should isolate errors - one job stop failure does not prevent others from stopping', () => {
      const mockSubscriptionJob = {
        start: vi.fn(),
        stop: vi.fn().mockImplementation(() => {
          throw new Error('Stop failed');
        })
      };
      const mockBudgetJob = {
        start: vi.fn(),
        stop: vi.fn()
      };
      const mockWeeklyJob = {
        start: vi.fn(),
        stop: vi.fn()
      };

      vi.mocked(subscriptionAlertsJob).subscriptionAlertsJob = mockSubscriptionJob as any;
      vi.mocked(budgetAlertsJob).budgetAlertsJob = mockBudgetJob as any;
      vi.mocked(weeklyDigestJob).weeklyDigestJob = mockWeeklyJob as any;

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      initializeJobs();
      stopAllJobs();

      // Verify error was logged for first job
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Error stopping job 1:',
        expect.any(Error)
      );

      // Verify other jobs were still stopped
      expect(mockBudgetJob.stop).toHaveBeenCalled();
      expect(mockWeeklyJob.stop).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle stopping when no jobs are registered', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Call stopAllJobs without initializing
      stopAllJobs();

      // Should log start and end messages
      expect(consoleLogSpy).toHaveBeenCalledWith('🛑 Stopping all cron jobs...');
      expect(consoleLogSpy).toHaveBeenCalledWith('🎉 All cron jobs stopped');

      consoleLogSpy.mockRestore();
    });

    it('should not throw when all jobs fail to stop', () => {
      const mockFailingJob = {
        start: vi.fn(),
        stop: vi.fn().mockImplementation(() => {
          throw new Error('Stop failed');
        })
      };

      vi.mocked(subscriptionAlertsJob).subscriptionAlertsJob = mockFailingJob as any;
      vi.mocked(budgetAlertsJob).budgetAlertsJob = mockFailingJob as any;
      vi.mocked(weeklyDigestJob).weeklyDigestJob = mockFailingJob as any;

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      initializeJobs();

      // Should not throw
      expect(() => stopAllJobs()).not.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });
});
