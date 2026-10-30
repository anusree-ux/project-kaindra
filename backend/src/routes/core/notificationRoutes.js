const express = require("express");
const {
  getNotifications,
  markRead,
  markAllRead,
  removeNotification,
} = require("../../controllers/core/notificationController");
const { protect } = require("../../middleware/authMiddleware");
const pushRoutes = require("./pushRoutes");

const router = express.Router();

// Web Push sub-router (mounted before general protect and :id routes)
router.use("/push", pushRoutes);

router.use(protect);

router.get("/", getNotifications);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markRead);
router.delete("/:id", removeNotification);

module.exports = router;
