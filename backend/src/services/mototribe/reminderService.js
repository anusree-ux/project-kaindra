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
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }
          );

          const isOneHour = reminderType === "1h";
          const subject = isOneHour
            ? `⚡ [1-Hour Alert] Final Prep: ${ride.title} departs soon!`
            : `🏍️ [24-Hour Reminder] Get Ready: ${ride.title} starts tomorrow!`;

          const htmlBody = `
            <div style="max-width: 600px; margin: 0 auto; background: #0c0d10; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; border: 1px solid rgba(212, 160, 62, 0.3); border-radius: 12px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #18191f 0%, #0c0d10 100%); padding: 28px 24px; border-bottom: 1px solid rgba(212, 160, 62, 0.2); text-align: center;">
                <span style="display: inline-block; font-size: 11px; letter-spacing: 3px; font-weight: 800; color: #d4a03e; text-transform: uppercase; margin-bottom: 8px;">M O T O T R I B E &bull; R I D E &bull; A L E R T</span>
                <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">${isOneHour ? "⚡ Final 1-Hour Departure Alert" : "📅 24-Hour Ride Reminder"}</h1>
              </div>

              <div style="padding: 28px 24px;">
                <p style="font-size: 15px; color: #d1d5db; margin-top: 0;">Hi <strong>${user.name || "Rider"}</strong>,</p>
                <p style="font-size: 14px; color: #9ca3af; line-height: 1.6;">
                  ${isOneHour
                    ? `Your scheduled ride <strong>${ride.title}</strong> is rolling out in approximately <strong>1 hour</strong>. Please finalize your gear, check tire pressure, and prepare to rendezvous at the start point.`
                    : `Your upcoming journey <strong>${ride.title}</strong> is scheduled for departure in <strong>24 hours</strong>. Review the journey details below.`
                  }
                </p>

                <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 20px; margin: 24px 0;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tr>
                      <td style="padding: 6px 0; color: #9ca3af; width: 35%;">📍 <strong>Origin:</strong></td>
                      <td style="padding: 6px 0; color: #ffffff; font-weight: 600;">${ride.origin}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #9ca3af;">🏁 <strong>Destination:</strong></td>
                      <td style="padding: 6px 0; color: #ffffff; font-weight: 600;">${ride.destination}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #9ca3af;">⏰ <strong>Departure Time:</strong></td>
                      <td style="padding: 6px 0; color: #d4a03e; font-weight: 700;">${formattedDate}</td>
                    </tr>
                    ${ride.distanceKm ? `
                    <tr>
                      <td style="padding: 6px 0; color: #9ca3af;">🛣️ <strong>Estimated Distance:</strong></td>
                      <td style="padding: 6px 0; color: #ffffff; font-weight: 600;">${ride.distanceKm} KM</td>
                    </tr>` : ""}
                  </table>
                </div>

                <div style="background: rgba(212, 160, 62, 0.08); border-left: 3px solid #d4a03e; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
                  <strong style="color: #d4a03e; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Safety Checklist:</strong>
                  <p style="margin: 4px 0 0; font-size: 12px; color: #d1d5db;">Full-face ECE/DOT helmet, riding jacket & gloves, full fuel tank, and active mobile GPS charged.</p>
                </div>

                <p style="font-size: 13px; color: #6b7280; text-align: center; margin: 30px 0 0;">
                  Ride safe &bull; MotoTribe AI Route Builder &bull; Kaindra
                </p>
              </div>
            </div>
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
