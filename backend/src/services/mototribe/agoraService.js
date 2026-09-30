const mongoose = require("mongoose");
const { RtcTokenBuilder, RtcRole } = require("agora-token");
const Ride = require("../../models/mototribe/Ride");
const RideParticipant = require("../../models/mototribe/RideParticipant");
const AppError = require("../../utils/AppError");

/**
 * Service to generate Agora RTC tokens for ride group voice/video calls.
 * Ensures the requesting user is an organizer or confirmed/active participant of the specified ride.
 *
 * @param {Object} params
 * @param {string} params.rideId - MongoDB ObjectId of the Ride
 * @param {string|mongoose.Types.ObjectId} params.userId - Authenticated user's ID
 * @param {number} [params.requestedUid] - Optional numeric UID specified by frontend SDK
 * @param {string} [params.role='PUBLISHER'] - Agora role ('PUBLISHER' or 'SUBSCRIBER')
 * @param {number} [params.expireSeconds] - Custom token expiration lifetime in seconds
 * @returns {Promise<Object>} Object containing Agora RTC token and call channel metadata
 */
const generateAgoraRtcToken = async ({
  rideId,
  userId,
  requestedUid,
  role = "PUBLISHER",
  expireSeconds,
}) => {
  // 1. Input validation
  if (!rideId) {
    throw new AppError("Ride ID is required.", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(rideId)) {
    throw new AppError("Invalid ride ID format.", 400);
  }

  // 2. Fetch Ride
  const ride = await Ride.findById(rideId);
  if (!ride) {
    throw new AppError("Ride not found.", 404);
  }

  // 3. Authorization check (Organizer or active participant)
  const isOrganizer = ride.organizerId.toString() === userId.toString();
  const participant = await RideParticipant.findOne({
    rideId: ride._id,
    userId,
    status: { $in: ["confirmed", "planning"] },
  });

  if (!isOrganizer && !participant) {
    throw new AppError(
      "You must be an organizer or confirmed participant of this ride to join the call.",
      403
    );
  }

  // 4. Validate Agora credentials configuration
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (
    !appId ||
    !appCertificate ||
    appId.startsWith("your_agora") ||
    appCertificate.startsWith("your_agora")
  ) {
    throw new AppError(
      "Agora credentials are not configured on the server.",
      500
    );
  }

  // 5. Build predictable, unique channel name tied to the ride ID
  const channelName = `ride-${ride._id.toString()}`;

  // 6. Determine UID (numeric 32-bit uint) and string userAccount
  let uid = 0;
  if (
    requestedUid !== undefined &&
    requestedUid !== null &&
    !isNaN(Number(requestedUid)) &&
    Number(requestedUid) >= 0
  ) {
    uid = Number(requestedUid);
  } else {
    // Generate deterministic positive 32-bit integer from MongoDB ObjectId hex
    uid = parseInt(userId.toString().slice(-8), 16) % 2147483647;
  }

  const userAccount = userId.toString();

  // 7. Calculate token expiration
  const defaultExpireSeconds =
    Number(process.env.AGORA_TOKEN_EXPIRATION_SECONDS) || 3600;
  const expirationTimeInSeconds =
    expireSeconds && !isNaN(Number(expireSeconds)) && Number(expireSeconds) > 0
      ? Math.min(Number(expireSeconds), 86400) // cap at 24 hours max
      : defaultExpireSeconds;

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
  const expiresAt = new Date(privilegeExpiredTs * 1000).toISOString();

  // 8. Determine RTC Role
  const rtcRole =
    role && role.toUpperCase() === "SUBSCRIBER"
      ? RtcRole.SUBSCRIBER
      : RtcRole.PUBLISHER;

  const roleName = rtcRole === RtcRole.SUBSCRIBER ? "SUBSCRIBER" : "PUBLISHER";

  // 9. Generate Agora RTC Token securely using official agora-token SDK
  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    rtcRole,
    privilegeExpiredTs,
    privilegeExpiredTs
  );

  if (!token) {
    throw new AppError(
      "Failed to generate Agora token. Please verify AGORA_APP_ID and AGORA_APP_CERTIFICATE.",
      500
    );
  }

  return {
    token,
    appId,
    channelName,
    uid,
    userAccount,
    role: roleName,
    expiresAt,
    expiresInSeconds: expirationTimeInSeconds,
  };
};

module.exports = {
  generateAgoraRtcToken,
};
