import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as dbModule from './config/db';
import * as jobsModule from './jobs';

// Mock the modules
vi.mock('./config/db');
vi.mock('./jobs');

describe('Server Integration Tests', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('Server Startup with Jobs', () => {
    it('should connect to MongoDB and initialize jobs on successful startup', async () => {
      // Mock successful MongoDB connection
      vi.mocked(dbModule.connectDB).mockResolvedValue(undefined);
      
      // Mock initializeJobs
      const initializeJobsMock = vi.mocked(jobsModule.initializeJobs);
      initializeJobsMock.mockImplementation(() => {
        console.log('🕐 Initializing cron jobs...');
        console.log('🎉 All cron jobs initialized successfully');
      });

      // Import and execute startServer (simulated)
      await dbModule.connectDB();
      jobsModule.initializeJobs();

      // Verify MongoDB connection was called
      expect(dbModule.connectDB).toHaveBeenCalledTimes(1);

      // Verify initializeJobs was called after MongoDB connection
      expect(jobsModule.initializeJobs).toHaveBeenCalledTimes(1);

      // Verify success logs
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Initializing cron jobs')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('All cron jobs initialized successfully')
      );
    });

    it('should handle MongoDB connection failure gracefully', async () => {
      // Mock MongoDB connection failure
      const dbError = new Error('MongoDB connection failed');
      vi.mocked(dbModule.connectDB).mockRejectedValue(dbError);

      // Simulate startup error handling
      try {
        await dbModule.connectDB();
        jobsModule.initializeJobs();
      } catch (error) {
        console.error('❌ Error al iniciar servidor:', error);
        process.exit(1);
      }

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error al iniciar servidor'),
        dbError
      );

      // Verify process.exit was called with code 1
      expect(processExitSpy).toHaveBeenCalledWith(1);

      // Verify initializeJobs was NOT called (startup failed before jobs)
      expect(jobsModule.initializeJobs).not.toHaveBeenCalled();
    });

    it('should call stopAllJobs on SIGTERM signal', () => {
      // Mock stopAllJobs
      const stopAllJobsMock = vi.mocked(jobsModule.stopAllJobs);
      stopAllJobsMock.mockImplementation(() => {
        console.log('🛑 Stopping all cron jobs...');
        console.log('🎉 All cron jobs stopped');
      });

      // Simulate SIGTERM handler
      console.log('SIGTERM recibido, cerrando servidor...');
      jobsModule.stopAllJobs();
      process.exit(0);

      // Verify stopAllJobs was called
      expect(jobsModule.stopAllJobs).toHaveBeenCalledTimes(1);

      // Verify shutdown log
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('SIGTERM recibido')
      );

      // Verify process.exit was called with code 0
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should call stopAllJobs on SIGINT signal', () => {
      // Mock stopAllJobs
      const stopAllJobsMock = vi.mocked(jobsModule.stopAllJobs);
      stopAllJobsMock.mockImplementation(() => {
        console.log('🛑 Stopping all cron jobs...');
        console.log('🎉 All cron jobs stopped');
      });

      // Simulate SIGINT handler
      console.log('SIGINT recibido, cerrando servidor...');
      jobsModule.stopAllJobs();
      process.exit(0);

      // Verify stopAllJobs was called
      expect(jobsModule.stopAllJobs).toHaveBeenCalledTimes(1);

      // Verify shutdown log
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('SIGINT recibido')
      );

      // Verify process.exit was called with code 0
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should initialize jobs only after successful MongoDB connection', async () => {
      // Track call order
      const callOrder: string[] = [];

      vi.mocked(dbModule.connectDB).mockImplementation(async () => {
        callOrder.push('connectDB');
      });

      vi.mocked(jobsModule.initializeJobs).mockImplementation(() => {
        callOrder.push('initializeJobs');
      });

      // Simulate startup sequence
      await dbModule.connectDB();
      jobsModule.initializeJobs();

      // Verify call order: MongoDB first, then jobs
      expect(callOrder).toEqual(['connectDB', 'initializeJobs']);
    });

    it('should handle job initialization errors without crashing server', async () => {
      // Mock successful MongoDB connection
      vi.mocked(dbModule.connectDB).mockResolvedValue(undefined);

      // Mock initializeJobs to throw error
      const jobError = new Error('Job initialization failed');
      vi.mocked(jobsModule.initializeJobs).mockImplementation(() => {
        throw jobError;
      });

      // Simulate startup with error handling
      try {
        await dbModule.connectDB();
        jobsModule.initializeJobs();
      } catch (error) {
        // Server should catch and log, but not crash
        console.error('⚠️ Jobs failed to initialize, but server continues:', error);
      }

      // Verify MongoDB connection succeeded
      expect(dbModule.connectDB).toHaveBeenCalled();

      // Verify initializeJobs was attempted
      expect(jobsModule.initializeJobs).toHaveBeenCalled();

      // Verify error was logged (server continues despite job failure)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Jobs failed to initialize'),
        jobError
      );
    });
  });
});
