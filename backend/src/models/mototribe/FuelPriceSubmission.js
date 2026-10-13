const mongoose = require("mongoose");

const fuelPriceSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    state: {
      type: String,
      required: [true, "State name is required"],
      trim: true,
      index: true,
    },
    city: {
      type: String,
      trim: true,
      index: true,
    },
    station: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    fuelType: {
      type: String,
      enum: ["petrol", "diesel"],
      required: [true, "Fuel type is required (petrol or diesel)"],
      lowercase: true,
      trim: true,
    },
    pricePerLiter: {
      type: Number,
      required: [true, "Price per liter is required"],
      min: [0.1, "Price must be positive"],
    },
    validationStatus: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "SUSPICIOUS", "REJECTED"],
      default: "ACCEPTED",
      index: true,
    },
    confidenceScore: {
      type: Number,
      default: 0.8,
      min: 0.0,
      max: 1.0,
    },
    deviationPct: {
      type: Number,
      default: 0.0,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient 7-day state + fuelType queries
fuelPriceSubmissionSchema.index({ state: 1, fuelType: 1, validationStatus: 1, submittedAt: -1 });

const FuelPriceSubmission = mongoose.model(
  "FuelPriceSubmission",
  fuelPriceSubmissionSchema
);

module.exports = FuelPriceSubmission;
