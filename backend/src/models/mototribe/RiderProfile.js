const mongoose = require("mongoose");

const riderProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    vehicleNumber: {
      type: String,
      required: [true, "Vehicle number is required"],
      trim: true,
    },
    vehicleType: {
      type: String,
      trim: true,
    },
    bikeModel: {
      type: String,
      trim: true,
    },
    emergencyContactNumber: {
      type: String,
      trim: true,
    },
    totalRidesCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDistanceKm: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const RiderProfile = mongoose.model("RiderProfile", riderProfileSchema);

module.exports = RiderProfile;
