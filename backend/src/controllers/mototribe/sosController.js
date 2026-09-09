const SosAlert = require("../../models/mototribe/SosAlert");
const Ride = require("../../models/mototribe/Ride");
const RideParticipant = require("../../models/mototribe/RideParticipant");
const RiderProfile = require("../../models/mototribe/RiderProfile");
const LiveLocation = require("../../models/mototribe/LiveLocation");
const { sendSms } = require("../../services/mototribe/smsService");
const { getIo } = require("../../services/mototribe/locationSocketService");
const AppError = require("../../utils/AppError");

/**
 * @desc    Trigger SOS Emergency Alert for a ride
 * @route   POST /api/mototribe/rides/:id/sos
 * @access  Private (Confirmed Participant or Organizer of ongoing ride)
 */
const triggerSosAlert = async (req, res, next) => {
  try {
    const rideId = req.params.id;
    const userId = req.user._id;

    // 1. Verify Ride exists and is ongoing
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return next(new AppError("Ride not found.", 404));
    }

    if (ride.status !== "ongoing") {
      return next(
        new AppError(
          `Cannot trigger SOS. Ride status is '${ride.status}' (expected 'ongoing').`,
          400
        )
      );
    }

    // 2. Verify user is confirmed participant or organizer
    const isOrganizer = ride.organizerId.toString() === userId.toString();
    const participant = await RideParticipant.findOne({
      rideId,
      userId,
      status: "confirmed",
    });

    if (!isOrganizer && !participant) {
      return next(
        new AppError(
          "You must be a confirmed participant or organizer of this ride to trigger an SOS alert.",
          403
        )
      );
    }

    // 3. Abuse Prevention: Check for existing active SOS alert for this user & ride
    const existingAlert = await SosAlert.findOne({
      rideId,
      userId,
      status: "active",
    });

    if (existingAlert) {
      return res.status(200).json({
        status: "success",
        message: "An active SOS alert already exists for this user on this ride.",
        data: {
          alert: existingAlert,
        },
      });
    }

    // 4. Determine latitude and longitude (captured at trigger time, fall back to LiveLocation)
    let latitude = req.body.latitude;
    let longitude = req.body.longitude;

    if (latitude === undefined || longitude === undefined) {
      const lastLocation = await LiveLocation.findOne({ rideId, userId });
      if (lastLocation) {
        latitude = lastLocation.latitude;
        longitude = lastLocation.longitude;
      }
    }

    if (latitude === undefined || longitude === undefined) {
      return next(
        new AppError(
          "Location coordinates (lat/long) are required to trigger SOS, and no live location backup was found.",
          400
        )
      );
    }

    // 5. Create SosAlert record
    const newAlert = await SosAlert.create({
      rideId,
      userId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      status: "active",
      triggeredAt: new Date(),
      smsDeliveryStatus: [],
    });

    // 6. Fetch RiderProfile & send Emergency Contact SMS to each contact
    const riderProfile = await RiderProfile.findOne({ userId });
    const emergencyContacts = riderProfile?.emergencyContacts || [];

    // Safe rider name fallback (never show "undefined")
    const riderName = req.user.name || req.user.email || "A rider";

    if (emergencyContacts.length > 0) {
      const googleMapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
      const smsMessage = `EMERGENCY SOS! Rider ${riderName} triggered an SOS alert on ride "${ride.title}". Location: ${googleMapsUrl}`;
      const deliveryStatuses = [];

      for (const contact of emergencyContacts) {
        if (!contact.phoneNumber) continue;

        const smsResult = await sendSms(contact.phoneNumber, smsMessage);

        deliveryStatuses.push({
          contactName: contact.name || "Unknown",
          phoneNumber: contact.phoneNumber,
          success: Boolean(smsResult.success),
          error: smsResult.success ? null : smsResult.error || "SMS delivery failed",
        });
      }

      newAlert.smsDeliveryStatus = deliveryStatuses;
      await newAlert.save();
    } else {
      console.log(`[SOS Alert] Rider ${userId} has no emergency contacts saved.`);
    }

    // 7. Broadcast high-priority socket event to ride room (ride_<rideId>)
    const io = getIo();
    if (io) {
      io.to(`ride_${rideId}`).emit("sos_alert", {
        alertId: newAlert._id,
        rideId,
        user: {
          id: req.user._id,
          name: riderName,
          email: req.user.email,
        },
        latitude: newAlert.latitude,
        longitude: newAlert.longitude,
        status: newAlert.status,
        triggeredAt: newAlert.triggeredAt,
        smsDeliveryStatus: newAlert.smsDeliveryStatus,
      });
    }

    // 8. Respond 201 with created alert regardless of SMS status
    res.status(201).json({
      status: "success",
      data: {
        alert: newAlert,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resolve an SOS alert for a ride
 * @route   PATCH /api/mototribe/rides/:id/sos/:alertId/resolve
 * @access  Private (Organizer or Original Alert Creator)
 */
const resolveSosAlert = async (req, res, next) => {
  try {
    const { id: rideId, alertId } = req.params;
    const userId = req.user._id;

    // 1. Verify Ride exists
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return next(new AppError("Ride not found.", 404));
    }

    // 2. Find SosAlert
    const alert = await SosAlert.findOne({ _id: alertId, rideId });
    if (!alert) {
      return next(new AppError("SOS alert not found for this ride.", 404));
    }

    // 3. Authorization: Organizer or Original Alert Creator
    const isOrganizer = ride.organizerId.toString() === userId.toString();
    const isCreator = alert.userId.toString() === userId.toString();

    if (!isOrganizer && !isCreator) {
      return next(
        new AppError(
          "Only the ride organizer or the rider who triggered this alert can resolve it.",
          403
        )
      );
    }

    // 4. Update status and resolvedAt
    alert.status = "resolved";
    alert.resolvedAt = new Date();
    await alert.save();

    // 5. Broadcast "sos_resolved" socket event to room
    const io = getIo();
    if (io) {
      const resolverName = req.user.name || req.user.email || "Organizer";
      io.to(`ride_${rideId}`).emit("sos_resolved", {
        alertId: alert._id,
        rideId,
        resolvedBy: {
          id: req.user._id,
          name: resolverName,
        },
        resolvedAt: alert.resolvedAt,
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        alert,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List all SOS alerts for a ride, most recent first
 * @route   GET /api/mototribe/rides/:id/sos
 * @access  Private (Confirmed Participant or Organizer)
 */
const getRideSosAlerts = async (req, res, next) => {
  try {
    const rideId = req.params.id;
    const userId = req.user._id;

    // 1. Verify Ride exists
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return next(new AppError("Ride not found.", 404));
    }

    // 2. Verify user is confirmed participant or organizer
    const isOrganizer = ride.organizerId.toString() === userId.toString();
    const participant = await RideParticipant.findOne({
      rideId,
      userId,
      status: "confirmed",
    });

    if (!isOrganizer && !participant) {
      return next(
        new AppError(
          "Must be a confirmed participant or organizer of this ride to view SOS alerts.",
          403
        )
      );
    }

    // 3. Fetch alerts sorted most recent first
    const alerts = await SosAlert.find({ rideId })
      .sort({ triggeredAt: -1, createdAt: -1 })
      .populate("userId", "name email");

    res.status(200).json({
      status: "success",
      results: alerts.length,
      data: {
        alerts,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  triggerSosAlert,
  resolveSosAlert,
  getRideSosAlerts,
};
