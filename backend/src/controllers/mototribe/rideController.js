const mongoose = require("mongoose");
const User = require("../../models/core/User");
const RiderProfile = require("../../models/mototribe/RiderProfile");
const Vehicle = require("../../models/mototribe/Vehicle");
const Ride = require("../../models/mototribe/Ride");
const RideParticipant = require("../../models/mototribe/RideParticipant");
const LiveLocation = require("../../models/mototribe/LiveLocation");
const Notification = require("../../models/core/Notification");
const AppError = require("../../utils/AppError");
const { checkAndAwardBadges } = require("../../services/mototribe/achievementService");
const { checkAndSendReminders } = require("../../services/mototribe/reminderService");
const { createNotification } = require("../../services/core/notificationService");

/**
 * Format ride object for API responses, applying registration number masking for non-owners
 */
const formatRideForUser = (ride, requestingUserId) => {
  if (!ride) return ride;
  const rideObj = ride.toObject ? ride.toObject() : { ...ride };
  if (rideObj.vehicleId && typeof rideObj.vehicleId === "object") {
    const vehicleDoc = ride.vehicleId.toPublicJSON ? ride.vehicleId : new Vehicle(rideObj.vehicleId);
    rideObj.vehicleId = vehicleDoc.toPublicJSON(requestingUserId);
  }
  return rideObj;
};

/**
 * @desc    Create or update logged-in user's rider profile (emergency contacts)
 * @route   POST /api/mototribe/rider-profile
 * @access  Private
 */
const upsertRiderProfile = async (req, res, next) => {
  try {
    const { emergencyContacts, preferredRideType, name, experience, region } = req.body;

    const profileFields = {
      userId: req.user._id,
      ...(emergencyContacts && { emergencyContacts }),
      ...(preferredRideType && { preferredRideType }),
      ...(region && { regionsExplored: [region] }),
    };

    const profile = await RiderProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: profileFields },
      { new: true, upsert: true, runValidators: true }
    );

    const userUpdate = {
      $addToSet: { brands: "mototribe" },
    };
    if (name && typeof name === "string" && name.trim()) {
      userUpdate.name = name.trim();
    }

    // Explicitly enroll user into the mototribe brand and update profile details
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      userUpdate,
      { new: true }
    ).select("-password -refreshTokens");

    res.status(200).json({
      status: "success",
      data: {
        profile,
        user: updatedUser,
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
      vehicleId,
      title,
      origin,
      destination,
      originLat,
      originLng,
      destLat,
      destLng,
      startDate,
      durationDays,
      distanceKm,
      budget,
    } = req.body;

    let resolvedVehicle = null;
    if (vehicleId && mongoose.Types.ObjectId.isValid(vehicleId)) {
      resolvedVehicle = await Vehicle.findOne({ _id: vehicleId, userId: req.user._id });
    }

    if (!resolvedVehicle) {
      // Find user's default or first vehicle
      resolvedVehicle = await Vehicle.findOne({ userId: req.user._id, isDefault: true }) ||
                        await Vehicle.findOne({ userId: req.user._id });
    }

    if (!resolvedVehicle) {
      // Auto-create a default vehicle for this rider
      resolvedVehicle = await Vehicle.create({
        userId: req.user._id,
        vehicleName: "Royal Enfield Himalayan 450",
        registrationNumber: `KA-01-MT-${Math.floor(1000 + Math.random() * 9000)}`,
        mileageKmpl: 28,
        fuelType: "petrol",
        isDefault: true,
      });
    }


    const newRide = await Ride.create({
      organizerId: req.user._id,
      vehicleId: resolvedVehicle._id,
      title,
      origin,
      destination,
      stops: Array.isArray(req.body.stops) ? req.body.stops.filter((s) => typeof s === "string" && s.trim()) : [],
      originLat: typeof originLat === "number" ? originLat : undefined,
      originLng: typeof originLng === "number" ? originLng : undefined,
      destLat: typeof destLat === "number" ? destLat : undefined,
      destLng: typeof destLng === "number" ? destLng : undefined,
      startDate,
      durationDays: durationDays || 1,
      distanceKm,
      budget: budget || 0,
      maxRiders: Math.max(1, Number(req.body.maxRiders) || 1),
      status: "planning",
    });

    // Compute Journey Intelligence in the background (non-blocking)
    setImmediate(async () => {
      try {
        const { computeRideJourneyIntelligence } = require("../../services/mototribe/placesService");
        const ji = await computeRideJourneyIntelligence({
          origin,
          destination,
          stops: Array.isArray(req.body.stops) ? req.body.stops.filter((s) => typeof s === "string" && s.trim()) : [],
          originLat,
          originLng,
          destLat,
          destLng,
          distanceKm,
          durationDays,
        });
        if (ji) {
          await Ride.findByIdAndUpdate(newRide._id, { $set: { journeyIntelligence: ji } });
        }
      } catch (jiErr) {
        console.warn("[RideController] Background journey intelligence note:", jiErr.message);
      }
    });


    // Automatically add organizer as confirmed participant
    await RideParticipant.create({
      rideId: newRide._id,
      userId: req.user._id,
      status: "confirmed",
    });

    // Push in-app notification to invited riders (do NOT immediately add as participants)
    const { invitedRiderIds } = req.body;
    if (Array.isArray(invitedRiderIds) && invitedRiderIds.length > 0) {
      for (const riderId of invitedRiderIds) {
        if (
          mongoose.Types.ObjectId.isValid(riderId) &&
          riderId.toString() !== req.user._id.toString()
        ) {
          // Push in-app notification to the invited rider
          await createNotification({
            userId: riderId,
            senderId: req.user._id,
            type: "RIDE_INVITE",
            brand: "mototribe",
            title: "New Ride Invitation 🛵",
            message: `${req.user.name || "A fellow rider"} invited you to join their ride: "${newRide.title || `${newRide.origin} to ${newRide.destination}`}".`,
            data: {
              rideId: newRide._id,
              title: newRide.title || `${newRide.origin} to ${newRide.destination}`,
              origin: newRide.origin,
              destination: newRide.destination,
              startDate: newRide.startDate,
            },
          }).catch((err) => {
            console.warn("[RideController] Failed to push ride invite notification:", err.message);
          });
        }
      }
    }

    // Safely increment routesContributed and rideGroupsJoined for organizer (without upsert)
    await RiderProfile.updateOne(
      { userId: req.user._id },
      { $inc: { routesContributed: 1, rideGroupsJoined: 1 } }
    );
    await checkAndAwardBadges(req.user._id);

    // Trigger background SendGrid email reminders evaluation asynchronously
    setImmediate(() => {
      checkAndSendReminders().catch((err) => {
        console.warn("[RideController] Automated SendGrid reminder check notice:", err.message || err);
      });
    });

    // Broadcast real-time socket event so all connected clients sync immediately
    try {
      const { getIo } = require("../../services/mototribe/locationSocketService");
      const io = getIo();
      if (io) {
        io.emit("mototribe:ride_created", { rideId: newRide._id });
      }
    } catch (sockErr) {
      console.warn("[RideController] Socket broadcast notice on create:", sockErr.message);
    }

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
    const now = new Date();

    const candidateRides = await Ride.find({
      status: { $in: ["planning", "ongoing"] },
    })
      .populate("organizerId", "name email")
      .populate("vehicleId")
      .sort({ startDate: 1 });

    const activeUpcomingRides = [];

    for (const r of candidateRides) {
      const startDate = new Date(r.startDate);
      const durationDays = r.durationDays || 1;
      const durationMs = durationDays * 24 * 60 * 60 * 1000;
      const endDateTime = r.endDate ? new Date(r.endDate) : new Date(startDate.getTime() + durationMs);

      // 1. If ride was in planning and start date/time has passed, or scheduled end time has passed -> mark completed
      if (endDateTime < now || (r.status === "planning" && startDate < now)) {
        r.status = "completed";
        await r.save().catch(() => null);
        continue;
      }

      // 2. Only include truly upcoming or live ongoing rides
      if (r.status === "ongoing" || startDate >= now) {
        activeUpcomingRides.push(r);
      }
    }

    const rideIds = activeUpcomingRides.map((r) => r._id);
    const participants = await RideParticipant.find({
      rideId: { $in: rideIds },
      status: { $ne: "left" },
    });

    const participantCountMap = {};
    const userParticipationMap = {};
    participants.forEach((p) => {
      const rId = p.rideId.toString();
      participantCountMap[rId] = (participantCountMap[rId] || 0) + 1;
      if (p.userId.toString() === req.user._id.toString()) {
        userParticipationMap[rId] = p.status;
      }
    });

    const formattedRides = activeUpcomingRides.map((r) => {
      const rideObj = formatRideForUser(r, req.user._id);
      const isOrganizer =
        r.organizerId?._id?.toString() === req.user._id.toString() ||
        r.organizerId?.toString() === req.user._id.toString();

      return {
        ...rideObj,
        maxRiders: r.maxRiders || 1,
        participantsCount: participantCountMap[r._id.toString()] || 1,
        isOrganizer,
        userParticipationStatus:
          userParticipationMap[r._id.toString()] || (isOrganizer ? "confirmed" : null),
      };
    });

    res.status(200).json({
      status: "success",
      results: formattedRides.length,
      data: {
        rides: formattedRides,
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
    const ride = await Ride.findById(req.params.id)
      .populate("organizerId", "name email")
      .populate("vehicleId");

    if (!ride) {
      return next(new AppError("Ride not found.", 404));
    }

    // Auto-populate journey intelligence into DB if missing or not yet generated
    if (!ride.journeyIntelligence || ride.journeyIntelligence.fuelStops === undefined) {
      try {
        const { computeRideJourneyIntelligence } = require("../../services/mototribe/placesService");
        const ji = await computeRideJourneyIntelligence(ride);
        if (ji) {
          ride.journeyIntelligence = ji;
          await ride.save();
        }
      } catch (jiErr) {
        console.warn("[RideController] Auto-populate journey intelligence note:", jiErr.message);
      }
    }

    const participantCount = await RideParticipant.countDocuments({
      rideId: ride._id,
      status: { $ne: "left" },
    });

    const formattedRide = formatRideForUser(ride, req.user._id);
    const isOrganizer =
      ride.organizerId?._id?.toString() === req.user._id.toString() ||
      ride.organizerId?.toString() === req.user._id.toString();

    res.status(200).json({
      status: "success",
      data: {
        ride: {
          ...formattedRide,
          maxRiders: ride.maxRiders || 1,
          isOrganizer,
        },
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
    const { notificationId } = req.body || {};

    // 1. Check if the ride exists
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return next(new AppError("Ride does not exist or has been removed.", 404));
    }

    // 2. Check if the ride has already started, completed, or been cancelled
    if (ride.status === "active") {
      return next(new AppError("Cannot join: this ride has already started.", 400));
    }
    if (ride.status === "completed" || ride.status === "cancelled") {
      return next(
        new AppError(`Cannot join a ride that is ${ride.status}.`, 400)
      );
    }
    if (ride.startDate && new Date(ride.startDate).getTime() < Date.now()) {
      return next(new AppError("Cannot join: this ride has already started.", 400));
    }

    // 3. Check if the invitation expired
    if (notificationId && mongoose.Types.ObjectId.isValid(notificationId)) {
      const inviteNotif = await Notification.findById(notificationId);
      if (inviteNotif) {
        const notifAgeMs = Date.now() - new Date(inviteNotif.createdAt).getTime();
        if (notifAgeMs > 24 * 60 * 60 * 1000) {
          return next(new AppError("This ride invitation has expired.", 400));
        }
      }
    } else {
      const inviteNotif = await Notification.findOne({
        userId: req.user._id,
        type: "RIDE_INVITE",
        "data.rideId": new mongoose.Types.ObjectId(rideId),
      }).sort({ createdAt: -1 });

      if (inviteNotif) {
        const notifAgeMs = Date.now() - new Date(inviteNotif.createdAt).getTime();
        if (notifAgeMs > 24 * 60 * 60 * 1000) {
          return next(new AppError("This ride invitation has expired.", 400));
        }
      }
    }

    // 4. Organizer cannot join as a participant
    if (ride.organizerId.toString() === req.user._id.toString()) {
      return next(
        new AppError("You are the organizer of this ride and already part of it.", 400)
      );
    }

    // 5. Check if maximum riders capacity has been reached
    const confirmedCount = await RideParticipant.countDocuments({
      rideId,
      status: { $in: ["planning", "confirmed"] },
    });
    if (ride.maxRiders && confirmedCount >= ride.maxRiders) {
      return next(
        new AppError("This ride has already reached maximum rider capacity.", 400)
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
      existingParticipant.status = "confirmed";
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
      status: "confirmed",
    });

    // Notify the ride organizer that the invited rider accepted
    await createNotification({
      userId: ride.organizerId,
      senderId: req.user._id,
      type: "SYSTEM",
      brand: "mototribe",
      title: "Ride Invitation Accepted! 🎉",
      message: `${req.user.name || "A rider"} accepted your invitation and joined "${ride.title || `${ride.origin} to ${ride.destination}`}".`,
      data: {
        rideId: ride._id,
        participantId: participant._id,
      },
    }).catch(() => null);

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

  const participantIds = confirmedParticipants.map((p) => p.userId);
  const userIds = Array.from(new Set([String(ride.organizerId), ...participantIds.map(String)]));
  let updatedProfilesCount = 0;

  if (userIds.length > 0) {
    for (const uId of userIds) {
      const res = await RiderProfile.updateOne(
        { userId: uId },
        {
          $inc: {
            totalRidesCompleted: 1,
            totalDistanceKm: ride.distanceKm,
          },
          $addToSet: {
            regionsExplored: ride.destination,
          },
        },
        { upsert: true, ...sessionOpts }
      );
      if (res.modifiedCount || res.upsertedCount) updatedProfilesCount++;
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

    // Broadcast real-time socket event so all connected clients sync immediately
    try {
      const { getIo } = require("../../services/mototribe/locationSocketService");
      const io = getIo();
      if (io) {
        io.emit("mototribe:ride_deleted", { rideId: req.params.id });
      }
    } catch (sockErr) {
      console.warn("[RideController] Socket broadcast notice on cancel:", sockErr.message);
    }

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
 * @desc    Delete a planned ride before it starts - Organizer only
 * @route   DELETE /api/mototribe/rides/:id
 * @access  Private (Organizer)
 */
const deleteRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return next(new AppError("Ride not found.", 404));
    }

    // Check organizer permission
    if (ride.organizerId.toString() !== req.user._id.toString()) {
      return next(
        new AppError("Only the organizer who created this ride can delete it.", 403)
      );
    }

    // Check if ride has already started or completed
    const hasStarted =
      ride.status === "ongoing" ||
      ride.status === "active" ||
      ride.status === "completed" ||
      (ride.startDate && new Date(ride.startDate).getTime() <= Date.now());

    if (hasStarted) {
      return next(
        new AppError(
          `Cannot delete ride once it has started. Status is '${ride.status}'.`,
          400
        )
      );
    }

    // Clean up related records: participants, notifications
    await Promise.all([
      Ride.findByIdAndDelete(req.params.id),
      RideParticipant.deleteMany({ rideId: req.params.id }),
      Notification.deleteMany({ "data.rideId": req.params.id }),
    ]);

    // Broadcast real-time socket event so all connected clients sync immediately
    try {
      const { getIo } = require("../../services/mototribe/locationSocketService");
      const io = getIo();
      if (io) {
        io.emit("mototribe:ride_deleted", { rideId: req.params.id });
      }
    } catch (sockErr) {
      console.warn("[RideController] Socket broadcast notice on delete:", sockErr.message);
    }

    res.status(200).json({
      status: "success",
      message: "Ride deleted successfully from database.",
      data: null,
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
  deleteRide,
  confirmParticipant,
  getLiveLocations,
};
