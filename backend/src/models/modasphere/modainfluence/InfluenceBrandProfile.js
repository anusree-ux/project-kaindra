const mongoose = require("mongoose");

const brandProfileSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },
    brandName: {
      type: String,
      required: [true, "Brand name is required"],
      trim: true,
      maxlength: 150,
    },
    logoUrl: { type: String, trim: true, default: "", maxlength: 1000 },
    description: { type: String, trim: true, default: "", maxlength: 2000 },
    website: { type: String, trim: true, default: "", maxlength: 500 },
    category: {
      type: String,
      required: [true, "Business category is required"],
      trim: true,
      maxlength: 100,
    },
    contactEmail: {
      type: String,
      required: [true, "Contact email is required"],
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    contactPhone: { type: String, trim: true, default: "", maxlength: 30 },
    socialLinks: {
      instagram: { type: String, trim: true, default: "", maxlength: 500 },
      facebook: { type: String, trim: true, default: "", maxlength: 500 },
      youtube: { type: String, trim: true, default: "", maxlength: 500 },
      tiktok: { type: String, trim: true, default: "", maxlength: 500 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InfluenceBrandProfile", brandProfileSchema);
