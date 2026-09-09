const Ride = require("../../src/models/mototribe/Ride");
const RideParticipant = require("../../src/models/mototribe/RideParticipant");
const RideReminder = require("../../src/models/mototribe/RideReminder");
const User = require("../../src/models/core/User");
const { checkAndSendReminders } = require("../../src/services/mototribe/reminderService");

describe("MotoTribe Email Ride Reminders & Scheduler Service", () => {
  let user1, user2;
  let ride24h, ride1h;

  beforeEach(async () => {
    // 1. Create users
    user1 = await User.create({
      name: "Reminder Rider 1",
      email: "rider1.reminder@example.com",
      password: "password123",
    });

    user2 = await User.create({
      name: "Reminder Rider 2",
      email: "rider2.reminder@example.com",
      password: "password123",
    });

    const now = Date.now();

    // 2. Create ride starting in 12 hours (falls into 24h window)
    ride24h = await Ride.create({
      organizerId: user1._id,
      title: "24h Coastal Ride",
      origin: "Bangalore",
      destination: "Mangalore",
      startDate: new Date(now + 12 * 60 * 60 * 1000),
      distanceKm: 350,
      status: "planning",
    });
    await RideParticipant.create({
      rideId: ride24h._id,
      userId: user1._id,
      status: "confirmed",
    });
    await RideParticipant.create({
      rideId: ride24h._id,
      userId: user2._id,
      status: "confirmed",
    });

    // 3. Create ride starting in 30 minutes (falls into BOTH 24h and 1h windows)
    ride1h = await Ride.create({
      organizerId: user1._id,
      title: "Imminent Sprint",
      origin: "Bangalore",
      destination: "Nandi Hills",
      startDate: new Date(now + 30 * 60 * 1000),
      distanceKm: 60,
      status: "planning",
    });
    await RideParticipant.create({
      rideId: ride1h._id,
      userId: user1._id,
      status: "confirmed",
    });
  });

  test("Sends 24h and 1h reminders and creates RideReminder records", async () => {
    const res = await checkAndSendReminders();

    // ride24h: 2 confirmed participants -> 2 x 24h reminders sent
    // ride1h: 1 confirmed participant -> 1 x 24h reminder sent AND 1 x 1h reminder sent
    // Total sent = 4
    expect(res.sentCount).toBe(4);
    expect(res.skippedCount).toBe(0);
    expect(res.failedCount).toBe(0);

    const remindersInDb = await RideReminder.find({});
    expect(remindersInDb.length).toBe(4);

    // Confirm user1 received BOTH 24h and 1h reminders for ride1h (overlap verification)
    const user1Ride1hReminders = await RideReminder.find({
      rideId: ride1h._id,
      userId: user1._id,
    });
    expect(user1Ride1hReminders.length).toBe(2);
    const types = user1Ride1hReminders.map((r) => r.reminderType);
    expect(types).toContain("24h");
    expect(types).toContain("1h");
  });

  test("Skips sending when RideReminder already exists (idempotency)", async () => {
    // First run sends reminders
    await checkAndSendReminders();

    // Second run should skip all previously sent reminders
    const secondRun = await checkAndSendReminders();

    expect(secondRun.sentCount).toBe(0);
    expect(secondRun.skippedCount).toBe(4);
    expect(secondRun.failedCount).toBe(0);
  });

  test("Handles errors gracefully without throwing uncaught exceptions", async () => {
    // Call checkAndSendReminders - should execute safely and return counts object
    const result = await checkAndSendReminders();
    expect(result).toHaveProperty("sentCount");
    expect(result).toHaveProperty("skippedCount");
    expect(result).toHaveProperty("failedCount");
  });
});
