const express = require("express");
const {
  getRouteStatsController,
  getRouteMatchesController,
} = require("../../controllers/mototribe/routeMatchController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// Route matching endpoints
router.get("/rides/route-stats", protect, getRouteStatsController);
router.get("/rides/route-matches", protect, getRouteMatchesController);

module.exports = router;
