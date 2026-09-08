const Ride = require("../../models/mototribe/Ride");
const RideParticipant = require("../../models/mototribe/RideParticipant");
const RideReminder = require("../../models/mototribe/RideReminder");
const User = require("../../models/core/User");
const { sendEmail } = require("./emailService");

/**
 * Checks for upcoming rides within 24h and 1h windows,
 * sends email reminders to confirmed participants, and records RideReminder documents.
 * Safely handles errors without crashing the caller or server.
 * @returns {Promise<Object>} { sentCount, skippedCount, failedCount }
 */
const checkAndSendReminders = async () => {
  let sentCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1h = new Date(now.getTime() + 1 * 60 * 60 * 1000);

    // 1. Rides starting within 24h
    const rides24h = await Ride.find({
      status: { $in: ["planning", "ongoing"] },
      startDate: { $gte: now, $lte: in24h },
    });

    // 2. Rides starting within 1h
    const rides1h = await Ride.find({
      status: { $in: ["planning", "ongoing"] },
      startDate: { $gte: now, $lte: in1h },
    });

    const processRideReminders = async (rides, reminderType) => {
      for (const ride of rides) {
        const participants = await RideParticipant.find({
          rideId: ride._id,
          status: "confirmed",
        });

        for (const participant of participants) {
          const uId = participant.userId;

          // Check if already sent
          const existing = await RideReminder.findOne({
            rideId: ride._id,
            userId: uId,
            reminderType,
          });

          if (existing) {
            skippedCount++;
            continue;
          }

          const user = await User.findById(uId);
          if (!user || !user.email) {
            console.warn(
              `[Ride Reminders] Missing user email for userId ${uId} on ride ${ride._id}`
            );
            failedCount++;
            continue;
          }

          const formattedDate = new Date(ride.startDate).toLocaleString(
            "en-US",
            {
              dateStyle: "full",
              timeStyle: "short",
            }
          );

          const subject = `[MotoTribe Reminder] Upcoming Ride: ${ride.title} (${reminderType})`;
          const htmlBody = `
            <h2>MotoTribe Ride Reminder (${reminderType})</h2>
            <p>Hi <strong>${user.name || "Rider"}</strong>,</p>
            <p>Your ride <strong>${ride.title}</strong> is starting soon!</p>
            <ul>
              <li><strong>Origin:</strong> ${ride.origin}</li>
              <li><strong>Destination:</strong> ${ride.destination}</li>
              <li><strong>Start Time:</strong> ${formattedDate}</li>
            </ul>
            <p>Gear up and ride safe!</p>
          `;

          const emailRes = await sendEmail(user.email, subject, htmlBody);

          if (emailRes.success) {
            try {
              await RideReminder.create({
                rideId: ride._id,
                userId: uId,
                reminderType,
              });
              sentCount++;
            } catch (err) {
              if (err.code === 11000) {
                skippedCount++;
              } else {
                failedCount++;
              }
            }
          } else {
            console.warn(
              `[Ride Reminders] Failed to send email to ${user.email} for ride ${ride._id}: ${emailRes.error}`
            );
            failedCount++;
          }
        }
      }
    };

    await processRideReminders(rides24h, "24h");
    await processRideReminders(rides1h, "1h");

    console.log(
      `[Ride Reminders] Summary: ${sentCount} sent, ${skippedCount} skipped, ${failedCount} failed.`
    );
  } catch (error) {
    console.error(
      "[Ride Reminders] Error during checkAndSendReminders execution:",
      error.message || error
    );
  }

  return { sentCount, skippedCount, failedCount };
};

module.exports = {
  checkAndSendReminders,
};
