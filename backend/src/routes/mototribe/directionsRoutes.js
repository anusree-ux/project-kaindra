const express = require("express");
const {
  computeRideRoute,
  getRideRoute,
  analyzeRouteController,
} = require("../../controllers/mototribe/directionsController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// Public route analysis preview for planner
router.get("/directions/analyze", analyzeRouteController);
router.post("/directions/analyze", analyzeRouteController);

// Authenticated ride routes
router.post("/rides/:id/compute-route", protect, computeRideRoute);
router.get("/rides/:id/route", protect, getRideRoute);

module.exports = router;
