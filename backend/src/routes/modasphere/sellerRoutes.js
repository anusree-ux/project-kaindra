const express = require("express");
const {
  getBusinessProfileStatus,
  setupBusinessProfile,
  getMySellerProfile,
  putSellerProfile,
  getDirectoryPartners,
} = require("../../controllers/modasphere/sellerController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// Public directory of registered sellers and manufacturers
router.get("/directory/partners", getDirectoryPartners);

router.use(["/business", "/sellers"], protect);

// Check if user has an existing Seller or Manufacturer profile
router.get("/business/profile-status", getBusinessProfileStatus);

// Complete or save business profile setup
router.post("/business/setup-profile", setupBusinessProfile);

// Seller collection profile endpoints
router.get("/sellers/me", getMySellerProfile);
router.put("/sellers/me", putSellerProfile);

module.exports = router;
