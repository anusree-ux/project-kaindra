const mongoose = require("mongoose");

const influencerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    profileImage: {
      type: String,
      trim: true,
    },

    location: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    categories: [
      {
        type: String,
        trim: true,
      },
    ],

    followers: {
      type: Number,
      min: 0,
      default: 0,
    },

    socialLinks: {
      instagram: {
        type: String,
        trim: true,
      },

      youtube: {
        type: String,
        trim: true,
      },

      tiktok: {
        type: String,
        trim: true,
      },

      website: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "InfluencerProfile",
  influencerProfileSchema
);