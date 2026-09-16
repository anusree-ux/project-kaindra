const mongoose = require("mongoose");

const riderPresenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    status: {
      type: String,
      enum: ["riding", "idle"],
      default: "idle",
    },
    visibility: {
      type: String,
      enum: ["private", "connections", "community"],
      default: "private",
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for geospatial proximity searches
riderPresenceSchema.index({ location: "2dsphere" });

const RiderPresence = mongoose.model("RiderPresence", riderPresenceSchema);

module.exports = RiderPresence;
