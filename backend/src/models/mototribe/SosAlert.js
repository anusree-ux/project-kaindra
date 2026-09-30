const mongoose = require("mongoose");

const smsDeliveryStatusSchema = new mongoose.Schema(
  {
    contactName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    success: {
      type: Boolean,
      required: true,
    },
    error: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const sosAlertSchema = new mongoose.Schema(
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
      required: [true, "Latitude is required for SOS alert"],
    },
    longitude: {
      type: Number,
      required: [true, "Longitude is required for SOS alert"],
    },
    status: {
      type: String,
      enum: ["active", "resolved"],
      default: "active",
    },
    triggeredAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    smsDeliveryStatus: {
      type: [smsDeliveryStatusSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

sosAlertSchema.index({ rideId: 1, userId: 1, status: 1 });

const SosAlert = mongoose.model("SosAlert", sosAlertSchema);

module.exports = SosAlert;
