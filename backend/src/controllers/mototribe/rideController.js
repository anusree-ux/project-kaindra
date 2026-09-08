const mongoose = require("mongoose");
const RiderProfile = require("../../models/mototribe/RiderProfile");
const Ride = require("../../models/mototribe/Ride");
const RideParticipant = require("../../models/mototribe/RideParticipant");
const LiveLocation = require("../../models/mototribe/LiveLocation");
const AppError = require("../../utils/AppError");
const { checkAndAwardBadges } = require("../../services/mototribe/achievementService");

/**
 * @desc    Create or update logged-in user's rider profile
 * @route   POST /api/mototribe/rider-profile
 * @access  Private
 */
const upsertRiderProfile = async (req, res, next) => {
  try {
    const {
      vehicleNumber,
      vehicleType,
      bikeModel,
      emergencyContactNumber,
    } = req.body;

    const profileFields = {
      userId: req.user._id,
      vehicleNumber,
      ...(vehicleType && { vehicleType }),
      ...(bikeModel && { bikeModel }),
      ...(emergencyContactNumber && { emergencyContactNumber }),
    };

    const profile = await RiderProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: profileFields },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      data: {
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get logged-in user's rider profile
 * @route   GET /api/mototribe/rider-profile/me
 * @access  Private
 */
const getMeRiderProfile = async (req, res, next) => {
  try {
    const profile = await RiderProfile.findOne({ userId: req.user._id }).populate(
      "userId",
      "name email role"
    );

    if (!profile) {
      return next(
        new AppError("Rider profile not found for the current user.", 404)
      );
    }

    res.status(200).json({
      status: "success",
      data: {
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get logged-in user's completed ride history
 * @route   GET /api/mototribe/rider-profile/me/history
 * @access  Private
 */
const getMyRideHistory = async (req, res, next) => {
  try {
    const participantRecords = await RideParticipant.find({
      userId: req.user._id,
      status: "confirmed",
    }).populate({
      path: "rideId",
      populate: { path: "organizerId", select: "name email" },
    });

    const completedRides = participantRecords
      .filter(
        (record) => record.rideId && record.rideId.status === "completed"
      )
      .map((record) => record.rideId)
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    res.status(200).json({
      status: "success",
      results: completedRides.length,
      data: {
        rides: completedRides,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new ride
 * @route   POST /api/mototribe/rides
 * @access  Private
 */
const createRide = async (req, res, next) => {
  try {
    const {
      title,
      origin,
      destination,
      startDate,
      durationDays,
      distanceKm,
      budget,
    } = req.body;

    const newRide = await Ride.create({
      organizerId: req.user._id,
      title,
      origin,
      destination,
      startDate,
      durationDays: durationDays || 1,
      distanceKm,
      budget: budget || 0,
      status: "planning",
    });

    // Automatically add organizer as confirmed participant
    await RideParticipant.create({
      rideId: newRide._id,
      userId: req.user._id,
      status: "confirmed",
    });

    // Safely increment routesContributed and rideGroupsJoined for organizer (without upsert)
    await RiderProfile.updateOne(
      { userId: req.user._id },
      { $inc: { routesContributed: 1, rideGroupsJoined: 1 } }
    );
    await checkAndAwardBadges(req.user._id);

    res.status(201).json({
      status: "success",
      data: {
        ride: newRide,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all upcoming rides (status = planning or ongoing)
 * @route   GET /api/mototribe/rides
 * @access  Private
 */
const getUpcomingRides = async (req, res, next) => {
  try {
    const rides = await Ride.find({
      status: { $in: ["planning", "ongoing"] },
    })
      .populate("organizerId", "name email")
      .sort({ startDate: 1 });

    res.status(200).json({
      status: "success",
      results: rides.length,
      data: {
        rides,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single ride details with participant count
 * @route   GET /api/mototribe/rides/:id
 * @access  Private
 */
const getRideDetails = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id).populate(
      "organizerId",
      "name email"
    );

    if (!ride) {
      return next(new AppError("Ride not found.", 404));
    }

    const participantCount = await RideParticipant.countDocuments({
      rideId: ride._id,
      status: { $ne: "left" },
    });

    res.status(200).json({
      status: "success",
      data: {
        ride,
        participantCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Join a ride
 * @route   POST /api/mototribe/rides/:id/join
 * @access  Private
 */
const joinRide = async (req, res, next) => {
  try {
    const rideId = req.params.id;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return next(new AppError("Ride not found.", 404));
    }

    if (ride.status === "completed" || ride.status === "cancelled") {
      return next(
        new AppError(`Cannot join a ride that is ${ride.status}.`, 400)
      );
    }

    // Check existing participant status
    const existingParticipant = await RideParticipant.findOne({
      rideId,
      userId: req.user._id,
    });

    if (existingParticipant) {
      if (existingParticipant.status !== "left") {
        return next(
          new AppError("You have already joined this ride.", 400)
        );
      }
      // Re-join if user previously left
      existingParticipant.status = "planning";
      existingParticipant.joinedAt = new Date();
      await existingParticipant.save();

      return res.status(200).json({
        status: "success",
        message: "Successfully rejoined the ride.",
        data: {
          participant: existingParticipant,
        },
      });
    }

    const participant = await RideParticipant.create({
      rideId,
      userId: req.user._id,
      status: "planning",
    });

    res.status(201).json({
      status: "success",
      message: "Successfully joined the ride.",
      data: {
        participant,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError("You have already joined this ride.", 400));
    }
    next(error);
  }
};

/**
 * @desc    Get all participants of a ride
 * @route   GET /api/mototribe/rides/:id/participants
 * @access  Private
 */
const getRideParticipants = async (req, res, next) => {
  try {
    const rideId = req.params.id;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return next(new AppError("Ride not found.", 404));
    }

    const participants = await RideParticipant.find({
      rideId,
      status: { $ne: "left" },
    })
      .populate("userId", "name email role")
      .sort({ joinedAt: 1 });

    res.status(200).json({
      status: "success",
      results: participants.length,
      data: {
        participants,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Start a ride (planning -> ongoing) - Organizer only
 * @route   PATCH /api/mototribe/rides/:id/start
 * @access  Private (Organizer)
 */
const startRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return next(new AppError("Ride not found.", 404));
    }

    if (ride.organizerId.toString() !== req.user._id.toString()) {
      return next(
        new AppError("Only the organizer can start this ride.", 403)
      );
    }

    if (ride.status !== "planning") {
      return next(
        new AppError(
          `Cannot start ride. Current status is '${ride.status}' (expected 'planning').`,
          400
        )
      );
    }

    ride.status = "ongoing";
    await ride.save();

    res.status(200).json({
      status: "success",
      message: "Ride started successfully.",
      data: {
        ride,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to update ride completion & rider profile stats
 */
const executeCompleteRideOps = async (ride, sessionOpts = {}) => {
  ride.status = "completed";
  await ride.save(sessionOpts);

  const confirmedParticipants = await RideParticipant.find(
    { rideId: ride._id, status: "confirmed" },
    null,
    sessionOpts
  );

  const userIds = confirmedParticipants.map((p) => p.userId);
  let updatedProfilesCount = 0;

  if (userIds.length > 0) {
    const updateResult = await RiderProfile.updateMany(
      { userId: { $in: userIds } },
      {
        $inc: {
          totalRidesCompleted: 1,
          totalDistanceKm: ride.distanceKm,
        },
        $addToSet: {
          regionsExplored: ride.destination,
        },
      },
      sessionOpts
    );
    updatedProfilesCount = updateResult.modifiedCount || updateResult.nModified || 0;

    for (const uId of userIds) {
      await checkAndAwardBadges(uId, sessionOpts.session);
    }
  }

  return { confirmedCount: userIds.length, updatedProfilesCount };
};

/**
 * @desc    Complete a ride & update confirmed participants' rider profiles (ongoing -> completed) - Organizer only
 * @route   PATCH /api/mototribe/rides/:id/complete
 * @access  Private (Organizer)
 */
const completeRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return next(new AppError("Ride not found.", 404));
    }

    if (ride.organizerId.toString() !== req.user._id.toString()) {
      return next(
        new AppError("Only the organizer can mark this ride as completed.", 403)
      );
    }

    if (ride.status !== "ongoing") {
      return next(
        new AppError(
          `Cannot complete ride. Current status is '${ride.status}' (expected 'ongoing').`,
          400
        )
      );
    }

    let result;
    let session = null;

    try {
      session = await mongoose.startSession();
      session.startTransaction();

      result = await executeCompleteRideOps(ride, { session });

      await session.commitTransaction();
      session.endSession();
    } catch (txnError) {
      if (session) {
        try {
          await session.abortTransaction();
          session.endSession();
        } catch (abortErr) {}
      }

      result = await executeCompleteRideOps(ride);
    }

    res.status(200).json({
      status: "success",
      message: "Ride completed successfully and rider stats updated.",
      data: {
        ride,
        confirmedParticipantsCount: result.confirmedCount,
        updatedProfilesCount: result.updatedProfilesCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a ride (planning or ongoing -> cancelled) - Organizer only
 * @route   PATCH /api/mototribe/rides/:id/cancel
 * @access  Private (Organizer)
 */
const cancelRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return next(new AppError("Ride not found.", 404));
    }

    if (ride.organizerId.toString() !== req.user._id.toString()) {
      return next(
        new AppError("Only the organizer can cancel this ride.", 403)
      );
    }

    if (ride.status !== "planning" && ride.status !== "ongoing") {
      return next(
        new AppError(
          `Cannot cancel ride. Current status is '${ride.status}' (only 'planning' or 'ongoing' rides can be cancelled).`,
          400
        )
      );
    }

    ride.status = "cancelled";
    await ride.save();

    res.status(200).json({
      status: "success",
      message: "Ride cancelled successfully.",
      data: {
        ride,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Confirm a participant (planning -> confirmed) - Organizer only
 * @route   PATCH /api/mototribe/rides/:id/participants/:userId/confirm
 * @access  Private (Organizer)
 */
const confirmParticipant = async (req, res, next) => {
  try {
    const { id: rideId, userId } = req.params;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return next(new AppError("Ride not found.", 404));
    }

    if (ride.organizerId.toString() !== req.user._id.toString()) {
      return next(
        new AppError(
          "Only the organizer can confirm participants for this ride.",
          403
        )
      );
    }

    const participant = await RideParticipant.findOne({ rideId, userId });
    if (!participant) {
      return next(
        new AppError("Participant record not found for this ride.", 404)
      );
    }

    if (participant.status === "confirmed") {
      return res.status(200).json({
        status: "success",
        message: "Participant is already confirmed.",
        data: {
          participant,
        },
      });
    }

    participant.status = "confirmed";
    await participant.save();

    // Safely increment rideGroupsJoined for confirmed participant (without upsert)
    await RiderProfile.updateOne(
      { userId: participant.userId },
      { $inc: { rideGroupsJoined: 1 } }
    );
    await checkAndAwardBadges(participant.userId);

    res.status(200).json({
      status: "success",
      message: "Participant confirmed successfully.",
      data: {
        participant,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get latest live locations of all participants for a ride (REST fallback)
 * @route   GET /api/mototribe/rides/:id/live-locations
 * @access  Private (Confirmed participants & Organizer)
 */
const getLiveLocations = async (req, res, next) => {
  try {
    const rideId = req.params.id;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return next(new AppError("Ride not found.", 404));
    }

    const isOrganizer =
      ride.organizerId.toString() === req.user._id.toString();

    const participant = await RideParticipant.findOne({
      rideId,
      userId: req.user._id,
      status: "confirmed",
    });

    if (!isOrganizer && !participant) {
      return next(
        new AppError(
          "You must be a confirmed participant or organizer of this ride to view live locations.",
          403
        )
      );
    }

    const locations = await LiveLocation.find({ rideId }).populate(
      "userId",
      "name email"
    );

    res.status(200).json({
      status: "success",
      results: locations.length,
      data: {
        locations,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upsertRiderProfile,
  getMeRiderProfile,
  getMyRideHistory,
  createRide,
  getUpcomingRides,
  getRideDetails,
  joinRide,
  getRideParticipants,
  startRide,
  completeRide,
  cancelRide,
  confirmParticipant,
  getLiveLocations,
};
