const mongoose = require("mongoose");

const liveLocationSchema = new mongoose.Schema(
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
    latitude: {
      type: Number,
      required: [true, "Latitude is required"],
    },
    longitude: {
      type: Number,
      required: [true, "Longitude is required"],
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// One document per user per ride
liveLocationSchema.index({ rideId: 1, userId: 1 }, { unique: true });

const LiveLocation = mongoose.model("LiveLocation", liveLocationSchema);

module.exports = LiveLocation;
