const mongoose = require("mongoose");

const socialLinksSchema = new mongoose.Schema(
  {
    instagram: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    linkedin: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const modaProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    displayName: {
      type: String,
      required: [true, "Display name is required"],
      trim: true,
      maxlength: [100, "Display name cannot exceed 100 characters"],
    },

    handle: {
      type: String,
      required: [true, "Handle is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    bio: {
      type: String,
      trim: true,
      maxlength: [1000, "Bio cannot exceed 1000 characters"],
    },

    location: {
      type: String,
      trim: true,
    },

    participantTypes: {
      type: [
        {
          type: String,
          enum: [
            "designer",
            "creator",
            "influencer",
            "consumer",
            "stylist",
            "photographer",
            "fashion_professional",
          ],
        },
      ],
      required: true,
      validate: {
        validator: (value) => value.length > 0,
        message: "At least one participant type is required",
      },
    },

    skills: {
      type: [String],
      default: [],
    },

    socialLinks: {
      type: socialLinksSchema,
      default: {},
    },

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },
  },
  {
    timestamps: true,
  }
);

const ModaProfile = mongoose.model("ModaProfile", modaProfileSchema);

module.exports = ModaProfile;