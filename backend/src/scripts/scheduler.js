const cron = require("node-cron");
const {
  checkAndSendReminders,
} = require("../services/mototribe/reminderService");
const {
  updateDropStatuses,
} = require("../services/modasphere/dropService");
const {
  deleteExpiredNotifications,
} = require("../services/core/notificationService");

/**
 * Initializes background cron jobs for Kaindra (MotoTribe, ModaSphere & Core).
 */
const initScheduler = () => {
  console.log("[Scheduler] Initializing background cron jobs...");

  // Core: Purge notifications older than 24 hours every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    try {
      const result = await deleteExpiredNotifications();
      if (result && result.deletedCount > 0) {
        console.log(`[Scheduler] Purged ${result.deletedCount} expired notification(s) (>24h).`);
      }
    } catch (err) {
      console.error("[Scheduler] Error in deleteExpiredNotifications cron execution:", err.message || err);
    }
  });

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

  // Purge expired notifications immediately on startup
  deleteExpiredNotifications().catch((err) => {
    console.error("[Scheduler] Error in startup deleteExpiredNotifications:", err.message || err);
  });

  console.log("[Scheduler] Background cron jobs registered.");
};

module.exports = {
  initScheduler,
};
