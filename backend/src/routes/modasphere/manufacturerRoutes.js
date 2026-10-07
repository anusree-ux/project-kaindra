const express = require("express");
const {
  putManufacturerProfile,
  getMyManufacturerProfile,
  getVerifiedManufacturers,
  getManufacturerById,
  verifyManufacturer,
} = require("../../controllers/modasphere/manufacturerController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// Static / collection routes defined BEFORE parameterized ones
router.put("/manufacturers/me", putManufacturerProfile);
router.get("/manufacturers/me", getMyManufacturerProfile);
router.get("/manufacturers", getVerifiedManufacturers);

// Parameterized routes
router.get("/manufacturers/:id", getManufacturerById);
router.patch("/manufacturers/:id/verify", verifyManufacturer);

module.exports = router;
