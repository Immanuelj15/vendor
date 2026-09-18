import { runSubscriptionExpiryJob } from './subscriptionExpiryJob.js';
import { runFailedSettlementJob } from './failedSettlementJob.js';

let isSubscriptionExpiryRunning = false;
let isFailedSettlementRunning = false;

export const startJobs = () => {
  console.log('Initializing scheduled background jobs...');

  // Run subscription expiry sync every 12 hours
  setInterval(async () => {
    if (isSubscriptionExpiryRunning) {
      console.log('Subscription expiry job is already running. Skipping.');
      return;
    }
    isSubscriptionExpiryRunning = true;
    try {
      await runSubscriptionExpiryJob();
    } finally {
      isSubscriptionExpiryRunning = false;
    }
  }, 12 * 60 * 60 * 1000);

  // Run failed settlement monitor every 12 hours
  setInterval(async () => {
    if (isFailedSettlementRunning) {
      console.log('Failed settlement job is already running. Skipping.');
      return;
    }
    isFailedSettlementRunning = true;
    try {
      await runFailedSettlementJob();
    } finally {
      isFailedSettlementRunning = false;
    }
  }, 12 * 60 * 60 * 1000);
};

// Immediate manual trigger for integration tests
export const triggerJobsManually = async () => {
  console.log('Triggering background jobs manually...');
  await runSubscriptionExpiryJob();
  await runFailedSettlementJob();
};
export { runSubscriptionExpiryJob, runFailedSettlementJob };
