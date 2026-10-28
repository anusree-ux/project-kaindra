const mongoose = require("mongoose");

const influenceCreatorProfileSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    displayName: {
      type: String,
      required: [true, "Creator name is required"],
      trim: true,
      maxlength: 100,
    },
    contactEmail: {
      type: String,
      required: [true, "Contact email is required"],
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: "",
      maxlength: 20,
    },
    category: { type: String, trim: true, default: "", maxlength: 100 },
    bio: { type: String, trim: true, default: "", maxlength: 2000 },
    website: { type: String, trim: true, default: "", maxlength: 500 },
    socialLinks: {
      instagram: { type: String, trim: true, default: "", maxlength: 500 },
      tiktok: { type: String, trim: true, default: "", maxlength: 500 },
      youtube: { type: String, trim: true, default: "", maxlength: 500 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "InfluenceCreatorProfile",
  influenceCreatorProfileSchema
);
