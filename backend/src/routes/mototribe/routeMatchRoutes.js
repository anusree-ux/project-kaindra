const express = require("express");
const {
  getRouteStatsController,
  getRouteMatchesController,
} = require("../../controllers/mototribe/routeMatchController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// All route matching endpoints require authentication
router.use(protect);

router.get("/rides/route-stats", getRouteStatsController);
router.get("/rides/route-matches", getRouteMatchesController);

module.exports = router;
