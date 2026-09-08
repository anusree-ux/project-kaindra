const mongoose = require("mongoose");

const emergencyContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Emergency contact name is required"],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Emergency contact phone number is required"],
      trim: true,
    },
    relationship: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const maxContactsLimit = (val) => {
  return Array.isArray(val) && val.length <= 3;
};

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
    emergencyContacts: {
      type: [emergencyContactSchema],
      default: [],
      validate: [
        maxContactsLimit,
        "{PATH} exceeds the limit of 3 emergency contacts",
      ],
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
    regionsExplored: {
      type: [String],
      default: [],
    },
    routesContributed: {
      type: Number,
      default: 0,
      min: 0,
    },
    rideGroupsJoined: {
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
