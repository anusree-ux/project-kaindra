const express = require("express");
const {
  getAllFuelPrices,
  getFuelPriceByLocation,
  calculateFuelCost,
  upsertFuelPrice,
} = require("../../controllers/mototribe/fuelPriceController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// Protect all fuel price routes with JWT authentication
router.use(protect);

// GET /api/mototribe/fuel-prices - Retrieve all current fuel prices
router.get("/fuel-prices", getAllFuelPrices);

// GET /api/mototribe/fuel-prices/search?location=Delhi - Search fuel price by location/state/city
router.get("/fuel-prices/search", getFuelPriceByLocation);

// POST /api/mototribe/fuel-prices/estimate - Calculate estimated fuel cost for a ride
router.post("/fuel-prices/estimate", calculateFuelCost);
router.post("/fuel-prices/calculate", calculateFuelCost);

// GET /api/mototribe/fuel-prices/:location - Retrieve fuel price for a specific location
router.get("/fuel-prices/:location", getFuelPriceByLocation);

// POST /api/mototribe/fuel-prices - Add/Update fuel price (admin/service update endpoint)
router.post("/fuel-prices", upsertFuelPrice);

module.exports = router;

