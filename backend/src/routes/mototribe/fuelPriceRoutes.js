const express = require("express");
const {
  postFuelPriceSubmission,
  getFuelPriceAverageController,
  getRecentSubmissionsController,
  getRideFuelEstimateController,
} = require("../../controllers/mototribe/fuelPriceController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// GET /api/mototribe/fuel-prices/submissions - Get recent community fuel price reports from DB (Public)
router.get("/fuel-prices/submissions", getRecentSubmissionsController);

// GET /api/mototribe/fuel-prices?state=X&fuelType=Y - Get current 7-day median / state DB benchmark fuel price (Public)
router.get("/fuel-prices", getFuelPriceAverageController);

// Protected routes (require JWT authentication)
router.use(protect);

// POST /api/mototribe/fuel-prices - Submit crowdsourced fuel price (Any logged-in user)
router.post("/fuel-prices", postFuelPriceSubmission);

// GET /api/mototribe/rides/:id/fuel-estimate - Get ride fuel estimate using crowdsourced price (Confirmed participants or organizer)
router.get("/rides/:id/fuel-estimate", getRideFuelEstimateController);

module.exports = router;
