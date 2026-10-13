const express = require("express");
const {
  createDrop,
  getDrops,
  getDropById,
  joinWaitlist,
  leaveWaitlist,
  getUserPurchaseLimit,
  getUpcomingProductDrops,
  getLiveProductDrops,
  joinProductDropWaitlist,
  getProductDropWaitlistPosition,
} = require("../../controllers/modasphere/dropController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

router.get("/", getDrops);
router.post("/", protect, createDrop);
// Product-level ModaDrop routes
router.get("/products/upcoming", getUpcomingProductDrops);
router.get("/products/live", getLiveProductDrops);

router.post(
  "/products/:productId/waitlist",
  protect,
  joinProductDropWaitlist
);

router.get(
  "/products/:productId/waitlist/position",
  protect,
  getProductDropWaitlistPosition
);

router.get("/:id", getDropById);
router.get("/:id/purchase-limit", protect, getUserPurchaseLimit);
router.post("/:id/waitlist", protect, joinWaitlist);
router.delete("/:id/waitlist", protect, leaveWaitlist);

module.exports = router;
