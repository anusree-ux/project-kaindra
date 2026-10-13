const mongoose = require("mongoose");

const designerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    displayName: {
      type: String,
      required: [true, "Display name is required."],
      trim: true,
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters."],
      default: "",
      trim: true,
    },
    specialties: {
      type: [String],
      default: [],
    },
    portfolioUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const DesignerProfile = mongoose.model(
  "DesignerProfile",
  designerProfileSchema
);

module.exports = DesignerProfile;
