const request = require("supertest");
const webpush = require("web-push");
const app = require("../../src/app");
const PushSubscription = require("../../src/models/mototribe/PushSubscription");
const NotificationPreference = require("../../src/models/mototribe/NotificationPreference");
const Notification = require("../../src/models/core/Notification");
const Ride = require("../../src/models/mototribe/Ride");
const RideParticipant = require("../../src/models/mototribe/RideParticipant");
const { createTestUser } = require("../helpers/testUser");
const pushService = require("../../src/services/mototribe/pushService");
const { createNotification } = require("../../src/services/core/notificationService");

// Mock web-push library
jest.mock("web-push", () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn().mockResolvedValue({ statusCode: 201 }),
}));

describe("Web Push Alerts Test Suite", () => {
  let user1, user2;
  const originalEnv = { ...process.env };

  const validEndpoint = (token = "test-token-1") =>
    `https://fcm.googleapis.com/fcm/send/${token}`;

  const validKeys = {
    p256dh: "BM8_valid_p256dh_key_test_string_1234567890",
    auth: "auth_secret_key_123",
  };

  beforeAll(() => {
    process.env.VAPID_PUBLIC_KEY = "test-vapid-public-key";
    process.env.VAPID_PRIVATE_KEY = "test-vapid-private-key";
    process.env.VAPID_SUBJECT = "mailto:test@kaindra.com";
    pushService.initVapid();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    webpush.sendNotification.mockResolvedValue({ statusCode: 201 });

    process.env.VAPID_PUBLIC_KEY = "test-vapid-public-key";
    process.env.VAPID_PRIVATE_KEY = "test-vapid-private-key";
    process.env.VAPID_SUBJECT = "mailto:test@kaindra.com";
    pushService.initVapid();

    await PushSubscription.deleteMany({});
    await NotificationPreference.deleteMany({});
    await Notification.deleteMany({});
    await Ride.deleteMany({});
    await RideParticipant.deleteMany({});

    user1 = await createTestUser({ name: "Rider Alpha" });
    user2 = await createTestUser({ name: "Rider Beta" });
  });

  describe("1. VAPID Configuration & Public Key", () => {
    test("Returns 503 on public-key and subscribe when VAPID is not configured", async () => {
      delete process.env.VAPID_PUBLIC_KEY;
      delete process.env.VAPID_PRIVATE_KEY;
      delete process.env.VAPID_SUBJECT;
      pushService.initVapid();

      const keyRes = await request(app).get("/api/core/notifications/push/public-key");
      expect(keyRes.statusCode).toBe(503);
      expect(keyRes.body.status).toBe("error");
      expect(keyRes.body.message).toMatch(/not configured/i);

      const subRes = await request(app)
        .post("/api/core/notifications/push/subscriptions")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          endpoint: validEndpoint("sub-test"),
          keys: validKeys,
        });
      expect(subRes.statusCode).toBe(503);
      expect(subRes.body.status).toBe("error");
    });

    test("Returns public key when VAPID is configured", async () => {
      const res = await request(app).get("/api/core/notifications/push/public-key");
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.publicKey).toBe("test-vapid-public-key");
    });
  });

  describe("2. Endpoint Validation", () => {
    test("Rejects HTTP endpoints, localhost, raw IPs, and non-whitelisted hosts", async () => {
      const invalidEndpoints = [
        "http://fcm.googleapis.com/fcm/send/123", // HTTP
        "http://localhost:3000/push", // Localhost
        "https://localhost/push", // HTTPS Localhost
        "https://127.0.0.1/push", // Loopback IP
        "https://192.168.1.50:8080/push", // Private IP
        "https://10.0.0.1/push", // Private IP
        "https://attacker.evil.com/push", // Non-whitelisted domain
        "not-a-url", // Malformed
      ];

      for (const endpoint of invalidEndpoints) {
        const res = await request(app)
          .post("/api/core/notifications/push/subscriptions")
          .set("Authorization", `Bearer ${user1.token}`)
          .send({ endpoint, keys: validKeys });

        expect(res.statusCode).toBe(400);
        expect(res.body.status).toBe("fail");
        expect(res.body.message).toMatch(/valid browser push service endpoint/i);
      }
    });

    test("Accepts allowed browser push services (fcm, mozilla, apple, windows)", async () => {
      const allowedEndpoints = [
        "https://fcm.googleapis.com/fcm/send/fcm-token-123",
        "https://updates.push.services.mozilla.com/wpush/v2/moz-token-456",
        "https://web.push.apple.com/apple-token-789",
        "https://api.push.apple.com/apple-token-abc",
        "https://db5.notify.windows.com/win-token-xyz",
      ];

      for (let i = 0; i < allowedEndpoints.length; i++) {
        const endpoint = allowedEndpoints[i];
        const res = await request(app)
          .post("/api/core/notifications/push/subscriptions")
          .set("Authorization", `Bearer ${user1.token}`)
          .send({ endpoint, keys: validKeys });

        expect(res.statusCode).toBe(201);
        expect(res.body.status).toBe("success");
        expect(res.body.data.subscription.endpoint).toBe(endpoint);
      }
    });
  });

  describe("3. Subscription Upsert & Ownership Reassignment", () => {
    test("Reassigns existing endpoint to new user without duplicate records", async () => {
      const sharedEndpoint = validEndpoint("shared-device-1");

      // User 1 subscribes
      const res1 = await request(app)
        .post("/api/core/notifications/push/subscriptions")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ endpoint: sharedEndpoint, keys: validKeys });
      expect(res1.statusCode).toBe(201);

      let doc = await PushSubscription.findOne({ endpoint: sharedEndpoint });
      expect(doc.userId.toString()).toBe(user1.userId.toString());

      // User 2 logs into same device and subscribes
      const res2 = await request(app)
        .post("/api/core/notifications/push/subscriptions")
        .set("Authorization", `Bearer ${user2.token}`)
        .send({ endpoint: sharedEndpoint, keys: validKeys });
      expect(res2.statusCode).toBe(201);

      // Verify count in collection is still 1, but owned by User 2
      const allWithEndpoint = await PushSubscription.find({ endpoint: sharedEndpoint });
      expect(allWithEndpoint.length).toBe(1);
      expect(allWithEndpoint[0].userId.toString()).toBe(user2.userId.toString());

      // User 1 has 0 subscriptions
      const user1Subs = await PushSubscription.find({ userId: user1.userId });
      expect(user1Subs.length).toBe(0);
    });
  });

  describe("4. 10-Device Limit & Eviction Policy", () => {
    test("11th subscription evicts oldest by lastUsedAt and never evicts newest", async () => {
      const baseTime = Date.now() - 100000;

      // Seed 10 subscriptions with spaced lastUsedAt
      for (let i = 1; i <= 10; i++) {
        await PushSubscription.create({
          userId: user1.userId,
          endpoint: validEndpoint(`device-${i}`),
          keys: validKeys,
          lastUsedAt: new Date(baseTime + i * 1000), // device-1 is oldest
        });
      }

      let count = await PushSubscription.countDocuments({ userId: user1.userId });
      expect(count).toBe(10);

      // Add 11th subscription
      const eleventhEndpoint = validEndpoint("device-11");
      const res = await request(app)
        .post("/api/core/notifications/push/subscriptions")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ endpoint: eleventhEndpoint, keys: validKeys });

      expect(res.statusCode).toBe(201);

      // Count must still be 10
      count = await PushSubscription.countDocuments({ userId: user1.userId });
      expect(count).toBe(10);

      // device-1 (oldest) must have been deleted
      const oldestDoc = await PushSubscription.findOne({
        endpoint: validEndpoint("device-1"),
      });
      expect(oldestDoc).toBeNull();

      // device-11 (newest) must still be present
      const newestDoc = await PushSubscription.findOne({
        endpoint: eleventhEndpoint,
      });
      expect(newestDoc).not.toBeNull();
    });
  });

  describe("5. Unsubscribe Behavior", () => {
    test("Unsubscribe is idempotent and owner-scoped", async () => {
      const user1Endpoint = validEndpoint("user1-phone");
      await PushSubscription.create({
        userId: user1.userId,
        endpoint: user1Endpoint,
        keys: validKeys,
      });

      // User 2 attempts to unsubscribe User 1's endpoint (must not delete it)
      const resOther = await request(app)
        .delete("/api/core/notifications/push/subscriptions")
        .set("Authorization", `Bearer ${user2.token}`)
        .send({ endpoint: user1Endpoint });
      expect(resOther.statusCode).toBe(200);

      let doc = await PushSubscription.findOne({ endpoint: user1Endpoint });
      expect(doc).not.toBeNull();

      // User 1 unsubscribes their endpoint
      const resOwner = await request(app)
        .delete("/api/core/notifications/push/subscriptions")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ endpoint: user1Endpoint });
      expect(resOwner.statusCode).toBe(200);

      doc = await PushSubscription.findOne({ endpoint: user1Endpoint });
      expect(doc).toBeNull();

      // Deleting again is idempotent
      const resAgain = await request(app)
        .delete("/api/core/notifications/push/subscriptions")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ endpoint: user1Endpoint });
      expect(resAgain.statusCode).toBe(200);
    });
  });

  describe("6. Auto-Removal on 410 Gone and 404", () => {
    test("Automatically purges subscriptions when browser push service returns 410 or 404", async () => {
      const sub410 = validEndpoint("dead-410");
      const sub404 = validEndpoint("dead-404");

      await PushSubscription.create({
        userId: user2.userId,
        endpoint: sub410,
        keys: validKeys,
      });
      await PushSubscription.create({
        userId: user2.userId,
        endpoint: sub404,
        keys: validKeys,
      });

      // Mock webpush to fail with 410 for sub410 and 404 for sub404
      webpush.sendNotification.mockImplementation(async (sub) => {
        if (sub.endpoint === sub410) {
          const err = new Error("Subscription expired");
          err.statusCode = 410;
          throw err;
        }
        if (sub.endpoint === sub404) {
          const err = new Error("Subscription not found");
          err.statusCode = 404;
          throw err;
        }
        return { statusCode: 201 };
      });

      const result = await pushService.sendPushToUser(user2.userId, {
        type: "SYSTEM",
        title: "Test Purge",
        body: "Hello",
        url: "/",
      });

      expect(result.removed).toBe(2);

      const remaining = await PushSubscription.find({ userId: user2.userId });
      expect(remaining.length).toBe(0);
    });
  });

  describe("7. Notification Preferences & Muted Types", () => {
    test("Rejects invalid muted types in preferences", async () => {
      const res = await request(app)
        .patch("/api/core/notifications/push/preferences")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ muted: ["INVALID_TYPE"] });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/invalid notification type/i);
    });

    test("Suppresses push alerts when push.enabled is false", async () => {
      await PushSubscription.create({
        userId: user1.userId,
        endpoint: validEndpoint("user1-dev"),
        keys: validKeys,
      });

      await NotificationPreference.create({
        userId: user1.userId,
        push: { enabled: false, muted: [] },
      });

      const result = await pushService.sendPushToUser(user1.userId, {
        type: "SYSTEM",
        title: "Disabled Push Test",
        body: "Should not be sent",
      });

      expect(result.sent).toBe(0);
      expect(webpush.sendNotification).not.toHaveBeenCalled();
    });

    test("Suppresses push alerts when specific type is muted", async () => {
      await PushSubscription.create({
        userId: user1.userId,
        endpoint: validEndpoint("user1-dev"),
        keys: validKeys,
      });

      await NotificationPreference.create({
        userId: user1.userId,
        push: { enabled: true, muted: ["CHAT_MESSAGE"] },
      });

      // CHAT_MESSAGE is muted
      const chatResult = await pushService.sendPushToUser(user1.userId, {
        type: "CHAT_MESSAGE",
        title: "Chat Alert",
        body: "Hey there!",
      });
      expect(chatResult.sent).toBe(0);
      expect(webpush.sendNotification).not.toHaveBeenCalled();

      // SYSTEM is NOT muted
      const sysResult = await pushService.sendPushToUser(user1.userId, {
        type: "SYSTEM",
        title: "System Alert",
        body: "Welcome!",
      });
      expect(sysResult.sent).toBe(1);
      expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
    });
  });

  describe("8. Stored Notifications & Push Delivery", () => {
    test("Stored notification triggers Web Push dispatch to recipient with sanitized text", async () => {
      await PushSubscription.create({
        userId: user2.userId,
        endpoint: validEndpoint("user2-phone"),
        keys: validKeys,
      });

      await createNotification({
        userId: user2.userId,
        senderId: user1.userId,
        type: "CONNECTION_REQUEST",
        brand: "mototribe",
        title: "New Connection Request ⚡",
        message: "Rider Alpha wants to connect. Email: alpha@secret.com Phone: +919876543210",
        data: { requestId: "req123" },
      });

      // Wait a tick for async non-blocking push
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
      const [calledSub, calledPayloadStr] = webpush.sendNotification.mock.calls[0];
      expect(calledSub.endpoint).toBe(validEndpoint("user2-phone"));

      const payload = JSON.parse(calledPayloadStr);
      expect(payload.title).toBe("New Connection Request ⚡");
      expect(payload.data.type).toBe("CONNECTION_REQUEST");
      expect(payload.data.url).toBe("/businesses/mototribe");
      // Lock-screen sanitization check: email and phone redacted
      expect(payload.body).not.toContain("alpha@secret.com");
      expect(payload.body).not.toContain("+919876543210");
    });

    test("Actor is not notified when sending connection request", async () => {
      await PushSubscription.create({
        userId: user1.userId,
        endpoint: validEndpoint("user1-phone"),
        keys: validKeys,
      });
      await PushSubscription.create({
        userId: user2.userId,
        endpoint: validEndpoint("user2-phone"),
        keys: validKeys,
      });

      const res = await request(app)
        .post("/api/core/connections/request")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ toUserId: user2.userId });

      expect(res.statusCode).toBe(201);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Push was only sent to user2, never to user1 (actor)
      expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
      const [calledSub] = webpush.sendNotification.mock.calls[0];
      expect(calledSub.endpoint).toBe(validEndpoint("user2-phone"));
    });
  });

  describe("9. SOS Exclusion Guarantee", () => {
    test("Refuses push dispatch for any notification type containing SOS", async () => {
      await PushSubscription.create({
        userId: user2.userId,
        endpoint: validEndpoint("user2-phone"),
        keys: validKeys,
      });

      const sosTypes = ["SOS", "SOS_ALERT", "RIDE_SOS", "sos_trigger"];
      for (const type of sosTypes) {
        const res = await pushService.sendPushToUser(user2.userId, {
          type,
          title: "EMERGENCY SOS",
          body: "Rider in distress",
        });
        expect(res.sent).toBe(0);
      }

      expect(webpush.sendNotification).not.toHaveBeenCalled();
    });

    test("POST /api/mototribe/rides/:id/sos creates alert but never invokes push", async () => {
      // Create a ride
      const ride = await Ride.create({
        organizerId: user1.userId,
        vehicleId: user1.vehicleId,
        title: "Sunday Mountain Ride",
        origin: "Bangalore",
        destination: "Nandi Hills",
        startDate: new Date(),
        distanceKm: 60,
        status: "ongoing",
      });

      const res = await request(app)
        .post(`/api/mototribe/rides/${ride._id}/sos`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          latitude: 12.9716,
          longitude: 77.5946,
          message: "Flat tire emergency",
        });

      expect(res.statusCode).toBe(201);
      expect(webpush.sendNotification).not.toHaveBeenCalled();
    });
  });

  describe("10. Push Resilience", () => {
    test("Push gateway failure does not fail the triggering request", async () => {
      await PushSubscription.create({
        userId: user2.userId,
        endpoint: validEndpoint("user2-phone"),
        keys: validKeys,
      });

      webpush.sendNotification.mockRejectedValue(new Error("Network timeout to FCM"));

      const res = await request(app)
        .post("/api/core/connections/request")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ toUserId: user2.userId });

      // Request must still succeed with 201
      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe("success");
    });
  });

  describe("11. Test Push Endpoint Rate Limiting", () => {
    test("Rate limits test push to once every 30 seconds per user", async () => {
      await PushSubscription.create({
        userId: user1.userId,
        endpoint: validEndpoint("user1-test"),
        keys: validKeys,
      });

      const res1 = await request(app)
        .post("/api/core/notifications/push/test")
        .set("Authorization", `Bearer ${user1.token}`);

      expect(res1.statusCode).toBe(200);
      expect(res1.body.status).toBe("success");

      // Immediate second request must be rate limited with 429
      const res2 = await request(app)
        .post("/api/core/notifications/push/test")
        .set("Authorization", `Bearer ${user1.token}`);

      expect(res2.statusCode).toBe(429);
      expect(res2.body.message).toMatch(/wait before requesting another test alert/i);
    });
  });
});
