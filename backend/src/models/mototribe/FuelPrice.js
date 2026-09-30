const mongoose = require("mongoose");

const fuelPriceSchema = new mongoose.Schema(
  {
    location: {
      type: String,
      required: [true, "Location name is required"],
      trim: true,
      index: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      index: true,
    },
    petrolPrice: {
      type: Number,
      required: [true, "Petrol price (₹/L) is required"],
      min: [0, "Price cannot be negative"],
    },
    dieselPrice: {
      type: Number,
      required: [true, "Diesel price (₹/L) is required"],
      min: [0, "Price cannot be negative"],
    },
    isEstimate: {
      type: Boolean,
      default: false,
    },
    effectiveDate: {
      type: Date,
      required: [true, "Effective date is required"],
      default: Date.now,
      index: true,
    },
    isLatest: {
      type: Boolean,
      default: true,
      index: true,
    },
    note: {
      type: String,
      trim: true,
      default: "City-level price used as state-level approximation.",
    },
  },
  {
    timestamps: true,
  }
);

// Idempotency constraint: Only one price record per location per effective date
fuelPriceSchema.index({ location: 1, effectiveDate: 1 }, { unique: true });

const FuelPrice = mongoose.model("FuelPrice", fuelPriceSchema);

module.exports = FuelPrice;
