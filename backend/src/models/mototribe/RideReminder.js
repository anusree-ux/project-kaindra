const mongoose = require("mongoose");

const rideReminderSchema = new mongoose.Schema(
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
    reminderType: {
      type: String,
      enum: ["24h", "1h"],
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reminder sends for the same ride, user, and reminder type
rideReminderSchema.index(
  { rideId: 1, userId: 1, reminderType: 1 },
  { unique: true }
);

const RideReminder = mongoose.model("RideReminder", rideReminderSchema);

module.exports = RideReminder;
