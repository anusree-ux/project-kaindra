const RiderProfile = require("../../models/mototribe/RiderProfile");
const UserAchievement = require("../../models/mototribe/UserAchievement");
const User = require("../../models/core/User");

/**
 * Calculates a 0-100 Rider Trust Score based on profile metrics, achievements, and account age.
 * 
 * Formula Breakdown:
 * ------------------
 * 1. Base Score           : 10 points (guaranteed baseline for registered riders)
 * 2. Rides Completed Score: min(totalRidesCompleted * 5, 30)   -> Max 30 points
 * 3. Distance Score       : min(totalDistanceKm / 100, 30)    -> Max 30 points (1 pt per 100km)
 * 4. Badges Score         : min(earnedBadgeCount * 5, 20)    -> Max 20 points
 * 5. Account Age Score    : min(floor(ageDays / 30) * 2, 10)  -> Max 10 points (2 pts per 30 days)
 * 
 * Total Maximum Score     : 10 + 30 + 30 + 20 + 10 = 100 points
 * 
 * @param {string|ObjectId} userId
 * @returns {Promise<number>} Trust score between 0 and 100
 */
const calculateTrustScore = async (userId) => {
  if (!userId) return 0;

  // 1. Fetch RiderProfile (or default to 0 metrics)
  const profile = await RiderProfile.findOne({ userId });
  const ridesCompleted = profile ? profile.totalRidesCompleted || 0 : 0;
  const distanceKm = profile ? profile.totalDistanceKm || 0 : 0;

  // 2. Fetch Earned Badges Count
  const badgeCount = await UserAchievement.countDocuments({ userId });

  // 3. Fetch User Account Creation Date
  const user = await User.findById(userId).select("createdAt");
  const createdAt = user ? user.createdAt : new Date();

  // Component calculations
  const baseScore = 10;
  const ridesScore = Math.min(ridesCompleted * 5, 30);
  const distanceScore = Math.min(Math.floor(distanceKm / 100), 30);
  const badgeScore = Math.min(badgeCount * 5, 20);

  const ageDays = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const ageScore = Math.min(Math.floor(ageDays / 30) * 2, 10);

  const totalRaw = baseScore + ridesScore + distanceScore + badgeScore + ageScore;
  const finalScore = Math.min(100, Math.max(0, Math.round(totalRaw)));

  return finalScore;
};

module.exports = {
  calculateTrustScore,
};
