const express = require("express");
const { getNearbyServices } = require("../../controllers/mototribe/placesController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// Protected endpoint (logged-in users only)
router.get("/nearby-services", protect, getNearbyServices);

module.exports = router;
