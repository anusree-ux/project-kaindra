const express = require("express");
const {
  checkout,
  verifyPayment,
  getMyOrders,
  getOrderById,
  getSellerOrders,
  shipOrder,
  deliverOrder,
  cancelOrder,
  getRefundStatus,
  retryRefund,
} = require("../../controllers/modasphere/orderController");
const { protect, authorize } = require("../../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/checkout", checkout);
router.post("/:id/verify-payment", verifyPayment);
router.get("/me", getMyOrders);
router.get("/seller/me", getSellerOrders);
router.get("/:id", getOrderById);

// Status progression routes
router.patch("/:id/ship", shipOrder);
router.patch("/:id/deliver", deliverOrder);
router.patch("/:id/cancel", cancelOrder);

// Refund routes
router.get("/:id/refund-status", getRefundStatus);
router.post("/:id/retry-refund", authorize("admin"), retryRefund);

module.exports = router;
