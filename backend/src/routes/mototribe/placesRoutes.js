const express = require("express");
const { getNearbyServices } = require("../../controllers/mototribe/placesController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// GET /api/mototribe/nearby-services - Get nearby services along the way (Public)
router.get("/nearby-services", getNearbyServices);

module.exports = router;
