import cron from 'node-cron';
import { subscriptionAlertsJob } from './subscriptionAlertsJob';
import { budgetAlertsJob } from './budgetAlertsJob';
import { weeklyDigestJob } from './weeklyDigestJob';

// Store job instances for graceful shutdown
const jobs: cron.ScheduledTask[] = [];

/**
 * Initialize all cron jobs
 * Called from server.ts after MongoDB connection
 */
export function initializeJobs(): void {
  try {
    console.log('🕐 Initializing cron jobs...');

    // Clear existing jobs (for testing or re-initialization)
    jobs.length = 0;

    // Start subscription alerts job
    subscriptionAlertsJob.start();
    jobs.push(subscriptionAlertsJob);
    console.log('✅ Subscription Alerts Job initialized (daily 9:00 AM Colombia)');

    // Start budget alerts job
    budgetAlertsJob.start();
    jobs.push(budgetAlertsJob);
    console.log('✅ Budget Alerts Job initialized (every 6 hours)');

    // Start weekly digest job
    weeklyDigestJob.start();
    jobs.push(weeklyDigestJob);
    console.log('✅ Weekly Digest Job initialized (Monday 8:00 AM Colombia)');

    console.log('🎉 All cron jobs initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing cron jobs:', error);
    // Don't crash the server if jobs fail to initialize
  }
}

/**
 * Stop all running cron jobs
 * Called on server shutdown (SIGTERM, SIGINT)
 */
export function stopAllJobs(): void {
  console.log('🛑 Stopping all cron jobs...');
  
  jobs.forEach((job, index) => {
    try {
      job.stop();
      console.log(`✅ Job ${index + 1} stopped`);
    } catch (error) {
      console.error(`❌ Error stopping job ${index + 1}:`, error);
    }
  });
  
  console.log('🎉 All cron jobs stopped');
}
