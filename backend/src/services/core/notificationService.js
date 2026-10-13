const Notification = require("../../models/core/Notification");
const AppError = require("../../utils/AppError");

const NOTIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Delete all notifications older than 24 hours from the database
 */
const deleteExpiredNotifications = async () => {
  const cutoff = new Date(Date.now() - NOTIFICATION_TTL_MS);
  return await Notification.deleteMany({ createdAt: { $lt: cutoff } });
};

/**
 * Create a new notification
 */
const createNotification = async ({
  userId,
  senderId = null,
  type = "SYSTEM",
  brand = "core",
  title,
  message,
  data = {},
}) => {
  if (!userId || !title || !message) {
    return null;
  }

  return await Notification.create({
    userId,
    senderId,
    type,
    brand,
    title,
    message,
    data,
  });
};

/**
 * Get notifications for a user with unread count (only within the last 24 hours)
 */
const getUserNotifications = async (userId, { brand, limit = 40 } = {}) => {
  const cutoff = new Date(Date.now() - NOTIFICATION_TTL_MS);

  // Proactively delete any notifications older than 24 hours from the database
  await Notification.deleteMany({ createdAt: { $lt: cutoff } });

  const query = {
    userId,
    createdAt: { $gte: cutoff },
  };

  if (brand && brand !== "all") {
    query.brand = { $in: [brand, "core"] };
  }

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(query)
      .populate("senderId", "name email role")
      .sort({ createdAt: -1 })
      .limit(Number(limit)),
    Notification.countDocuments({
      userId,
      isRead: false,
      createdAt: { $gte: cutoff },
    }),
  ]);

  return { notifications, unreadCount };
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (notificationId, userId) => {
  const cutoff = new Date(Date.now() - NOTIFICATION_TTL_MS);
  const notification = await Notification.findOne({
    _id: notificationId,
    userId,
    createdAt: { $gte: cutoff },
  });

  if (!notification) {
    throw new AppError("Notification not found.", 404);
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  return notification;
};

/**
 * Mark all notifications as read for a user (only within 24 hours)
 */
const markAllAsRead = async (userId, brand) => {
  const cutoff = new Date(Date.now() - NOTIFICATION_TTL_MS);
  const query = { userId, isRead: false, createdAt: { $gte: cutoff } };
  if (brand && brand !== "all") {
    query.brand = { $in: [brand, "core"] };
  }

  await Notification.updateMany(query, {
    $set: { isRead: true, readAt: new Date() },
  });

  return { message: "All notifications marked as read." };
};

/**
 * Delete a notification
 */
const deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    userId,
  });

  if (!notification) {
    throw new AppError("Notification not found.", 404);
  }

  return { message: "Notification deleted successfully." };
};

module.exports = {
  NOTIFICATION_TTL_MS,
  deleteExpiredNotifications,
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
