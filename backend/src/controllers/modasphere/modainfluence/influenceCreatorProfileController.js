const InfluenceCreatorProfile = require(
  "../../../models/modasphere/modainfluence/InfluenceCreatorProfile"
);

const User = require("../../../models/core/User");

const InfluenceCampaignApplication = require(
  "../../../models/modasphere/modainfluence/InfluenceCampaignApplication"
);

const profileFields = [
  "displayName",
  "contactEmail",
  "phoneNumber",
  "category",
  "bio",
  "website",
  "socialLinks",
];

const getMyCreatorProfile = async (req, res) => {
  try {
    const profile = await InfluenceCreatorProfile.findOne({ owner: req.user._id });
    return res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error("Get influencer profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load your influencer profile.",
    });
  }
};

const createCreatorProfile = async (req, res) => {
  try {
    const existing = await InfluenceCreatorProfile.findOne({ owner: req.user._id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You already have an influencer profile. Update it instead.",
        data: existing,
      });
    }

    const profileData = { owner: req.user._id };
    for (const field of profileFields) {
      if (req.body[field] !== undefined) profileData[field] = req.body[field];
    }

    const profile = await InfluenceCreatorProfile.create(profileData);
    return res.status(201).json({
      success: true,
      message: "Influencer profile created successfully.",
      data: profile,
    });
  } catch (error) {
    console.error("Create influencer profile error:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An influencer profile already exists for this account.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to create your influencer profile.",
    });
  }
};

const updateCreatorProfile = async (req, res) => {
  try {
    const updates = {};
    for (const field of profileFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    if (!Object.keys(updates).length) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one influencer profile field to update.",
      });
    }

    const profile = await InfluenceCreatorProfile.findOneAndUpdate(
      { owner: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Influencer profile not found. Create one first.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Influencer profile updated successfully.",
      data: profile,
    });
  } catch (error) {
    console.error("Update influencer profile error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to update your influencer profile.",
    });
  }
};

const deleteCreatorProfile = async (req, res) => {
  try {
    const profile = await InfluenceCreatorProfile.findOne({
      owner: req.user._id,
    }).select("_id");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Influencer profile not found.",
      });
    }

    // Keep every application record, but remove identifying profile details.
    await InfluenceCampaignApplication.updateMany(
      { influencerProfile: profile._id },
      {
        $set: {
          influencerSnapshot: {
            displayName: "Deleted influencer",
            category: "",
            bio: "",
            website: "",
            socialLinks: {
              instagram: "",
              tiktok: "",
              youtube: "",
            },
          },
        },
      }
    );

    // Delete only the profile owned by the authenticated user.
    const deletion = await InfluenceCreatorProfile.deleteOne({
      _id: profile._id,
      owner: req.user._id,
    });

    if (deletion.deletedCount !== 1) {
      return res.status(409).json({
        success: false,
        message: "The profile could not be deleted. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Influencer profile deleted. Campaign application history has been retained.",
    });
  } catch (error) {
    console.error("Delete influencer profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete your influencer profile.",
    });
  }
};

const getAllCreatorProfilesForAdmin = async (req, res) => {
  try {
    const profiles = await InfluenceCreatorProfile.find()
      .sort({ createdAt: -1 })
      .populate("owner", "name email avatar modaInfluenceStatus")
      .lean();

    const data = await Promise.all(
      profiles.map(async (profile) => {
        const applications = await InfluenceCampaignApplication.find({
          influencerProfile: profile._id,
          deletedAt: { $exists: false },
        })
          .sort({ createdAt: -1 })
          .populate("campaign", "brand title campaignType")
          .lean();

        return {
          ...profile,
          applicationCount: applications.length,
          applications: applications.map((application) => ({
            _id: application._id,
            status: application.status,
            createdAt: application.createdAt,
            campaign: application.campaign
              ? {
                  brand: application.campaign.brand,
                  title:
                    application.campaign.title ||
                    application.campaign.campaignType,
                  campaignType: application.campaign.campaignType,
                }
              : null,
          })),
          status: profile.owner?.modaInfluenceStatus || "Active",
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Admin get influencers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load influencers.",
    });
  }
};

const updateCreatorAccountStatus = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { status } = req.body;

    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Active or Inactive.",
      });
    }

    const profile = await InfluenceCreatorProfile.findById(profileId)
      .select("owner");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Influencer profile not found.",
      });
    }

    const user = await User.findByIdAndUpdate(
      profile.owner,
      { $set: { modaInfluenceStatus: status } },
      { new: true, runValidators: true }
    ).select("_id modaInfluenceStatus");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Influencer account not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        status === "Inactive"
          ? "Influencer account placed on hold."
          : "Influencer account reactivated.",
      data: { status: user.modaInfluenceStatus },
    });
  } catch (error) {
    console.error("Admin update influencer status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update influencer status.",
    });
  }
};

module.exports = {
  getMyCreatorProfile,
  createCreatorProfile,
  updateCreatorProfile,
  deleteCreatorProfile,
  getAllCreatorProfilesForAdmin,
  updateCreatorAccountStatus, 
};
