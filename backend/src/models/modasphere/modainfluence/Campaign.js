const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BrandProfile",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    platforms: [
      {
        type: String,
        trim: true,
      },
    ],

    deliverables: [
      {
        type: String,
        trim: true,
      },
    ],

    budget: {
      type: Number,
      min: 0,
    },

    requirements: [
      {
        type: String,
        trim: true,
      },
    ],

    applicationDeadline: {
      type: Date,
    },

    campaignStartDate: {
      type: Date,
    },

    campaignEndDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Campaign", campaignSchema);