const express = require("express");

const {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaignStatus,
} = require(
  "../../../controllers/modasphere/modainfluence/influenceCampaignController"
);

const influenceCampaignValidator = require(
  "../../../validators/modasphere/modainfluence/influenceCampaignValidator"
);

const router = express.Router();

// Public campaign request
router.post(
  "/campaigns",
  influenceCampaignValidator,
  createCampaign
);

// Admin campaign requests
router.get(
  "/campaigns",
  getCampaigns
);

router.get(
  "/campaigns/:id",
  getCampaignById
);

router.patch(
  "/campaigns/:id/status",
  updateCampaignStatus
);

module.exports = router;
