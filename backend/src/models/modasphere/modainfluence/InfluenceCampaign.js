const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const influenceCampaignSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      default: () => randomUUID(),
      unique: true,
      sparse: true,
    },
    brandProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InfluenceBrandProfile",
      default: null,
      index: true,
    },

    brand: {
      type: String,
      required: [true, "Brand / Company is required"],
      trim: true,
      maxlength: 150,
    },

    email: {
      type: String,
      required: [true, "Email address is required"],
      trim: true,
      lowercase: true,
    },

    campaignType: {
      type: String,
      required: [true, "Campaign type is required"],
      trim: true,
      maxlength: 100,
    },

    title: {
      type: String,
      trim: true,
      maxlength: 150,
    },

    message: {
      type: String,
      required: [true, "Campaign description is required"],
      trim: true,
      maxlength: 3000,
    },

    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "InfluenceCampaign",
  influenceCampaignSchema
);
