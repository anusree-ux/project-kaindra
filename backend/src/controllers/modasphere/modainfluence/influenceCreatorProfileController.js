const InfluenceCreatorProfile = require(
  "../../../models/modasphere/modainfluence/InfluenceCreatorProfile"
);

const InfluenceCampaignApplication = require(
  "../../../models/modasphere/modainfluence/InfluenceCampaignApplication"
);

const profileFields = [
  "displayName",
  "contactEmail",
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

module.exports = {
  getMyCreatorProfile,
  createCreatorProfile,
  updateCreatorProfile,
  deleteCreatorProfile,
};
