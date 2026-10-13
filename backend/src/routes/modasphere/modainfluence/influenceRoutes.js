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

const router = express.Router();

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