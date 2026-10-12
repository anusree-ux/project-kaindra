const request = require("supertest");
const app = require("../../src/app");
const Notification = require("../../src/models/core/Notification");
const { deleteExpiredNotifications } = require("../../src/services/core/notificationService");
const { createTestUser } = require("../helpers/testUser");

describe("Core Notifications API & 24-Hour Expiry/Purge", () => {
  let user1, user2;

  beforeEach(async () => {
    await Notification.deleteMany({});
    user1 = await createTestUser({ name: "Notif User 1" });
    user2 = await createTestUser({ name: "Notif User 2" });
  });

  test("1. Successfully creates and retrieves notifications within 24 hours", async () => {
    await Notification.create({
      userId: user1.userId,
      senderId: user2.userId,
      type: "CONNECTION_REQUEST",
      title: "New Connection Request ⚡",
      message: "Notif User 2 wants to connect with you",
      createdAt: new Date(),
    });

    const res = await request(app)
      .get("/api/core/notifications")
      .set("Authorization", `Bearer ${user1.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.results).toBe(1);
    expect(res.body.data.notifications).toHaveLength(1);
    expect(res.body.data.notifications[0].title).toBe("New Connection Request ⚡");
    expect(res.body.data.unreadCount).toBe(1);
  });

  test("2. Notifications older than 24 hours disappear from API results and unread count", async () => {
    const now = Date.now();
    const twentyFiveHoursAgo = new Date(now - 25 * 60 * 60 * 1000);
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);

    // Old expired notification (> 24 hours)
    await Notification.create({
      userId: user1.userId,
      senderId: user2.userId,
      type: "CONNECTION_REQUEST",
      title: "Old Request ⚡",
      message: "Expired notification",
      createdAt: twentyFiveHoursAgo,
    });

    // Recent notification (< 24 hours)
    await Notification.create({
      userId: user1.userId,
      senderId: user2.userId,
      type: "DROP_ALERT",
      title: "Fresh Drop Alert 🔥",
      message: "Active notification",
      createdAt: twoHoursAgo,
    });

    const res = await request(app)
      .get("/api/core/notifications")
      .set("Authorization", `Bearer ${user1.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.results).toBe(1);
    expect(res.body.data.notifications).toHaveLength(1);
    expect(res.body.data.notifications[0].title).toBe("Fresh Drop Alert 🔥");
    expect(res.body.data.unreadCount).toBe(1);
  });

  test("3. Notifications older than 24 hours are deleted in database upon retrieval", async () => {
    const now = Date.now();
    const thirtyHoursAgo = new Date(now - 30 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now - 1 * 60 * 60 * 1000);

    const oldNotif = await Notification.create({
      userId: user1.userId,
      title: "Old Notification",
      message: "Should be purged from DB",
      createdAt: thirtyHoursAgo,
    });

    const freshNotif = await Notification.create({
      userId: user1.userId,
      title: "Fresh Notification",
      message: "Should remain in DB",
      createdAt: oneHourAgo,
    });

    // Verify both exist before query
    const countBefore = await Notification.countDocuments({});
    expect(countBefore).toBe(2);

    // Call API which triggers cleanup
    await request(app)
      .get("/api/core/notifications")
      .set("Authorization", `Bearer ${user1.token}`);

    // Verify old notification is physically deleted from the database
    const oldInDb = await Notification.findById(oldNotif._id);
    expect(oldInDb).toBeNull();

    // Verify fresh notification is still in the database
    const freshInDb = await Notification.findById(freshNotif._id);
    expect(freshInDb).not.toBeNull();
  });

  test("4. deleteExpiredNotifications service helper deletes all notifications older than 24h", async () => {
    const now = Date.now();
    await Notification.create({
      userId: user1.userId,
      title: "Exp 1",
      message: "Exp 1",
      createdAt: new Date(now - 26 * 60 * 60 * 1000),
    });
    await Notification.create({
      userId: user2.userId,
      title: "Exp 2",
      message: "Exp 2",
      createdAt: new Date(now - 48 * 60 * 60 * 1000),
    });
    await Notification.create({
      userId: user1.userId,
      title: "Active 1",
      message: "Active 1",
      createdAt: new Date(now - 10 * 60 * 60 * 1000),
    });

    const result = await deleteExpiredNotifications();
    expect(result.deletedCount).toBe(2);

    const remaining = await Notification.find({});
    expect(remaining).toHaveLength(1);
    expect(remaining[0].title).toBe("Active 1");
  });

  test("5. Marking as read works for active notifications and rejects expired notifications", async () => {
    const activeNotif = await Notification.create({
      userId: user1.userId,
      title: "Active to Read",
      message: "Message",
      createdAt: new Date(),
    });

    const readRes = await request(app)
      .patch(`/api/core/notifications/${activeNotif._id}/read`)
      .set("Authorization", `Bearer ${user1.token}`);

    expect(readRes.statusCode).toBe(200);
    expect(readRes.body.data.notification.isRead).toBe(true);

    const expiredNotif = await Notification.create({
      userId: user1.userId,
      title: "Expired to Read",
      message: "Message",
      createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000),
    });

    const expiredRes = await request(app)
      .patch(`/api/core/notifications/${expiredNotif._id}/read`)
      .set("Authorization", `Bearer ${user1.token}`);

    expect(expiredRes.statusCode).toBe(404);
  });

  test("6. Notification schema defines a TTL index on createdAt with 86400 seconds", () => {
    const indexes = Notification.schema.indexes();
    const ttlIndex = indexes.find(
      ([fields, options]) => fields.createdAt === 1 && options?.expireAfterSeconds === 86400
    );
    expect(ttlIndex).toBeDefined();
  });
});
