const express = require("express");
const {
  computeRideRoute,
  getRideRoute,
} = require("../../controllers/mototribe/directionsController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// All direction routes require authentication
router.use(protect);

router.post("/rides/:id/compute-route", computeRideRoute);
router.get("/rides/:id/route", getRideRoute);

module.exports = router;
