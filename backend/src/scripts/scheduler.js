const cron = require("node-cron");
const {
  checkAndSendReminders,
} = require("../services/mototribe/reminderService");
const {
  updateDropStatuses,
} = require("../services/modasphere/dropService");

/**
 * Initializes background cron jobs for Kaindra (MotoTribe & ModaSphere).
 */
const initScheduler = () => {
  console.log("[Scheduler] Initializing background cron jobs...");

  // MotoTribe: Check and send reminders every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    console.log("[Scheduler] Running checkAndSendReminders cron task...");
    try {
      await checkAndSendReminders();
    } catch (err) {
      console.error("[Scheduler] Error in checkAndSendReminders cron execution:", err.message || err);
    }
  });

  // ModaSphere: Recalculate ModaDrop statuses every 2 minutes
  cron.schedule("*/2 * * * *", async () => {
    try {
      await updateDropStatuses();
    } catch (err) {
      console.error("[Scheduler] Error in updateDropStatuses cron execution:", err.message || err);
    }
  });

  console.log("[Scheduler] Background cron jobs registered.");
};

module.exports = {
  initScheduler,
};
