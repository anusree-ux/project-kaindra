const mongoose = require("mongoose");

const dropSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Drop title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    coverImage: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator ID is required"],
      index: true,
    },
    productIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
    ],
    startTime: {
      type: Date,
      required: [true, "Drop start time is required"],
      index: true,
    },
    endTime: {
      type: Date,
      default: null,
      index: true,
    },
    maxPerUser: {
      type: Number,
      default: 2,
      min: [1, "Max purchase per user must be at least 1"],
    },
    status: {
      type: String,
      enum: ["upcoming", "live", "ended"],
      default: "upcoming",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

dropSchema.index({ status: 1, startTime: 1 });
dropSchema.index({ productIds: 1 });

module.exports = mongoose.models.Drop || mongoose.model("Drop", dropSchema);
