const RiderProfile = require("../../models/mototribe/RiderProfile");
const Badge = require("../../models/mototribe/Badge");
const UserAchievement = require("../../models/mototribe/UserAchievement");
const Ride = require("../../models/mototribe/Ride");
const RideParticipant = require("../../models/mototribe/RideParticipant");
const { checkAndAwardBadges } = require("../../services/mototribe/achievementService");

/**
 * @desc    Get logged-in user's Ride Passport (profile stats + earned/unearned achievements)
 * @route   GET /api/mototribe/rider-profile/me/passport
 * @access  Private
 */
const getMyPassport = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Calculate actual verified stats from Ride and RideParticipant
    const organizedRides = await Ride.find({ organizerId: userId });
    const participations = await RideParticipant.find({ userId, status: "confirmed" });
    const participantRideIds = participations.map((p) => p.rideId);
    const participatedRides = await Ride.find({ _id: { $in: participantRideIds } });

    // Combine and deduplicate completed rides
    const completedMap = new Map();
    organizedRides
      .filter((r) => r.status === "completed")
      .forEach((r) => completedMap.set(String(r._id), r));
    participatedRides
      .filter((r) => r.status === "completed")
      .forEach((r) => completedMap.set(String(r._id), r));

    const completedRides = Array.from(completedMap.values());
    const totalRidesCompleted = completedRides.length;
    const totalDistanceKm = Math.round(
      completedRides.reduce((sum, r) => sum + (Number(r.distanceKm) || 0), 0)
    );
    const regionsExplored = [
      ...new Set(completedRides.map((r) => r.destination).filter(Boolean)),
    ];

    // Count all distinct groups/rides joined or organized
    const allRidesMap = new Map();
    organizedRides.forEach((r) => allRidesMap.set(String(r._id), r));
    participatedRides.forEach((r) => allRidesMap.set(String(r._id), r));
    const rideGroupsJoined = allRidesMap.size;
    const routesContributed = organizedRides.length;

    // 2. Upsert user's RiderProfile with actual database metrics
    const existingProfile = await RiderProfile.findOne({ userId });

    const updateFields = {
      totalRidesCompleted: Math.max(
        totalRidesCompleted,
        existingProfile?.totalRidesCompleted || 0
      ),
      totalDistanceKm: Math.max(
        totalDistanceKm,
        existingProfile?.totalDistanceKm || 0
      ),
      regionsExplored: Array.from(
        new Set([...(existingProfile?.regionsExplored || []), ...regionsExplored])
      ),
      rideGroupsJoined: Math.max(
        rideGroupsJoined,
        existingProfile?.rideGroupsJoined || 0
      ),
      routesContributed: Math.max(
        routesContributed,
        existingProfile?.routesContributed || 0
      ),
    };

    const profile = await RiderProfile.findOneAndUpdate(
      { userId },
      { $set: updateFields },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 3. Evaluate and award newly qualified badges atomically
    await checkAndAwardBadges(userId);

    // 4. Fetch all static badge definitions
    const allBadges = await Badge.find().sort({ createdAt: 1 });

    // 5. Fetch earned achievements for this user
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
        profile,
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
