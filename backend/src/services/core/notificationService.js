const Notification = require("../../models/core/Notification");
const AppError = require("../../utils/AppError");

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
 * Get notifications for a user with unread count
 */
const getUserNotifications = async (userId, { brand, limit = 40 } = {}) => {
  const query = { userId };
  if (brand && brand !== "all") {
    query.brand = { $in: [brand, "core"] };
  }

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(query)
      .populate("senderId", "name email role")
      .sort({ createdAt: -1 })
      .limit(Number(limit)),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return { notifications, unreadCount };
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    userId,
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
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId, brand) => {
  const query = { userId, isRead: false };
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
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
