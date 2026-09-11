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
fuelPriceSubmissionSchema.index({ state: 1, fuelType: 1, submittedAt: -1 });

const FuelPriceSubmission = mongoose.model(
  "FuelPriceSubmission",
  fuelPriceSubmissionSchema
);

module.exports = FuelPriceSubmission;
