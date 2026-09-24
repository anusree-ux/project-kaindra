const Campaign = require("../../../models/modasphere/modainfluence/Campaign");
const BrandProfile = require("../../../models/modasphere/modainfluence/BrandProfile");

// Create campaign
const createCampaign = async (req, res) => {
  try {
    const brandProfile = await BrandProfile.findOne({
      user: req.user._id,
    });

    if (!brandProfile) {
      return res.status(404).json({
        success: false,
        message: "Brand profile not found",
      });
    }

    const campaign = await Campaign.create({
      brand: brandProfile._id,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      data: campaign,
    });
  } catch (error) {
    console.error("Create campaign error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create campaign",
    });
  }
};

// Browse published campaigns
const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({
      status: "published",
    })
      .populate("brand", "brandName logo industry")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns,
    });
  } catch (error) {
    console.error("Get campaigns error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get campaigns",
    });
  }
};

// Get campaign by ID
const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      status: "published",
    }).populate("brand", "brandName logo industry");

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    res.status(200).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error("Get campaign error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get campaign",
    });
  }
};

// Get campaigns created by logged-in brand
const getMyCampaigns = async (req, res) => {
  try {
    const brandProfile = await BrandProfile.findOne({
      user: req.user._id,
    });

    if (!brandProfile) {
      return res.status(404).json({
        success: false,
        message: "Brand profile not found",
      });
    }

    const campaigns = await Campaign.find({
      brand: brandProfile._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns,
    });
  } catch (error) {
    console.error("Get my campaigns error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get your campaigns",
    });
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignById,
  getMyCampaigns,
};