const mongoose = require("mongoose");

const campaignApplicationSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },

    influencer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InfluencerProfile",
      required: true,
    },

    message: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },

    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

campaignApplicationSchema.index(
  { campaign: 1, influencer: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "CampaignApplication",
  campaignApplicationSchema
);