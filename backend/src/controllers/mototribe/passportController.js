const RiderProfile = require("../../models/mototribe/RiderProfile");
const Badge = require("../../models/mototribe/Badge");
const UserAchievement = require("../../models/mototribe/UserAchievement");
const AppError = require("../../utils/AppError");

/**
 * @desc    Get logged-in user's Ride Passport (profile stats + earned/unearned achievements)
 * @route   GET /api/mototribe/rider-profile/me/passport
 * @access  Private
 */
const getMyPassport = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch user's RiderProfile (if present)
    const profile = await RiderProfile.findOne({ userId });

    // Fetch all static badge definitions
    const allBadges = await Badge.find().sort({ createdAt: 1 });

    // Fetch earned achievements for this user
    const userAchievements = await UserAchievement.find({ userId });

    const earnedMap = new Map();
    userAchievements.forEach((ach) => {
      earnedMap.set(ach.badgeKey, ach.earnedAt);
    });

    const earnedBadges = [];
    const unearnedBadges = [];

    allBadges.forEach((badge) => {
      if (earnedMap.has(badge.key)) {
        earnedBadges.push({
          key: badge.key,
          name: badge.name,
          description: badge.description,
          criteriaType: badge.criteriaType,
          criteriaValue: badge.criteriaValue,
          earnedAt: earnedMap.get(badge.key),
        });
      } else {
        unearnedBadges.push({
          key: badge.key,
          name: badge.name,
          description: badge.description,
          criteriaType: badge.criteriaType,
          criteriaValue: badge.criteriaValue,
        });
      }
    });

    res.status(200).json({
      status: "success",
      data: {
        profile: profile || null,
        earnedBadges,
        unearnedBadges,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyPassport,
};
