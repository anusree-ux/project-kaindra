const RiderPresence = require("../../models/mototribe/RiderPresence");
const RiderProfile = require("../../models/mototribe/RiderProfile");
const ConnectionRequest = require("../../models/core/ConnectionRequest");
const User = require("../../models/core/User");
const Vehicle = require("../../models/mototribe/Vehicle");
const Ride = require("../../models/mototribe/Ride");
const RideParticipant = require("../../models/mototribe/RideParticipant");
const { calculateTrustScore } = require("../../services/mototribe/trustScoreService");
const AppError = require("../../utils/AppError");

/**
 * Helper to compute distance between two lat/lng coordinates in km using Haversine formula
 */
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

/**
 * Helper to fetch a rider's active ongoing journey if present
 */
const getActiveOngoingJourney = async (userId) => {
  // 1. Check if user is organizer of an ongoing ride
  const organizedRide = await Ride.findOne({
    organizerId: userId,
    status: "ongoing",
  });
  if (organizedRide) {
    return {
      rideId: organizedRide._id,
      title: organizedRide.title,
      origin: organizedRide.origin,
      destination: organizedRide.destination,
    };
  }

  // 2. Check if user is a confirmed participant in an ongoing ride
  const participant = await RideParticipant.findOne({
    userId,
    status: "confirmed",
  }).populate("rideId");

  if (participant && participant.rideId && participant.rideId.status === "ongoing") {
    return {
      rideId: participant.rideId._id,
      title: participant.rideId.title,
      origin: participant.rideId.origin,
      destination: participant.rideId.destination,
    };
  }

  return null;
};

/**
 * @desc    Upsert rider presence (location, status, visibility)
 * @route   POST /api/mototribe/presence
 * @access  Private (JWT Protected)
 */
const postPresence = async (req, res, next) => {
  try {
    const { latitude, longitude, status, visibility } = req.body;

    const latNum = Number(latitude);
    const lngNum = Number(longitude);

    if (
      latitude === undefined ||
      longitude === undefined ||
      isNaN(latNum) ||
      isNaN(lngNum) ||
      latNum < -90 ||
      latNum > 90 ||
      lngNum < -180 ||
      lngNum > 180
    ) {
      return next(
        new AppError(
          "Valid latitude (-90 to 90) and longitude (-180 to 180) coordinates are required.",
          400
        )
      );
    }

    const updateData = {
      location: {
        type: "Point",
        coordinates: [lngNum, latNum],
      },
      updatedAt: new Date(),
    };

    if (status) {
      if (!["riding", "idle"].includes(status)) {
        return next(new AppError("Status must be either 'riding' or 'idle'.", 400));
      }
      updateData.status = status;
    }

    if (visibility) {
      if (!["private", "connections", "community"].includes(visibility)) {
        return next(
          new AppError(
            "Visibility must be 'private', 'connections', or 'community'.",
            400
          )
        );
      }
      updateData.visibility = visibility;
    }

    const presence = await RiderPresence.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      message: "Rider presence updated successfully.",
      data: {
        presence,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove rider presence (opt-out / going offline)
 * @route   DELETE /api/mototribe/presence
 * @access  Private (JWT Protected)
 */
const deletePresence = async (req, res, next) => {
  try {
    await RiderPresence.findOneAndDelete({ userId: req.user._id });

    res.status(200).json({
      status: "success",
      message: "Rider presence removed (went offline).",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Geospatial discovery query for nearby riders
 * @route   GET /api/mototribe/riders-nearby?lat=X&lng=Y&radius=10000&filter=all|riding_now|adventure|touring
 * @access  Private (JWT Protected)
 */
const getRidersNearby = async (req, res, next) => {
  try {
    const { lat, lng, radius, filter } = req.query;

    const reqLat = Number(lat);
    const reqLng = Number(lng);

    if (isNaN(reqLat) || isNaN(reqLng)) {
      return next(
        new AppError(
          "Query parameters 'lat' and 'lng' are required numbers.",
          400
        )
      );
    }

    const maxDistanceMeters = Number(radius) || 10000;
    const filterType = filter || "all";

    // 1. Perform geospatial query on RiderPresence (exclude self & private visibility docs)
    const nearbyPresences = await RiderPresence.find({
      userId: { $ne: req.user._id },
      visibility: { $in: ["community", "connections"] },
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [reqLng, reqLat],
          },
          $maxDistance: maxDistanceMeters,
        },
      },
    });

    const ridersList = [];

    for (const presence of nearbyPresences) {
      const targetUserId = presence.userId;

      // 2. Check visibility restrictions
      if (presence.visibility === "private") {
        continue;
      }

      if (presence.visibility === "connections") {
        const isConnected = await ConnectionRequest.findOne({
          status: "accepted",
          $or: [
            { fromUserId: req.user._id, toUserId: targetUserId },
            { fromUserId: targetUserId, toUserId: req.user._id },
          ],
        });
        if (!isConnected) {
          continue; // Hidden from non-connected requester
        }
      }

      // 3. Fetch RiderProfile for preferences & stats
      const profile = await RiderProfile.findOne({ userId: targetUserId });

      // 4. Apply filter criteria
      if (filterType === "riding_now" && presence.status !== "riding") {
        continue;
      }
      if (filterType === "adventure" && profile?.preferredRideType !== "adventure") {
        continue;
      }
      if (filterType === "touring" && profile?.preferredRideType !== "touring") {
        continue;
      }

      // 5. Fetch User name
      const user = await User.findById(targetUserId).select("name");
      if (!user || !user.name) {
        // Clean up orphaned presence record in the background
        RiderPresence.deleteOne({ _id: presence._id }).catch(() => {});
        continue;
      }

      // 6. Calculate Trust Score
      const trustScore = await calculateTrustScore(targetUserId);

      // 7. Fetch Primary / Default Vehicle
      const defaultVehicle =
        (await Vehicle.findOne({ userId: targetUserId, isDefault: true })) ||
        (await Vehicle.findOne({ userId: targetUserId }));
      const primaryVehicleName = defaultVehicle
        ? defaultVehicle.vehicleName
        : "Rider Bike";

      // 8. Compute distance in km
      const riderLng = presence.location.coordinates[0];
      const riderLat = presence.location.coordinates[1];
      const distanceKm = calculateDistanceKm(reqLat, reqLng, riderLat, riderLng);

      // 9. Fetch current ongoing journey
      const currentJourney = await getActiveOngoingJourney(targetUserId);

      ridersList.push({
        userId: targetUserId,
        name: user ? user.name : "Rider",
        preferredRideType: profile ? profile.preferredRideType : null,
        trustScore,
        primaryVehicleName,
        totalRidesCompleted: profile ? profile.totalRidesCompleted || 0 : 0,
        distanceKm,
        status: presence.status,
        visibility: presence.visibility,
        currentJourney,
      });
    }

    res.status(200).json({
      status: "success",
      results: ridersList.length,
      data: {
        riders: ridersList,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single rider's public profile card
 * @route   GET /api/mototribe/riders/:userId/profile-card
 * @access  Private (JWT Protected)
 */
const getRiderProfileCard = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const requesterIdStr = req.user._id.toString();
    const isSelf = requesterIdStr === targetUserId.toString();

    // 1. Fetch RiderPresence for target user
    const presence = await RiderPresence.findOne({ userId: targetUserId });

    // 2. Enforce Visibility permissions
    if (!isSelf) {
      if (!presence || presence.visibility === "private") {
        return next(
          new AppError("You are not permitted to view this rider's profile.", 403)
        );
      }

      if (presence.visibility === "connections") {
        const isConnected = await ConnectionRequest.findOne({
          status: "accepted",
          $or: [
            { fromUserId: req.user._id, toUserId: targetUserId },
            { fromUserId: targetUserId, toUserId: req.user._id },
          ],
        });

        if (!isConnected) {
          return next(
            new AppError("You are not permitted to view this rider's profile.", 403)
          );
        }
      }
    }

    // 3. Fetch User, RiderProfile, Vehicle, Trust Score, Current Journey
    const user = await User.findById(targetUserId).select("name");
    if (!user) {
      return next(new AppError("Rider not found.", 404));
    }

    const profile = await RiderProfile.findOne({ userId: targetUserId });
    const trustScore = await calculateTrustScore(targetUserId);

    const defaultVehicle =
      (await Vehicle.findOne({ userId: targetUserId, isDefault: true })) ||
      (await Vehicle.findOne({ userId: targetUserId }));
    const primaryVehicleName = defaultVehicle
      ? defaultVehicle.vehicleName
      : "Rider Bike";

    const currentJourney = await getActiveOngoingJourney(targetUserId);

    const profileCard = {
      userId: targetUserId,
      name: user.name,
      preferredRideType: profile ? profile.preferredRideType : null,
      trustScore,
      primaryVehicleName,
      totalRidesCompleted: profile ? profile.totalRidesCompleted || 0 : 0,
      totalDistanceKm: profile ? profile.totalDistanceKm || 0 : 0,
      status: presence ? presence.status : "idle",
      visibility: presence ? presence.visibility : "private",
      currentJourney,
    };

    res.status(200).json({
      status: "success",
      data: {
        profileCard,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  postPresence,
  deletePresence,
  getRidersNearby,
  getRiderProfileCard,
};
