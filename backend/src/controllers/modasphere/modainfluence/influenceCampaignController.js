const InfluenceCampaign = require(
  "../../../models/modasphere/modainfluence/InfluenceCampaign"
);
const InfluenceBrandProfile = require(
  "../../../models/modasphere/modainfluence/InfluenceBrandProfile"
);
const { randomUUID } = require("crypto");

// =========================================
// CREATE CAMPAIGN REQUEST
// =========================================

const createCampaign = async (req, res) => {
  try {
    let brandProfileId = null;
    let brand = req.body.brand;
    let email = req.body.email;

    if (req.user?._id) {
      const InfluenceBrandProfile = require(
        "../../../models/modasphere/modainfluence/InfluenceBrandProfile"
      );

      const brandProfile = await InfluenceBrandProfile.findOne({
        owner: req.user._id,
      });

      if (!brandProfile) {
        return res.status(404).json({
          success: false,
          message: "Please create your brand profile before submitting a campaign.",
        });
      }

      brandProfileId = brandProfile._id;
      brand = brandProfile.brandName;
      email = brandProfile.contactEmail;
    }

    const campaign = await InfluenceCampaign.create({
      brandProfile: brandProfileId,
      brand,
      email,
      title: req.body.title,
      campaignType: req.body.campaignType,
      message: req.body.message,
    });

    return res.status(201).json({
      success: true,
      message: "Campaign request submitted successfully",
      data: campaign,
    });
  } catch (error) {
    console.error("Create influence campaign error:", error);

    return res.status(500).json({
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
      data: campaigns.map((campaign) => ({
        ...campaign.toObject(),
        title: campaign.title || campaign.campaignType,
      })),
    });
  } catch (error) {
    console.error("Get influence campaigns error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load campaign requests",
    });
  }
};

// Brand-linked campaigns are public when their owner has enabled visibility.
const getPublicCampaigns = async (req, res) => {
  try {
    const campaigns = await InfluenceCampaign.find({
      brandProfile: { $ne: null },
      isPublic: true,
    })
      .select("publicId brand title campaignType message createdAt")
      .sort({ createdAt: -1 })
      .lean();
    const data = await Promise.all(campaigns.map(async (campaign) => {
      if (!campaign.publicId) {
        const publicId = randomUUID();
        const migrated = await InfluenceCampaign.findOneAndUpdate(
          { _id: campaign._id, publicId: { $exists: false } },
          { $set: { publicId } },
          { new: true }
        ).select("publicId").lean();
        campaign.publicId = migrated?.publicId || (await InfluenceCampaign.findById(campaign._id).select("publicId").lean())?.publicId;
      }
      return {
        publicId: campaign.publicId,
        brand: campaign.brand,
        title: campaign.title || campaign.campaignType,
        campaignType: campaign.campaignType,
        message: campaign.message,
        createdAt: campaign.createdAt,
      };
    }));
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Get public influence campaigns error:", error);
    return res.status(500).json({ success: false, message: "Failed to load public campaigns" });
  }
};

const getPublicCampaignById = async (req, res) => {
  try {
    if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid campaign reference." });
    }
    const campaign = await InfluenceCampaign.findOne({
      publicId: req.params.id,
      brandProfile: { $ne: null },
      isPublic: true,
    }).select("publicId brand title campaignType message createdAt").lean();
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found." });
    }
    return res.status(200).json({
      success: true,
      data: {
        publicId: campaign.publicId,
        brand: campaign.brand,
        title: campaign.title || campaign.campaignType,
        campaignType: campaign.campaignType,
        message: campaign.message,
        createdAt: campaign.createdAt,
      },
    });
  } catch (error) {
    console.error("Get public influence campaign error:", error);
    return res.status(500).json({ success: false, message: "Failed to load campaign." });
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
      data: {
        ...campaign.toObject(),
        title: campaign.title || campaign.campaignType,
      },
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


const getMyBrandCampaigns = async (req, res) => {
  try {
    const brandProfile = await InfluenceBrandProfile.findOne({
      owner: req.user._id,
    });

    if (!brandProfile) {
      return res.status(404).json({
        success: false,
        message: "Brand profile not found",
      });
    }

    const campaigns = await InfluenceCampaign.find({
      brandProfile: brandProfile._id,
    }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns.map((campaign) => ({
        ...campaign,
        title: campaign.title || campaign.campaignType,
      })),
    });
  } catch (error) {
    console.error("Get brand campaigns error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load brand campaigns",
    });
  }
};

const updateMyBrandCampaign = async (req, res) => {
  try {
    if (!InfluenceCampaign.base.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID.",
      });
    }

    const brandProfile = await InfluenceBrandProfile.findOne({
      owner: req.user._id,
    }).select("_id");

    if (!brandProfile) {
      return res.status(404).json({
        success: false,
        message: "Brand profile not found.",
      });
    }

    const updates = {};
    for (const field of ["brand", "email", "title", "campaignType", "message"]) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    const campaign = await InfluenceCampaign.findOneAndUpdate(
      { _id: req.params.id, brandProfile: brandProfile._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found for this brand.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Campaign updated successfully.",
      data: campaign,
    });
  } catch (error) {
    console.error("Update brand campaign error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update campaign.",
    });
  }
};

const deleteMyBrandCampaign = async (req, res) => {
  try {
    if (!InfluenceCampaign.base.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID.",
      });
    }

    const brandProfile = await InfluenceBrandProfile.findOne({
      owner: req.user._id,
    }).select("_id");

    if (!brandProfile) {
      return res.status(404).json({
        success: false,
        message: "Brand profile not found.",
      });
    }

    const campaign = await InfluenceCampaign.findOneAndDelete({
      _id: req.params.id,
      brandProfile: brandProfile._id,
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found for this brand.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Campaign deleted successfully.",
      data: campaign,
    });
  } catch (error) {
    console.error("Delete brand campaign error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete campaign.",
    });
  }
};

const updateMyBrandCampaignVisibility = async (req, res) => {
  try {
    if (!InfluenceCampaign.base.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid campaign ID." });
    }
    if (typeof req.body.isPublic !== "boolean") {
      return res.status(400).json({ success: false, message: "isPublic must be true or false." });
    }
    const brandProfile = await InfluenceBrandProfile.findOne({ owner: req.user._id }).select("_id");
    if (!brandProfile) return res.status(404).json({ success: false, message: "Brand profile not found." });
    const campaign = await InfluenceCampaign.findOneAndUpdate(
      { _id: req.params.id, brandProfile: brandProfile._id },
      { $set: { isPublic: req.body.isPublic } },
      { new: true, runValidators: true }
    ).select("_id isPublic");
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found for this brand." });
    return res.status(200).json({
      success: true,
      message: "Campaign visibility updated.",
      data: { isPublic: campaign.isPublic },
    });
  } catch (error) {
    console.error("Update brand campaign visibility error:", error);
    return res.status(500).json({ success: false, message: "Failed to update campaign visibility." });
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  getPublicCampaigns,
  getPublicCampaignById,
  getCampaignById,
  deleteCampaign,
  getMyBrandCampaigns,
  updateMyBrandCampaign,
  deleteMyBrandCampaign,
  updateMyBrandCampaignVisibility,
};
