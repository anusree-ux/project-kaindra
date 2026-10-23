const mongoose = require("mongoose");

const stepSchema = new mongoose.Schema(
  {
    instruction: { type: String, required: true },
    distanceMeters: { type: Number, required: true },
    durationSeconds: { type: Number, required: true },
  },
  { _id: false }
);

const routeInfoSchema = new mongoose.Schema(
  {
    distanceMeters: { type: Number, required: true },
    durationSeconds: { type: Number, required: true },
    durationInTrafficSeconds: { type: Number, default: null },
    polyline: { type: String, required: true },
    steps: [stepSchema],
    computedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const poiPlaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, default: "" },
    category: {
      type: String,
      enum: ["fuel", "rest_stop", "repair_shop", "hotel", "food", "scenic_spot", "other"],
      default: "other",
    },
    latitude: { type: Number },
    longitude: { type: Number },
    rating: { type: Number, default: null },
    isOpenNow: { type: Boolean, default: null },
    distanceMeters: { type: Number, default: null },
    googlePlaceId: { type: String, default: "" },
  },
  { _id: false }
);

const journeyIntelligenceSchema = new mongoose.Schema(
  {
    fuelStops: { type: Number, default: 0 },
    restStops: { type: Number, default: 0 },
    serviceStops: { type: Number, default: 0 },
    accommodationStops: { type: Number, default: 0 },
    scenicStops: { type: Number, default: 0 },
    elevationGain: { type: String, default: "680 M" },
    weatherRisk: { type: String, default: "LOW" },
    roadQuality: { type: String, default: "GOOD (HIGHWAY & GHAT PASSES)" },
    places: [poiPlaceSchema],
    computedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const rideSchema = new mongoose.Schema(
  {
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle ID is required"],
    },
    title: {
      type: String,
      required: [true, "Ride title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [250, "Title cannot exceed 250 characters"],
    },
    origin: {
      type: String,
      required: [true, "Origin is required"],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
    },
    stops: [
      {
        type: String,
        trim: true,
      },
    ],
    originLat: { type: Number },
    originLng: { type: Number },
    destLat: { type: Number },
    destLng: { type: Number },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    durationDays: {
      type: Number,
      default: 1,
      min: [1, "Duration must be at least 1 day"],
    },
    distanceKm: {
      type: Number,
      required: [true, "Distance in Km is required"],
      min: [0.1, "Distance must be positive"],
    },
    budget: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxRiders: {
      type: Number,
      default: 1,
      min: [1, "Max riders must be at least 1"],
    },
    status: {
      type: String,
      enum: ["planning", "ongoing", "completed", "cancelled"],
      default: "planning",
    },
    routeInfo: {
      type: routeInfoSchema,
      default: null,
    },
    journeyIntelligence: {
      type: journeyIntelligenceSchema,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Ride = mongoose.model("Ride", rideSchema);

module.exports = Ride;
