const InfluenceCampaign = require(
  "../../../models/modasphere/modainfluence/InfluenceCampaign"
);

// =========================================
// CREATE CAMPAIGN REQUEST
// =========================================

const createCampaign = async (req, res) => {
  try {
    const campaign = await InfluenceCampaign.create({
      brand: req.body.brand,
      email: req.body.email,
      campaignType: req.body.campaignType,
      message: req.body.message,
    });

    res.status(201).json({
      success: true,
      message: "Campaign request submitted successfully",
      data: campaign,
    });
  } catch (error) {
    console.error("Create influence campaign error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to submit campaign request",
    });
  }
};

// =========================================
// GET ALL CAMPAIGN REQUESTS
// =========================================

const getCampaigns = async (req, res) => {
  try {
    const campaigns = await InfluenceCampaign.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns,
    });
  } catch (error) {
    console.error("Get influence campaigns error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load campaign requests",
    });
  }
};

// =========================================
// GET SINGLE CAMPAIGN REQUEST
// =========================================

const getCampaignById = async (req, res) => {
  try {
    const campaign = await InfluenceCampaign.findById(
      req.params.id
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign request not found",
      });
    }

    res.status(200).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error("Get influence campaign error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load campaign request",
    });
  }
};

// =========================================
// UPDATE STATUS
// =========================================

const updateCampaignStatus = async (req, res) => {
  try {
    const allowedStatuses = [
      "New",
      "Contacted",
      "In Progress",
      "Completed",
      "Rejected",
    ];

    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign status",
      });
    }

    const campaign = await InfluenceCampaign.findByIdAndUpdate(
      req.params.id,
      { status },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign request not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Campaign status updated successfully",
      data: campaign,
    });
  } catch (error) {
    console.error("Update influence campaign status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update campaign status",
    });
  }
};

// =========================================
// DELETE CAMPAIGN REQUEST
// =========================================
const deleteCampaign = async (req, res) => {
  try {
    const campaign = await InfluenceCampaign.findByIdAndDelete(
      req.params.id
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign request not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Campaign request deleted successfully",
      data: campaign,
    });
  } catch (error) {
    console.error(
      "Delete influence campaign error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to delete campaign request",
    });
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaignStatus,
  deleteCampaign,
};