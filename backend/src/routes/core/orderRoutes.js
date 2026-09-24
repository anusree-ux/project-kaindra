const express = require("express");
const { protect } = require("../../middleware/authMiddleware");
const {
  getMyOrders,
  getOrderById,
  createOrder,
} = require("../../controllers/core/orderController");

const router = express.Router();

// All order endpoints require authentication
router.use(protect);

router.get("/my-orders", getMyOrders);
router.get("/", getMyOrders);
router.get("/:id", getOrderById);
router.post("/", createOrder);

module.exports = router;
