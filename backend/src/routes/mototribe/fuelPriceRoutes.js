const express = require("express");
const {
  postFuelPriceSubmission,
  getFuelPriceAverageController,
  getRideFuelEstimateController,
} = require("../../controllers/mototribe/fuelPriceController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// Protect all fuel price routes with JWT authentication
router.use(protect);

// POST /api/mototribe/fuel-prices - Submit crowdsourced fuel price (Any logged-in user)
router.post("/fuel-prices", postFuelPriceSubmission);

// GET /api/mototribe/fuel-prices?state=X&fuelType=Y - Get current 7-day median fuel price
router.get("/fuel-prices", getFuelPriceAverageController);

// GET /api/mototribe/rides/:id/fuel-estimate - Get ride fuel estimate using crowdsourced price (Confirmed participants or organizer)
router.get("/rides/:id/fuel-estimate", getRideFuelEstimateController);

module.exports = router;
