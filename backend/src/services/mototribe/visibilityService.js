const ConnectionRequest = require("../../models/core/ConnectionRequest");
const Ride = require("../../models/mototribe/Ride");
const RideParticipant = require("../../models/mototribe/RideParticipant");

/**
 * Determines whether a user is authorized to view a specific journal entry
 * @param {string|ObjectId} viewerUserId
 * @param {Object} journalEntry Mongoose document or JS object containing userId & visibility
 * @param {string|ObjectId} [rideId] Associated ride ID
 * @returns {Promise<boolean>}
 */
const canViewJournalEntry = async (viewerUserId, journalEntry, rideId = null) => {
  if (!viewerUserId || !journalEntry) return false;

  const viewerIdStr = viewerUserId.toString();
  const ownerIdRaw = journalEntry.userId?._id || journalEntry.userId;
  const ownerIdStr = ownerIdRaw ? ownerIdRaw.toString() : null;

  // 1. Owner always has full access to their own journal entry
  if (ownerIdStr && viewerIdStr === ownerIdStr) {
    return true;
  }

  const visibility = journalEntry.visibility || "private";

  // 2. Private: Only owner can view
  if (visibility === "private") {
    return false;
  }

  // 3. Connections: Must have an accepted ConnectionRequest in either direction
  if (visibility === "connections") {
    if (!ownerIdStr) return false;
    const connection = await ConnectionRequest.findOne({
      status: "accepted",
      $or: [
        { fromUserId: viewerUserId, toUserId: ownerIdRaw },
        { fromUserId: ownerIdRaw, toUserId: viewerUserId },
      ],
    });
    return !!connection;
  }

  // 4. Ride Group: Must be confirmed RideParticipant or Organizer of the ride
  if (visibility === "ride_group") {
    const targetRideId =
      rideId ||
      (journalEntry.rideId?._id ? journalEntry.rideId._id : journalEntry.rideId);
    if (!targetRideId) return false;

    const ride = await Ride.findById(targetRideId);
    if (!ride) return false;

    const isOrganizer = ride.organizerId.toString() === viewerIdStr;
    if (isOrganizer) return true;

    const participant = await RideParticipant.findOne({
      rideId: targetRideId,
      userId: viewerUserId,
      status: "confirmed",
    });
    return !!participant;
  }

  // 5. Community: Any authenticated user can view
  if (visibility === "community") {
    return true;
  }

  return false;
};

module.exports = {
  canViewJournalEntry,
};
