const Badge = require("../../models/mototribe/Badge");
const UserAchievement = require("../../models/mototribe/UserAchievement");
const RiderProfile = require("../../models/mototribe/RiderProfile");

/**
 * Checks a user's RiderProfile stats against all Badge criteria
 * and awards any newly qualified badges atomically.
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {mongoose.ClientSession} [session] Optional session for transaction support
 * @returns {Promise<Array>} Newly awarded achievements
 */
const checkAndAwardBadges = async (userId, session = null) => {
  const sessionOpts = session ? { session } : {};

  // 1. Fetch rider profile
  const profile = await RiderProfile.findOne({ userId }, null, sessionOpts);
  if (!profile) return [];

  // 2. Fetch all badge definitions
  const allBadges = await Badge.find({}, null, sessionOpts);
  if (allBadges.length === 0) return [];

  // 3. Fetch user's existing earned badge keys
  const existingAchievements = await UserAchievement.find(
    { userId },
    null,
    sessionOpts
  );
  const earnedKeysSet = new Set(existingAchievements.map((a) => a.badgeKey));

  const stats = {
    ridesCompleted: profile.totalRidesCompleted || 0,
    totalDistanceKm: profile.totalDistanceKm || 0,
    regionsExplored: Array.isArray(profile.regionsExplored)
      ? profile.regionsExplored.length
      : 0,
    rideGroupsJoined: profile.rideGroupsJoined || 0,
  };

  const newlyAwarded = [];

  for (const badge of allBadges) {
    if (earnedKeysSet.has(badge.key)) continue;

    const userVal = stats[badge.criteriaType] || 0;
    if (userVal >= badge.criteriaValue) {
      try {
        const [achievement] = await UserAchievement.create(
          [
            {
              userId,
              badgeKey: badge.key,
              earnedAt: new Date(),
            },
          ],
          sessionOpts
        );

        newlyAwarded.push(achievement);
        earnedKeysSet.add(badge.key);
      } catch (err) {
        // Handle duplicate key error gracefully if badge was already awarded concurrently
        if (err.code !== 11000) {
          throw err;
        }
      }
    }
  }

  return newlyAwarded;
};

module.exports = {
  checkAndAwardBadges,
};
