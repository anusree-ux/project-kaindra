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

    const formattedMessages = chronologicalMessages.map((m) => {
      const uId = m.userId?._id ? m.userId._id.toString() : (m.userId ? m.userId.toString() : "");
      return {
        id: m._id.toString(),
        rideId: m.rideId.toString(),
        userId: uId,
        userName: m.userId?.name || "Unknown",
        message: m.message,
        createdAt: m.createdAt,
      };
    });

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

/**
 * @desc    Send a new chat message to a ride (saves to DB and broadcasts via Socket.io)
 * @route   POST /api/mototribe/rides/:id/chat
 * @access  Private (Confirmed participants & Organizer only)
 */
const sendChatMessage = async (req, res, next) => {
  try {
    const rideId = req.params.id;
    const { message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return next(new AppError("Message content cannot be empty.", 400));
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length > 1000) {
      return next(new AppError("Message cannot exceed 1000 characters.", 400));
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return next(new AppError("Ride not found.", 404));
    }

    if (ride.status === "cancelled") {
      return next(new AppError("Cannot send messages to a cancelled ride.", 400));
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
          "Only confirmed participants or organizer can send messages in this ride.",
          403
        )
      );
    }

    const chatDoc = await ChatMessage.create({
      rideId,
      userId: req.user._id,
      message: trimmedMessage,
    });

    const payload = {
      id: chatDoc._id,
      rideId,
      userId: req.user._id,
      userName: req.user.name || "Rider",
      message: chatDoc.message,
      createdAt: chatDoc.createdAt,
    };

    // Broadcast to Socket.io room if active
    try {
      const { getIo } = require("../../services/mototribe/locationSocketService");
      const io = getIo();
      if (io) {
        io.to(`ride_${rideId}`).emit("chat_message_received", payload);
      }
    } catch (broadcastErr) {
      console.warn("Socket broadcast error:", broadcastErr.message);
    }

    res.status(201).json({
      status: "success",
      data: {
        message: payload,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChatHistory,
  sendChatMessage,
};
