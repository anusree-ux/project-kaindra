const InfluenceBrandProfile = require(
  "../../../models/modasphere/modainfluence/InfluenceBrandProfile"
);

const InfluenceCampaign = require(
  "../../../models/modasphere/modainfluence/InfluenceCampaign"
);

const allowedFields = [
  "brandName",
  "logoUrl",
  "description",
  "website",
  "category",
  "contactEmail",
  "contactPhone",
  "socialLinks",
];

const getMyBrandProfile = async (req, res) => {
  try {
    const profile = await InfluenceBrandProfile.findOne({
      owner: req.user._id,
    });

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Get brand profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load brand profile.",
    });
  }
};

const createBrandProfile = async (req, res) => {
  try {
    const existing = await InfluenceBrandProfile.findOne({
      owner: req.user._id,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You already have a brand profile. Update it instead.",
      });
    }

    const profileData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        profileData[field] = req.body[field];
      }
    }

    profileData.owner = req.user._id;

    const profile = await InfluenceBrandProfile.create(profileData);

    return res.status(201).json({
      success: true,
      message: "Brand profile created successfully.",
      data: profile,
    });
  } catch (error) {
    console.error("Create brand profile error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A brand profile already exists for this account.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create brand profile.",
    });
  }
};

const updateBrandProfile = async (req, res) => {
  try {
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const profile = await InfluenceBrandProfile.findOneAndUpdate(
      { owner: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Brand profile not found. Create one first.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Brand profile updated successfully.",
      data: profile,
    });
  } catch (error) {
    console.error("Update brand profile error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update brand profile.",
    });
  }
};


const getAdminBrandProfiles = async (req, res) => {
  try {
    const brands = await InfluenceBrandProfile.find()
      .populate("owner", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const campaignCounts = await InfluenceCampaign.aggregate([
      {
        $match: {
          brandProfile: {
            $in: brands.map((brand) => brand._id),
          },
        },
      },
      {
        $group: {
          _id: "$brandProfile",
          count: { $sum: 1 },
        },
      },
    ]);

    const countByBrandId = new Map(
      campaignCounts.map((item) => [
        String(item._id),
        item.count,
      ])
    );

    return res.status(200).json({
      success: true,
      count: brands.length,
      data: brands.map((brand) => ({
        ...brand,
        campaignCount: countByBrandId.get(String(brand._id)) || 0,
      })),
    });
  } catch (error) {
    console.error("Admin get brand profiles error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load registered brands.",
    });
  }
};


module.exports = {
  getMyBrandProfile,
  createBrandProfile,
  updateBrandProfile,
  getAdminBrandProfiles,
};