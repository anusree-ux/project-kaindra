const express = require("express");

const { protect } = require("../../../middleware/authMiddleware");

const influencerValidator = require("../../../validators/modasphere/modainfluence/influencerValidator");
const brandValidator = require("../../../validators/modasphere/modainfluence/brandValidator");
const campaignValidator = require("../../../validators/modasphere/modainfluence/campaignValidator");
const applicationValidator = require("../../../validators/modasphere/modainfluence/applicationValidator");
const updateInfluencerValidator = require("../../../validators/modasphere/modainfluence/updateInfluencerValidator");
const updateBrandValidator = require("../../../validators/modasphere/modainfluence/updateBrandValidator");

const {
  createInfluencerProfile,
  getInfluencerProfile,
  updateInfluencerProfile,
} = require("../../../controllers/modasphere/modainfluence/influencerController");

const {
  createBrandProfile,
  getBrandProfile,
  updateBrandProfile,
} = require("../../../controllers/modasphere/modainfluence/brandController");

const {
  createCampaign,
  getCampaigns,
  getCampaignById,
  getMyCampaigns,
} = require("../../../controllers/modasphere/modainfluence/campaignController");

const {
  applyToCampaign,
  getMyApplications,
  getCampaignApplications,
  acceptApplication,
  rejectApplication,
} = require("../../../controllers/modasphere/modainfluence/applicationController");

const router = express.Router();

// Influencer profile
router.post(
  "/influencer/profile",
  protect,
  influencerValidator,
  createInfluencerProfile
);

router.get(
  "/influencer/profile",
  protect,
  getInfluencerProfile
);

router.patch(
  "/influencer/profile",
  protect,
  updateInfluencerValidator,
  updateInfluencerProfile
);

// Brand profile
router.post(
  "/brand/profile",
  protect,
  brandValidator,
  createBrandProfile
);

router.get(
  "/brand/profile",
  protect,
  getBrandProfile
);

router.patch(
  "/brand/profile",
  protect,
  updateBrandValidator,
  updateBrandProfile
);

// Campaigns
router.post(
  "/campaigns",
  protect,
  campaignValidator,
  createCampaign
);

router.get(
  "/campaigns",
  getCampaigns
);

router.get(
  "/campaigns/:id",
  getCampaignById
);

router.get(
  "/my/campaigns",
  protect,
  getMyCampaigns
);

// Applications
router.post(
  "/campaigns/:id/apply",
  protect,
  applicationValidator,
  applyToCampaign
);

router.get(
  "/my/applications",
  protect,
  getMyApplications
);

router.get(
  "/campaigns/:id/applications",
  protect,
  getCampaignApplications
);

router.patch(
  "/applications/:id/accept",
  protect,
  acceptApplication
);

router.patch(
  "/applications/:id/reject",
  protect,
  rejectApplication
);

module.exports = router;