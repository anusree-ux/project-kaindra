const express = require("express");

const {
  protect,
  authorize,
} = require("../../../middleware/authMiddleware");

const {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaignStatus,
  deleteCampaign,
} = require(
  "../../../controllers/modasphere/modainfluence/influenceCampaignController"
);

const influenceCampaignValidator = require(
  "../../../validators/modasphere/modainfluence/influenceCampaignValidator"
);

const {
  getMyBrandProfile,
  createBrandProfile,
  updateBrandProfile,
} = require(
  "../../../controllers/modasphere/modainfluence/influenceBrandProfileController"
);

const router = express.Router();

// =====================================================
// AUTHENTICATED BRAND PROFILE
// =====================================================

router.get(
  "/brand-profile",
  protect,
  getMyBrandProfile
);

router.post(
  "/brand-profile",
  protect,
  createBrandProfile
);

router.patch(
  "/brand-profile",
  protect,
  updateBrandProfile
);

// =====================================================
// PUBLIC
// =====================================================

// Submit campaign request
router.post(
  "/campaigns",
  influenceCampaignValidator,
  createCampaign
);

// =====================================================
// ADMIN ONLY
// =====================================================

// Get all campaign requests
router.get(
  "/campaigns",
  protect,
  authorize("admin"),
  getCampaigns
);

// Get single campaign request
router.get(
  "/campaigns/:id",
  protect,
  authorize("admin"),
  getCampaignById
);

// Update campaign status
router.patch(
  "/campaigns/:id/status",
  protect,
  authorize("admin"),
  updateCampaignStatus
);

// Delete campaign request
router.delete(
  "/campaigns/:id",
  protect,
  authorize("admin"),
  deleteCampaign
);

module.exports = router;