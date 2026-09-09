const cron = require("node-cron");
const {
  checkAndSendReminders,
} = require("../services/mototribe/reminderService");

/**
 * Initializes background cron jobs for MotoTribe module.
 * Runs checkAndSendReminders every 30 minutes.
 */
const initScheduler = () => {
  console.log("[Scheduler] Initializing MotoTribe background cron jobs...");

  // Schedule checkAndSendReminders every 30 minutes (0, 30 of every hour)
  cron.schedule("*/30 * * * *", async () => {
    console.log("[Scheduler] Running checkAndSendReminders cron task...");
    try {
      await checkAndSendReminders();
    } catch (err) {
      console.error("[Scheduler] Error in cron execution:", err.message || err);
    }
  });

  console.log("[Scheduler] Cron job registered for every 30 minutes (*/30 * * * *).");
};

module.exports = {
  initScheduler,
};
