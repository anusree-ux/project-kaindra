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
    source: {
      type: String,
      required: [true, "Price source is required"],
      trim: true,
      default: "IOCL",
      index: true,
    },
    sourceType: {
      type: String,
      enum: ["official", "community", "third_party"],
      default: "official",
      index: true,
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
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
    confidence: {
      type: Number,
      default: 1.0,
      min: 0.0,
      max: 1.0,
    },
    isLatest: {
      type: Boolean,
      default: true,
      index: true,
    },
    note: {
      type: String,
      trim: true,
      default: "Official benchmark price.",
    },
  },
  {
    timestamps: true,
  }
);

// Idempotency constraint: Only one price record per location per effective date per source
fuelPriceSchema.index({ location: 1, effectiveDate: 1, source: 1 }, { unique: true });

const FuelPrice = mongoose.model("FuelPrice", fuelPriceSchema);

module.exports = FuelPrice;
