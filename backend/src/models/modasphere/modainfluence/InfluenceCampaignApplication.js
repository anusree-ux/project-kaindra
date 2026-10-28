const mongoose = require("mongoose");

const influenceCampaignApplicationSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InfluenceCampaign",
      required: true,
      index: true,
    },
    influencerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InfluenceCreatorProfile",
      required: true,
      index: true,
    },
    influencerSnapshot: {
      displayName: { type: String, trim: true, maxlength: 100 },
      category: { type: String, trim: true, maxlength: 100 },
      bio: { type: String, trim: true, maxlength: 2000 },
      website: { type: String, trim: true, maxlength: 500 },
      socialLinks: {
        instagram: { type: String, trim: true, maxlength: 500 },
        tiktok: { type: String, trim: true, maxlength: 500 },
        youtube: { type: String, trim: true, maxlength: 500 },
      },
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Withdrawn"],
      default: "Pending",
    },
    deletedAt: {
      type: Date,
      default: undefined,
    },
  },
  { timestamps: true }
);

influenceCampaignApplicationSchema.index(
  { campaign: 1, influencerProfile: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "InfluenceCampaignApplication",
  influenceCampaignApplicationSchema
);
