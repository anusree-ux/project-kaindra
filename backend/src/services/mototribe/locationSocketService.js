const { verifyAccessToken } = require("../../utils/jwt");
const User = require("../../models/core/User");
const Ride = require("../../models/mototribe/Ride");
const RideParticipant = require("../../models/mototribe/RideParticipant");
const LiveLocation = require("../../models/mototribe/LiveLocation");
const ChatMessage = require("../../models/mototribe/ChatMessage");

// In-memory rate limiting maps
const lastUpdateMap = new Map();
const RATE_LIMIT_MS = 3000; // 3 seconds for location updates

const lastChatMessageMap = new Map();
const CHAT_RATE_LIMIT_MS = 1000; // 1 second for chat messages

// Store Socket.io instance for room broadcasting
let ioInstance = null;

const initLocationSocketService = (io) => {
  ioInstance = io;

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization;

      if (token && token.startsWith("Bearer ")) {
        token = token.split(" ")[1];
      }

      if (!token) {
        return next(new Error("Authentication error: Token missing"));
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.user._id})`);

    // 1. Client emits "join_ride" with { rideId }
    socket.on("join_ride", async (data) => {
      try {
        const { rideId } = data || {};
        if (!rideId) {
          return socket.emit("error", { message: "rideId is required" });
        }

        // Verify ride exists and is ongoing
        const ride = await Ride.findById(rideId);
        if (!ride) {
          return socket.emit("error", { message: "Ride not found" });
        }

        if (ride.status !== "ongoing") {
          return socket.emit("error", {
            message: `Cannot join live tracking. Ride status is '${ride.status}' (expected 'ongoing').`,
          });
        }

        // Verify user is organizer or a confirmed participant
        const isOrganizer =
          ride.organizerId.toString() === socket.user._id.toString();

        const participant = await RideParticipant.findOne({
          rideId,
          userId: socket.user._id,
          status: "confirmed",
        });

        if (!isOrganizer && !participant) {
          return socket.emit("error", {
            message: "You are not a confirmed participant on this ride.",
          });
        }

        const roomName = `ride_${rideId}`;
        socket.join(roomName);

        socket.emit("joined_ride", {
          status: "success",
          rideId,
          room: roomName,
        });
      } catch (error) {
        socket.emit("error", { message: "Server error joining ride room" });
      }
    });

    // 2. Client emits "location_update" with { rideId, latitude, longitude }
    socket.on("location_update", async (data) => {
      try {
        const { rideId, latitude, longitude } = data || {};

        if (!rideId || latitude === undefined || longitude === undefined) {
          return socket.emit("error", {
            message: "rideId, latitude, and longitude are required",
          });
        }

        const roomName = `ride_${rideId}`;

        // Verify user has joined the room
        if (!socket.rooms.has(roomName)) {
          return socket.emit("error", {
            message: "You must join the ride room first before sending location updates.",
          });
        }

        // Rate limiting: max 1 update per 3 seconds per user per ride
        const rateLimitKey = `${socket.user._id}_${rideId}`;
        const now = Date.now();
        const lastUpdate = lastUpdateMap.get(rateLimitKey) || 0;

        if (now - lastUpdate < RATE_LIMIT_MS) {
          return socket.emit("rate_limit_exceeded", {
            message: "Location updates are rate-limited to 1 update per 3 seconds.",
          });
        }

        lastUpdateMap.set(rateLimitKey, now);

        const updatedAt = new Date();

        // Upsert LiveLocation document (one document per user per ride)
        await LiveLocation.findOneAndUpdate(
          { rideId, userId: socket.user._id },
          {
            $set: {
              latitude: Number(latitude),
              longitude: Number(longitude),
              updatedAt,
            },
          },
          { upsert: true, new: true, runValidators: true }
        );

        // Broadcast "location_broadcast" to everyone else in the room
        socket.to(roomName).emit("location_broadcast", {
          userId: socket.user._id,
          userName: socket.user.name,
          latitude: Number(latitude),
          longitude: Number(longitude),
          updatedAt,
        });
      } catch (error) {
        socket.emit("error", {
          message: "Server error updating live location",
          error: error.message,
        });
      }
    });

    // 3. Client emits "chat_message" with { rideId, message }
    socket.on("chat_message", async (data) => {
      try {
        const { rideId, message } = data || {};

        if (!rideId) {
          return socket.emit("error", { message: "rideId is required" });
        }

        const roomName = `ride_${rideId}`;

        // Verify user has joined the room via join_ride
        if (!socket.rooms.has(roomName)) {
          return socket.emit("error", {
            message: "You must join the ride room first before sending messages.",
          });
        }

        if (!message || typeof message !== "string" || !message.trim()) {
          return socket.emit("error", { message: "Message content cannot be empty." });
        }

        const trimmedMessage = message.trim();
        if (trimmedMessage.length > 1000) {
          return socket.emit("error", {
            message: "Message cannot exceed 1000 characters.",
          });
        }

        // Rate limiting: max 1 chat message per second per user per ride
        const rateLimitKey = `chat_${socket.user._id}_${rideId}`;
        const now = Date.now();
        const lastTime = lastChatMessageMap.get(rateLimitKey) || 0;

        if (now - lastTime < CHAT_RATE_LIMIT_MS) {
          return socket.emit("rate_limit_exceeded", {
            message: "Chat messages are rate-limited to 1 message per second.",
          });
        }

        lastChatMessageMap.set(rateLimitKey, now);

        // Save to ChatMessage collection
        const chatDoc = await ChatMessage.create({
          rideId,
          userId: socket.user._id,
          message: trimmedMessage,
        });

        const payload = {
          id: chatDoc._id,
          rideId,
          userId: socket.user._id,
          userName: socket.user.name,
          message: chatDoc.message,
          createdAt: chatDoc.createdAt,
        };

        // Broadcast to everyone in the room (including sender)
        ioInstance.to(roomName).emit("chat_message_received", payload);
      } catch (error) {
        socket.emit("error", {
          message: "Server error sending chat message",
          error: error.message,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

const getIo = () => ioInstance;

module.exports = {
  initLocationSocketService,
  getIo,
};
