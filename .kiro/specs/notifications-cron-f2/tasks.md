# Implementation Plan: Notifications Backend - Phase 2 (Cron Jobs Automation)

## Overview

This implementation plan converts the design for automated notification generation through scheduled cron jobs into actionable coding tasks. The system will execute three scheduled jobs: Subscription Alerts (daily 9 AM), Budget Alerts (every 6 hours), and Weekly Digest (Monday 8 AM). Each job detects financial events and creates notifications automatically, respecting user preferences and ensuring idempotency through state tracking.

The implementation follows a strict 4-phase approach: Data Models (foundation), Job Implementation (core logic), Integration (system connection), and Testing (quality assurance).

## Tasks

- [x] 1. Phase 1: Data Models (Foundation)
  - Create and extend database models to support cron job state tracking and idempotency
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 1.1 Extend SavingsPlan model with budget threshold tracking fields
    - Add optional field `notified80` (boolean, default: false) to track 80% threshold notifications
    - Add optional field `notified100` (boolean, default: false) to track 100% threshold notifications
    - Add optional field `lastAlertDate` (Date, optional) to track last alert timestamp
    - Ensure backward compatibility with existing documents (fields are optional)
    - File: `apps/api/src/models/SavingsPlan.ts`
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 1.2 Create WeeklyDigestLog model for digest idempotency
    - Create interface `IWeeklyDigestLog` with userId (ObjectId), weekStartDate (Date), sentAt (Date)
    - Create Mongoose schema with timestamps enabled
    - Add unique compound index on (userId, weekStartDate) to prevent duplicate digests
    - Add individual indexes on userId and weekStartDate for query optimization
    - Export model as `WeeklyDigestLog`
    - File: `apps/api/src/models/WeeklyDigestLog.ts`
    - _Requirements: 3.1, 3.2_

  - [x] 1.3 Create SubscriptionAlertLog model for subscription alert idempotency
    - Create interface `ISubscriptionAlertLog` with userId (ObjectId), merchant (string), expectedChargeDate (Date), sentAt (Date)
    - Create Mongoose schema with timestamps enabled
    - Add unique compound index on (userId, merchant, expectedChargeDate) to prevent duplicate alerts
    - Add individual indexes on userId and expectedChargeDate for query optimization
    - Export model as `SubscriptionAlertLog`
    - File: `apps/api/src/models/SubscriptionAlertLog.ts`
    - _Requirements: 1.2, 1.3_


- [x] 2. Phase 2: Job Implementation (Core Logic)
  - Implement the three cron jobs with execution logic and scheduling
  - _Requirements: 1.1-1.10, 2.1-2.11, 3.1-3.12_

  - [x] 2.1 Implement Subscription Alerts Job execution function
    - Create `executeSubscriptionAlertsJob()` async function that wraps all logic in try-catch
    - Calculate 24-48 hour window from current time (in24Hours, in48Hours)
    - Query transactions with category 'suscripciones' using aggregation pipeline
    - Group by userId and merchant, calculate avgAmount and transaction count
    - Filter groups with count >= 2 (recurring pattern detection)
    - For each subscription group, sort transactions by date and calculate average interval
    - Predict next charge date based on last charge + average interval
    - Check if next charge falls within 24-48 hour window
    - Normalize expected charge date to midnight for idempotency
    - Check SubscriptionAlertLog for existing alert (userId + merchant + normalizedDate)
    - If no existing log, call createNotification with type 'subscription', Spanish message with merchant and amount
    - If notification created, create SubscriptionAlertLog entry
    - Handle null return from createNotification (preference disabled) by incrementing skipped counter
    - Log execution start, completion with duration, created count, and skipped count
    - Catch all errors, log with console.error, do not re-throw
    - File: `apps/api/src/jobs/subscriptionAlertsJob.ts`
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 2.2 Create Subscription Alerts Job cron schedule
    - Import node-cron and executeSubscriptionAlertsJob function
    - Create cron.schedule with expression '0 9 * * *' (daily 9:00 AM)
    - Set timezone option to 'America/Bogota'
    - Set scheduled option to false (wait for manual start)
    - Export as `subscriptionAlertsJob`
    - File: `apps/api/src/jobs/subscriptionAlertsJob.ts`
    - _Requirements: 1.1, 1.9, 1.10, 6.1, 6.2_

  - [x] 2.3 Implement Budget Alerts Job execution function
    - Create `executeBudgetAlertsJob()` async function that wraps all logic in try-catch
    - Query all active SavingsPlan documents (status: 'active')
    - For each plan, calculate date range from startDate to endDate
    - Use aggregation pipeline to sum transaction amounts matching userId, category (lowercase), and date range
    - Calculate spending percentage: (currentAmount / targetAmount) * 100
    - Check 80% threshold: if percentage >= 80 AND percentage < 100 AND !plan.notified80
    - If 80% threshold met, call createNotification with type 'plan_alert', Spanish message with amounts and category
    - If notification created, update plan.notified80 = true, plan.lastAlertDate = new Date(), save plan
    - Check 100% threshold: if percentage >= 100 AND !plan.notified100
    - If 100% threshold met, call createNotification with type 'plan_alert', Spanish message indicating budget exceeded
    - If notification created, update plan.notified100 = true, plan.lastAlertDate = new Date(), save plan
    - Handle null return from createNotification by incrementing skipped counter
    - Log execution start, completion with duration, created count, and skipped count
    - Catch all errors, log with console.error, do not re-throw
    - File: `apps/api/src/jobs/budgetAlertsJob.ts`
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 8.1, 8.2, 8.3, 8.4_

  - [x] 2.4 Create Budget Alerts Job cron schedule
    - Import node-cron and executeBudgetAlertsJob function
    - Create cron.schedule with expression '0 */6 * * *' (every 6 hours)
    - Set scheduled option to false (wait for manual start)
    - Export as `budgetAlertsJob`
    - File: `apps/api/src/jobs/budgetAlertsJob.ts`
    - _Requirements: 2.1, 2.10, 2.11, 6.4_

  - [x] 2.5 Implement Weekly Digest Job execution function
    - Create `executeWeeklyDigestJob()` async function that wraps all logic in try-catch
    - Create helper function `getMondayOfWeek(date)` that normalizes date to Monday midnight
    - Calculate current date and 7 days ago date
    - Get Monday of current week for idempotency (weekStartDate)
    - Query all users from User collection (no filtering)
    - For each user, check WeeklyDigestLog for existing entry (userId + weekStartDate)
    - If existing log found, skip user and increment skipped counter
    - Query user's transactions from previous 7 days (date >= sevenDaysAgo AND date <= now)
    - If no transactions found, skip user and increment skipped counter
    - Calculate total spending by summing transaction amounts
    - Calculate top 3 categories by grouping transactions by category, summing amounts, sorting descending, taking top 3
    - Query previous week transactions (14 days ago to 7 days ago) for trend calculation
    - Calculate previous week spending total
    - Determine trend: 'al alza' if current > previous * 1.1, 'a la baja' if current < previous * 0.9, else 'estable'
    - Generate Spanish message with total spending (formatted with toLocaleString), top categories with amounts, and trend
    - Call createNotification with type 'weekly_digest', title 'Resumen Semanal de Gastos', actionUrl '/analysis'
    - If notification created, create WeeklyDigestLog entry with userId, weekStartDate, sentAt
    - Handle null return from createNotification by incrementing skipped counter
    - Log execution start, completion with duration, created count, and skipped count
    - Catch all errors, log with console.error, do not re-throw
    - File: `apps/api/src/jobs/weeklyDigestJob.ts`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [x] 2.6 Create Weekly Digest Job cron schedule
    - Import node-cron and executeWeeklyDigestJob function
    - Create cron.schedule with expression '0 8 * * 1' (Monday 8:00 AM)
    - Set timezone option to 'America/Bogota'
    - Set scheduled option to false (wait for manual start)
    - Export as `weeklyDigestJob`
    - File: `apps/api/src/jobs/weeklyDigestJob.ts`
    - _Requirements: 3.1, 3.11, 3.12, 6.1, 6.3_


- [x] 3. Phase 3: Integration (System Connection)
  - Wire cron jobs into the application server with registry and lifecycle management
  - _Requirements: 4.1-4.7, 11.1-11.4, 14.1-14.3_

  - [x] 3.1 Create job registry with initialization function
    - Create empty array `jobs: cron.ScheduledTask[]` to store job instances
    - Import subscriptionAlertsJob, budgetAlertsJob, weeklyDigestJob
    - Create `initializeJobs()` function that wraps logic in try-catch
    - Log '🕐 Initializing cron jobs...' at start
    - Call subscriptionAlertsJob.start(), push to jobs array, log success with schedule details
    - Call budgetAlertsJob.start(), push to jobs array, log success with schedule details
    - Call weeklyDigestJob.start(), push to jobs array, log success with schedule details
    - Log '🎉 All cron jobs initialized successfully' at end
    - Catch errors, log with console.error, do not re-throw (don't crash server)
    - Export initializeJobs function
    - File: `apps/api/src/jobs/index.ts`
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7_

  - [x] 3.2 Create job registry shutdown function
    - Create `stopAllJobs()` function in job registry
    - Log '🛑 Stopping all cron jobs...' at start
    - Iterate through jobs array with forEach
    - For each job, wrap stop() call in try-catch
    - Log success for each stopped job
    - Catch individual errors, log with console.error, continue to next job
    - Log '🎉 All cron jobs stopped' at end
    - Export stopAllJobs function
    - File: `apps/api/src/jobs/index.ts`
    - _Requirements: 14.1, 14.2, 14.3_

  - [x] 3.3 Update server.ts to initialize jobs after MongoDB connection
    - Import initializeJobs and stopAllJobs from './jobs'
    - In startServer function, after successful connectDB() call, add initializeJobs() call
    - Add process.on('SIGTERM') handler that logs shutdown message, calls stopAllJobs(), exits with code 0
    - Add process.on('SIGINT') handler that logs shutdown message, calls stopAllJobs(), exits with code 0
    - File: `apps/api/src/server.ts`
    - _Requirements: 4.3, 14.2_

  - [x] 3.4 Update package.json with node-cron dependencies
    - Add "node-cron": "^3.0.3" to dependencies object
    - Add "@types/node-cron": "^3.0.11" to devDependencies object
    - File: `apps/api/package.json`
    - _Requirements: 11.1, 11.2, 11.3, 11.4_


- [x] 4. Phase 4: Testing (Quality Assurance)
  - Comprehensive testing including unit tests, integration tests, and property-based tests
  - _Requirements: 13.1-13.4, All properties from design_

  - [x] 4.1 Write unit tests for Subscription Alerts Job
    - Test subscription detection with recurring transactions (2+ charges, monthly pattern)
    - Test 24-48 hour window filtering (next charge in range vs out of range)
    - Test idempotency: existing SubscriptionAlertLog prevents duplicate notification
    - Test createNotification called with correct parameters (type, actionUrl, Spanish message)
    - Test null return handling from createNotification (preference disabled)
    - Test error handling: catch errors, log, don't throw
    - Test logging: verify start, completion, duration, counts logged
    - Mock createNotification, Transaction, SubscriptionAlertLog models
    - File: `apps/api/src/jobs/subscriptionAlertsJob.test.ts`
    - _Requirements: 13.1, 13.2_

  - [x] 4.2 Write unit tests for Budget Alerts Job
    - Test 80% threshold detection with plan at 80-99% spending
    - Test 100% threshold detection with plan at 100%+ spending
    - Test idempotency: notified80=true prevents duplicate 80% alert
    - Test idempotency: notified100=true prevents duplicate 100% alert
    - Test state persistence: verify notified flags and lastAlertDate updated after notification
    - Test createNotification called with correct parameters (type, Spanish messages)
    - Test null return handling from createNotification
    - Test error handling: catch errors, log, don't throw
    - Test backward compatibility: undefined notified fields treated as false
    - Mock createNotification, SavingsPlan, Transaction models
    - File: `apps/api/src/jobs/budgetAlertsJob.test.ts`
    - _Requirements: 13.1, 13.2_

  - [x] 4.3 Write unit tests for Weekly Digest Job
    - Test getMondayOfWeek helper function normalizes dates correctly
    - Test user filtering: skip users with zero transactions
    - Test idempotency: existing WeeklyDigestLog prevents duplicate digest
    - Test calculations: total spending, top 3 categories, trend (up/down/stable)
    - Test message format: Spanish, COP formatting, includes all required data
    - Test createNotification called with correct parameters (type, title, actionUrl)
    - Test null return handling from createNotification
    - Test error handling: catch errors, log, don't throw
    - Mock createNotification, User, Transaction, WeeklyDigestLog models
    - File: `apps/api/src/jobs/weeklyDigestJob.test.ts`
    - _Requirements: 13.1, 13.2_

  - [x] 4.4 Write unit tests for job registry
    - Test initializeJobs calls start() on all three jobs
    - Test initializeJobs logs success messages for each job
    - Test initializeJobs error isolation: one job failure doesn't prevent others from starting
    - Test stopAllJobs calls stop() on all registered jobs
    - Test stopAllJobs error isolation: one job stop failure doesn't prevent others from stopping
    - Test stopAllJobs logs success messages
    - Mock cron job instances with start() and stop() methods
    - File: `apps/api/src/jobs/index.test.ts`
    - _Requirements: 13.1, 13.2_

  - [x]*  4.5 Write property test for Subscription Detection Pipeline (Property 1)
    - **Property 1: Subscription Detection Pipeline**
    - **Validates: Requirements 1.2, 1.3, 7.1, 7.2, 7.3, 7.4**
    - Generate random sets of transactions with category 'suscripciones'
    - Vary merchant names, amounts, and intervals (weekly, monthly, yearly)
    - Verify job correctly groups by merchant, calculates average interval, predicts next charge
    - Verify only subscriptions with next charge in 24-48h window are identified
    - Use fast-check with fc.array, fc.record, fc.integer generators
    - Run 100 iterations minimum
    - File: `apps/api/src/jobs/subscriptionAlertsJob.property.test.ts`

  - [x]* 4.6 Write property test for Subscription Alert Idempotency (Property 3)
    - **Property 3: Subscription Alert Idempotency**
    - **Validates: Requirements 1.2, 1.3**
    - Generate random subscription data (userId, merchant, expectedChargeDate)
    - Create SubscriptionAlertLog entry before job execution
    - Execute job multiple times (2-5 iterations)
    - Verify notification created exactly zero times (idempotency)
    - Use fast-check with fc.record, fc.integer for execution count
    - Run 100 iterations minimum
    - File: `apps/api/src/jobs/subscriptionAlertsJob.property.test.ts`

  - [x]* 4.7 Write property test for Budget Threshold Detection (Property 4)
    - **Property 4: Budget Threshold Detection**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 8.2, 8.3**
    - Generate random savings plans with varying targetAmount (100k-1M COP)
    - Generate random spending percentages (0-150%)
    - Create transactions to match spending percentage
    - Verify 80% alert created when percentage in [80, 100) and notified80=false
    - Verify 100% alert created when percentage >= 100 and notified100=false
    - Verify no alert when notified flags are true
    - Use fast-check with fc.integer, fc.constantFrom for categories
    - Run 100 iterations minimum
    - File: `apps/api/src/jobs/budgetAlertsJob.property.test.ts`

  - [x]* 4.8 Write property test for Budget Alert Idempotency (Property 5)
    - **Property 5: Budget Alert Idempotency**
    - **Validates: Requirements 2.7, 8.1, 8.4**
    - Generate random savings plans at 80%+ spending with notified80=true
    - Execute job multiple times (2-5 iterations)
    - Verify no additional 80% alerts created
    - Repeat for 100%+ spending with notified100=true
    - Use fast-check with fc.integer for execution count
    - Run 100 iterations minimum
    - File: `apps/api/src/jobs/budgetAlertsJob.property.test.ts`

  - [x]* 4.9 Write property test for Weekly Digest Calculations (Property 9)
    - **Property 9: Weekly Digest Calculations**
    - **Validates: Requirements 3.4, 9.1, 9.2, 9.3**
    - Generate random users with varying transaction counts (1-100)
    - Generate random transactions with amounts and categories
    - Execute job and verify total spending equals sum of amounts
    - Verify top 3 categories sorted by total amount descending
    - Verify trend calculation: up (>10% increase), down (>10% decrease), stable (else)
    - Use fast-check with fc.array, fc.record, fc.integer, fc.constantFrom
    - Run 100 iterations minimum
    - File: `apps/api/src/jobs/weeklyDigestJob.property.test.ts`

  - [x]* 4.10 Write property test for Weekly Digest Idempotency (Property 12)
    - **Property 12: Weekly Digest Idempotency**
    - **Validates: Requirements 3.1, 3.2**
    - Generate random users with transactions
    - Create WeeklyDigestLog entry for current week before job execution
    - Execute job multiple times (2-5 iterations)
    - Verify notification created exactly zero times (idempotency)
    - Use fast-check with fc.record, fc.integer for execution count
    - Run 100 iterations minimum
    - File: `apps/api/src/jobs/weeklyDigestJob.property.test.ts`

  - [x]* 4.11 Write property test for User Preference Respect (Property 13)
    - **Property 13: User Preference Respect**
    - **Validates: Requirements 1.5, 2.6, 3.7, 12.5**
    - Generate random notification scenarios (subscription, budget, digest)
    - For each scenario, set corresponding user preference to false
    - Mock createNotification to return null (preference disabled)
    - Execute appropriate job
    - Verify job continues without error, increments skipped counter
    - Use fast-check with fc.constantFrom for notification types
    - Run 100 iterations minimum
    - File: `apps/api/src/jobs/jobs.property.test.ts`

  - [x]* 4.12 Write property test for Error Handling Without Crash (Property 15)
    - **Property 15: Error Handling Without Crash**
    - **Validates: Requirements 1.8, 2.9, 3.10, 5.2, 5.5, 5.6**
    - Generate random error scenarios (database errors, validation errors)
    - Mock database operations to throw errors
    - Execute each job (subscription, budget, digest)
    - Verify job catches error, logs with console.error, does not re-throw
    - Verify job can execute again after error (next schedule)
    - Use fast-check with fc.constantFrom for error types
    - Run 100 iterations minimum
    - File: `apps/api/src/jobs/jobs.property.test.ts`

  - [x]* 4.13 Write integration test for server startup with jobs
    - Start test MongoDB instance
    - Import and call startServer function
    - Verify MongoDB connection succeeds
    - Verify initializeJobs called (check logs or spy)
    - Verify all three jobs initialized (check logs)
    - Send SIGTERM signal
    - Verify stopAllJobs called
    - Verify all jobs stopped gracefully
    - Clean up test server and database
    - File: `apps/api/src/server.integration.test.ts`
    - _Requirements: 4.3, 14.2, 14.3_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All jobs use TypeScript with strict type checking
- All jobs respect user preferences automatically via notificationService integration
- Idempotency is critical: use state tracking (SavingsPlan fields) and log collections (WeeklyDigestLog, SubscriptionAlertLog)
- Error handling is mandatory: wrap all job logic in try-catch, log errors, never crash server
- Timezone handling: use 'America/Bogota' for subscription and digest jobs
- All dates must be normalized to midnight for idempotency checks
- Jobs are independently testable: execution functions exported separately from cron schedules
