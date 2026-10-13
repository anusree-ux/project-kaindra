const notificationService = require("../../services/core/notificationService");

/**
 * @desc    Get logged in user's notifications
 * @route   GET /api/core/notifications
 * @access  Private
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { brand, limit } = req.query;

    const { notifications, unreadCount } = await notificationService.getUserNotifications(
      userId,
      { brand, limit }
    );

    res.status(200).json({
      status: "success",
      results: notifications.length,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark single notification as read
 * @route   PATCH /api/core/notifications/:id/read
 * @access  Private
 */
const markRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const notification = await notificationService.markAsRead(req.params.id, userId);

    res.status(200).json({
      status: "success",
      data: {
        notification,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/core/notifications/read-all
 * @access  Private
 */
const markAllRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { brand } = req.body;
    const result = await notificationService.markAllAsRead(userId, brand);

    res.status(200).json({
      status: "success",
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/core/notifications/:id
 * @access  Private
 */
const removeNotification = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const result = await notificationService.deleteNotification(req.params.id, userId);

    res.status(200).json({
      status: "success",
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markRead,
  markAllRead,
  removeNotification,
};
