const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema(
  {
    pricePerUnit: { type: Number, required: true, min: 0 },
    leadTimeDays: { type: Number, required: true, min: 1 },
    validUntil: { type: Date },
    note: { type: String, default: "", trim: true },
    quotedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const timelineEventSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: "", trim: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const productionRequestSchema = new mongoose.Schema(
  {
    designId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Design",
      required: true,
      index: true,
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    manufacturerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Manufacturer",
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required."],
      min: [1, "Quantity must be at least 1."],
    },
    targetPricePerUnit: {
      type: Number,
      min: [0, "Target price per unit cannot be negative."],
    },
    targetDeliveryDate: {
      type: Date,
    },
    notes: {
      type: String,
      maxlength: [1000, "Notes cannot exceed 1000 characters."],
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "requested",
        "quoted",
        "accepted",
        "rejected",
        "in_production",
        "completed",
        "cancelled",
      ],
      default: "requested",
    },
    quote: {
      type: quoteSchema,
    },
    timeline: {
      type: [timelineEventSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

productionRequestSchema.index(
  { designId: 1, manufacturerId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["requested", "quoted", "accepted", "in_production"] },
    },
  }
);

const ProductionRequest = mongoose.model(
  "ProductionRequest",
  productionRequestSchema
);

module.exports = ProductionRequest;
