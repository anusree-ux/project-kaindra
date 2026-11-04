const mongoose = require("mongoose");

const timelineEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "pending_pickup",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "failed_delivery",
      ],
      required: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ModaSphereOrder",
      required: true,
      unique: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["manual", "shiprocket"],
      default: "manual",
    },
    providerShipmentId: {
      type: String,
      default: null,
    },
    awbCode: {
      type: String,
      default: null,
    },
    trackingUrl: {
      type: String,
      default: null,
    },
    labelUrl: {
      type: String,
      default: null,
    },
    isMock: {
      type: Boolean,
      default: false,
    },
    carrier: {
      type: String,
      required: [true, "Carrier is required (e.g. Delhivery, Bluedart, India Post)."],
      trim: true,
    },
    trackingNumber: {
      type: String,
      required: [true, "Tracking number is required."],
      trim: true,
    },
    estimatedDeliveryDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: [
        "pending_pickup",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "failed_delivery",
      ],
      default: "pending_pickup",
      index: true,
    },
    timeline: [timelineEntrySchema],
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.ModaSphereShipment ||
  mongoose.model("ModaSphereShipment", shipmentSchema);
