const mongoose = require("mongoose");

const influenceCampaignSchema = new mongoose.Schema(
  {
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

    message: {
      type: String,
      required: [true, "Campaign description is required"],
      trim: true,
      maxlength: 3000,
    },

    status: {
      type: String,
      enum: ["New", "Contacted", "In Progress", "Completed", "Rejected"],
      default: "New",
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