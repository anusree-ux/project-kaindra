const mongoose = require("mongoose");

const brandProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    brandName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    logo: {
      type: String,
      trim: true,
    },

    website: {
      type: String,
      trim: true,
    },

    industry: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    location: {
      type: String,
      trim: true,
      maxlength: 100,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BrandProfile", brandProfileSchema);