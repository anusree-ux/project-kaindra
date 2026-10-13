const express = require("express");
const {
  getNotifications,
  markRead,
  markAllRead,
  removeNotification,
} = require("../../controllers/core/notificationController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markRead);
router.delete("/:id", removeNotification);

module.exports = router;
