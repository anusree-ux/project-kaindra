const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const rideJournalSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [1000, "Note cannot exceed 1000 characters"],
      default: "",
    },
    photos: {
      type: [photoSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// One journal entry per user per ride
rideJournalSchema.index({ rideId: 1, userId: 1 }, { unique: true });

const RideJournal = mongoose.model("RideJournal", rideJournalSchema);

module.exports = RideJournal;
