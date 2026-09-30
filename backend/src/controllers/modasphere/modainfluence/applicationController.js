const CampaignApplication = require("../../../models/modasphere/modainfluence/CampaignApplication");
const Campaign = require("../../../models/modasphere/modainfluence/Campaign");
const InfluencerProfile = require("../../../models/modasphere/modainfluence/InfluencerProfile");
const BrandProfile = require("../../../models/modasphere/modainfluence/BrandProfile");

// Apply to a campaign
const applyToCampaign = async (req, res) => {
  try {
    const influencerProfile = await InfluencerProfile.findOne({
      user: req.user._id,
    });

    if (!influencerProfile) {
      return res.status(404).json({
        success: false,
        message: "Influencer profile not found",
      });
    }

    const campaign = await Campaign.findOne({
      _id: req.params.id,
      status: "published",
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found or is not open for applications",
      });
    }

    if (
      campaign.applicationDeadline &&
      new Date() > campaign.applicationDeadline
    ) {
      return res.status(400).json({
        success: false,
        message: "Application deadline has passed",
      });
    }

    const existingApplication = await CampaignApplication.findOne({
      campaign: campaign._id,
      influencer: influencerProfile._id,
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: "You have already applied to this campaign",
      });
    }

    const application = await CampaignApplication.create({
      campaign: campaign._id,
      influencer: influencerProfile._id,
      message: req.body.message,
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    });
  } catch (error) {
    console.error("Apply to campaign error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to submit application",
    });
  }
};

// Get applications submitted by logged-in influencer
const getMyApplications = async (req, res) => {
  try {
    const influencerProfile = await InfluencerProfile.findOne({
      user: req.user._id,
    });

    if (!influencerProfile) {
      return res.status(404).json({
        success: false,
        message: "Influencer profile not found",
      });
    }

    const applications = await CampaignApplication.find({
      influencer: influencerProfile._id,
    })
      .populate("campaign", "title category budget status applicationDeadline")
      .populate("campaign.brand", "brandName logo")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    console.error("Get my applications error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get your applications",
    });
  }
};

// Get applications for a brand's campaign
const getCampaignApplications = async (req, res) => {
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

    const campaign = await Campaign.findOne({
      _id: req.params.id,
      brand: brandProfile._id,
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    const applications = await CampaignApplication.find({
      campaign: campaign._id,
    })
      .populate(
        "influencer",
        "displayName bio profileImage location categories followers socialLinks"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    console.error("Get campaign applications error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get campaign applications",
    });
  }
};

// Accept application
const acceptApplication = async (req, res) => {
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

    const application = await CampaignApplication.findById(req.params.id)
      .populate("campaign");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (application.campaign.brand.toString() !== brandProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to manage this application",
      });
    }

    if (application.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending applications can be accepted",
      });
    }

    application.status = "accepted";
    application.reviewedAt = new Date();

    await application.save();

    res.status(200).json({
      success: true,
      message: "Application accepted successfully",
      data: application,
    });
  } catch (error) {
    console.error("Accept application error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to accept application",
    });
  }
};

// Reject application
const rejectApplication = async (req, res) => {
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

    const application = await CampaignApplication.findById(req.params.id)
      .populate("campaign");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (application.campaign.brand.toString() !== brandProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to manage this application",
      });
    }

    if (application.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending applications can be rejected",
      });
    }

    application.status = "rejected";
    application.reviewedAt = new Date();

    await application.save();

    res.status(200).json({
      success: true,
      message: "Application rejected successfully",
      data: application,
    });
  } catch (error) {
    console.error("Reject application error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to reject application",
    });
  }
};

module.exports = {
  applyToCampaign,
  getMyApplications,
  getCampaignApplications,
  acceptApplication,
  rejectApplication,
};