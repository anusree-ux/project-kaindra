const BrandProfile = require("../../../models/modasphere/modainfluence/BrandProfile");

// Create brand profile
const createBrandProfile = async (req, res) => {
  try {
    const existingProfile = await BrandProfile.findOne({
      user: req.user._id,
    });

    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: "Brand profile already exists",
      });
    }

    const profile = await BrandProfile.create({
      user: req.user._id,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      message: "Brand profile created successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Create brand profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create brand profile",
    });
  }
};

// Get own brand profile
const getBrandProfile = async (req, res) => {
  try {
    const profile = await BrandProfile.findOne({
      user: req.user._id,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Brand profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Get brand profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get brand profile",
    });
  }
};

// Update own brand profile
const updateBrandProfile = async (req, res) => {
  try {
    const profile = await BrandProfile.findOne({
      user: req.user._id,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Brand profile not found",
      });
    }

    Object.assign(profile, req.body);

    await profile.save();

    res.status(200).json({
      success: true,
      message: "Brand profile updated successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Update brand profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update brand profile",
    });
  }
};

module.exports = {
  createBrandProfile,
  getBrandProfile,
  updateBrandProfile,
};