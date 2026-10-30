const { generateAgoraRtcToken } = require("../../services/mototribe/agoraService");
const AppError = require("../../utils/AppError");

/**
 * @desc    Generate Agora RTC Token for Ride Group Voice/Video Call
 * @route   POST /api/mototribe/agora/token OR POST /api/mototribe/rides/:id/agora-token
 * @access  Private (Confirmed participants & Organizer only)
 */
const getAgoraToken = async (req, res, next) => {
  try {
    const rideId = req.params.id || req.body?.rideId;
    const { uid, role, expireSeconds } = req.body || {};

    if (!rideId) {
      return next(
        new AppError("rideId is required in request parameters or body.", 400)
      );
    }

    const tokenData = await generateAgoraRtcToken({
      rideId,
      userId: req.user._id,
      requestedUid: uid,
      role,
      expireSeconds,
    });

    res.status(200).json({
      status: "success",
      message: "Agora RTC token generated successfully.",
      data: tokenData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active call status for a ride
 * @route   GET /api/mototribe/rides/:id/call-status
 * @access  Private
 */
const getCallStatus = async (req, res, next) => {
  try {
    const rideId = req.params.id;
    const { getActiveCall } = require("../../services/mototribe/locationSocketService");
    const activeCall = getActiveCall(rideId);

    res.status(200).json({
      status: "success",
      data: {
        active: Boolean(activeCall),
        call: activeCall || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAgoraToken,
  getCallStatus,
};
