const express = require("express");
const {
  getRideWeather,
  getWeatherByCoordinates,
} = require("../../controllers/mototribe/weatherController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// Protect all weather routes with JWT authentication
router.use(protect);

// GET /api/mototribe/weather?lat=X&lng=Y - Standalone coordinate weather
router.get("/weather", getWeatherByCoordinates);

// GET /api/mototribe/rides/:id/weather - Ride-specific weather
router.get("/rides/:id/weather", getRideWeather);

module.exports = router;
