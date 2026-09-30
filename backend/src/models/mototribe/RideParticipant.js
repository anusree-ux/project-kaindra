const mongoose = require("mongoose");

const rideParticipantSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["planning", "confirmed", "left"],
      default: "planning",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent user from joining the same ride twice
rideParticipantSchema.index({ rideId: 1, userId: 1 }, { unique: true });

const RideParticipant = mongoose.model(
  "RideParticipant",
  rideParticipantSchema
);

module.exports = RideParticipant;
