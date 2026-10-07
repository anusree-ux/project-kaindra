const express = require("express");
const {
  getSellerSummary,
  getSellerSalesTrend,
  getSellerTopProducts,
  getSellerLowStock,
  getPlatformSummary,
  getPlatformTopCategories,
} = require("../../controllers/modasphere/insightsController");
const { protect } = require("../../middleware/authMiddleware");
const authorize = require("../../middleware/authorize");

const router = express.Router();

// Seller analytics routes (protected for authenticated users / sellers)
router.get("/seller/summary", protect, getSellerSummary);
router.get("/seller/trend", protect, getSellerSalesTrend);
router.get("/seller/top-products", protect, getSellerTopProducts);
router.get("/seller/low-stock", protect, getSellerLowStock);

// Platform analytics routes (admin only)
router.get("/platform/summary", protect, authorize("admin"), getPlatformSummary);
router.get("/platform/top-categories", protect, authorize("admin"), getPlatformTopCategories);

module.exports = router;
