const express = require("express");

const {
  protect,
  authorize,
} = require("../../../middleware/authMiddleware");

const {
  createCampaign,
  getPublicCampaigns,
  getPublicCampaignById,
  getCampaigns,
  getCampaignById,
  deleteCampaign,
  getMyBrandCampaigns,
  updateMyBrandCampaign,
  deleteMyBrandCampaign,
  updateMyBrandCampaignVisibility,
} = require(
  "../../../controllers/modasphere/modainfluence/influenceCampaignController"
);

const influenceCampaignValidator = require(
  "../../../validators/modasphere/modainfluence/influenceCampaignValidator"
);
const influenceCampaignUpdateValidator = require(
  "../../../validators/modasphere/modainfluence/influenceCampaignUpdateValidator"
);

const {
  getMyBrandProfile,
  createBrandProfile,
  updateBrandProfile,
} = require(
  "../../../controllers/modasphere/modainfluence/influenceBrandProfileController"
);
const {
  createApplication,
  getMyApplications,
  withdrawApplication,
  deleteRejectedApplication,
  getCampaignApplications,
  updateApplicationStatus,
  deleteApplication,
} = require("../../../controllers/modasphere/modainfluence/influenceApplicationController");
const {
  getMyCreatorProfile,
  createCreatorProfile,
  updateCreatorProfile,
  deleteCreatorProfile,
} = require(
  "../../../controllers/modasphere/modainfluence/influenceCreatorProfileController"
);
const {
  createCreatorProfileValidator,
  updateCreatorProfileValidator,
} = require(
  "../../../validators/modasphere/modainfluence/influenceCreatorProfileValidator"
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

router.get(
  "/brand-profile/campaigns",
  protect,
  getMyBrandCampaigns
);

router.patch(
  "/brand-profile/campaigns/:id",
  protect,
  influenceCampaignUpdateValidator,
  updateMyBrandCampaign
);

router.delete(
  "/brand-profile/campaigns/:id",
  protect,
  deleteMyBrandCampaign
);

router.patch(
  "/brand-profile/campaigns/:id/visibility",
  protect,
  updateMyBrandCampaignVisibility
);
router.get(
  "/brand-profile/campaigns/:campaignId/applications",
  protect,
  getCampaignApplications
);
router.patch(
  "/brand-profile/campaigns/:campaignId/applications/:applicationId/status",
  protect,
  updateApplicationStatus
);
router.delete(
  "/brand-profile/campaigns/:campaignId/applications/:applicationId",
  protect,
  deleteApplication
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

router.get("/influencer-profile", protect, getMyCreatorProfile);
router.post(
  "/influencer-profile",
  protect,
  createCreatorProfileValidator,
  createCreatorProfile
);
router.patch(
  "/influencer-profile",
  protect,
  updateCreatorProfileValidator,
  updateCreatorProfile
);
router.delete(
  "/influencer-profile",
  protect,
  deleteCreatorProfile
);

// =====================================================
// PUBLIC
// =====================================================

router.get("/public-campaigns", getPublicCampaigns);
router.get("/public-campaigns/:id", getPublicCampaignById);
router.get("/influencer-profile/applications", protect, getMyApplications);
router.patch("/influencer-profile/applications/:applicationId/withdraw", protect, withdrawApplication);
router.delete("/influencer-profile/applications/:applicationId", protect, deleteRejectedApplication);
router.post("/campaigns/:campaignId/applications", protect, createApplication);

// Submit campaign request
router.post(
  "/campaigns",
  influenceCampaignValidator,
  createCampaign
);

// Submit campaign request from an authenticated brand
router.post(
  "/brand-profile/campaigns",
  protect,
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

// Delete campaign request
router.delete(
  "/campaigns/:id",
  protect,
  authorize("admin"),
  deleteCampaign
);

module.exports = router;
