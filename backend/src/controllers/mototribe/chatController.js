const mongoose = require("mongoose");
const Ride = require("../../models/mototribe/Ride");
const RideParticipant = require("../../models/mototribe/RideParticipant");
const ChatMessage = require("../../models/mototribe/ChatMessage");
const AppError = require("../../utils/AppError");

/**
 * @desc    Get recent chat history for a ride (last 50 messages, sorted oldest to newest)
 * @route   GET /api/mototribe/rides/:id/chat/history
 * @access  Private (Confirmed participants & Organizer only)
 */
const getChatHistory = async (req, res, next) => {
  try {
    const rideId = req.params.id;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return next(new AppError("Ride not found.", 404));
    }

    const isOrganizer = ride.organizerId.toString() === req.user._id.toString();
    const participant = await RideParticipant.findOne({
      rideId,
      userId: req.user._id,
      status: "confirmed",
    });

    if (!isOrganizer && !participant) {
      return next(
        new AppError(
          "Only confirmed participants or organizer can view chat history.",
          403
        )
      );
    }

    const { before } = req.query;
    const query = { rideId };

    if (before) {
      if (mongoose.Types.ObjectId.isValid(before)) {
        query._id = { $lt: before };
      } else if (!isNaN(new Date(before).getTime())) {
        query.createdAt = { $lt: new Date(before) };
      }
    }

    // Fetch last 50 entries descending to get the latest 50 before cutoff
    const messages = await ChatMessage.find(query)
      .sort({ _id: -1 })
      .limit(50)
      .populate("userId", "name");

    // Reverse array to return in chronological order (oldest to newest)
    const chronologicalMessages = messages.reverse();

    const formattedMessages = chronologicalMessages.map((m) => ({
      id: m._id,
      rideId: m.rideId,
      userId: m.userId?._id || m.userId,
      userName: m.userId?.name || "Unknown",
      message: m.message,
      createdAt: m.createdAt,
    }));

    res.status(200).json({
      status: "success",
      results: formattedMessages.length,
      data: {
        messages: formattedMessages,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChatHistory,
};
