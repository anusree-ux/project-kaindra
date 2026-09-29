const express = require("express");
const {
  createDrop,
  getDrops,
  getDropById,
  joinWaitlist,
  leaveWaitlist,
  getUserPurchaseLimit,
} = require("../../controllers/modasphere/dropController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

router.get("/", getDrops);
router.post("/", protect, createDrop);
router.get("/:id", getDropById);
router.get("/:id/purchase-limit", protect, getUserPurchaseLimit);
router.post("/:id/waitlist", protect, joinWaitlist);
router.delete("/:id/waitlist", protect, leaveWaitlist);

module.exports = router;
