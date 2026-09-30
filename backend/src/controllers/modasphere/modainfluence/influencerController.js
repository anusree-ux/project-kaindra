const InfluencerProfile = require("../../../models/modasphere/modainfluence/InfluencerProfile");

// Create influencer profile
const createInfluencerProfile = async (req, res) => {
  try {
    const existingProfile = await InfluencerProfile.findOne({
      user: req.user._id,
    });

    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: "Influencer profile already exists",
      });
    }

    const profile = await InfluencerProfile.create({
      user: req.user._id,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      message: "Influencer profile created successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Create influencer profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create influencer profile",
    });
  }
};

// Get own influencer profile
const getInfluencerProfile = async (req, res) => {
  try {
    const profile = await InfluencerProfile.findOne({
      user: req.user._id,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Influencer profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Get influencer profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get influencer profile",
    });
  }
};

// Update own influencer profile
const updateInfluencerProfile = async (req, res) => {
  try {
    const profile = await InfluencerProfile.findOne({
      user: req.user._id,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Influencer profile not found",
      });
    }

    Object.assign(profile, req.body);

    await profile.save();

    res.status(200).json({
      success: true,
      message: "Influencer profile updated successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Update influencer profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update influencer profile",
    });
  }
};

module.exports = {
  createInfluencerProfile,
  getInfluencerProfile,
  updateInfluencerProfile,
};