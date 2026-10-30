const express = require("express");
const {
  getPublicKey,
  subscribe,
  unsubscribe,
  getPreferences,
  updatePreferences,
  sendTestPush,
} = require("../../controllers/core/pushController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// Public route to retrieve VAPID public key
router.get("/public-key", getPublicKey);

// Protected routes
router.use(protect);

router.post("/subscriptions", subscribe);
router.delete("/subscriptions", unsubscribe);
router.get("/preferences", getPreferences);
router.patch("/preferences", updatePreferences);
router.post("/test", sendTestPush);

module.exports = router;
