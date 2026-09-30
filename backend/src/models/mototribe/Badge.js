const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    criteriaType: {
      type: String,
      enum: [
        "ridesCompleted",
        "totalDistanceKm",
        "regionsExplored",
        "rideGroupsJoined",
      ],
      required: true,
    },
    criteriaValue: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Badge = mongoose.model("Badge", badgeSchema);

module.exports = Badge;
