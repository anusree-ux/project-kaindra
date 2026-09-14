const mongoose = require("mongoose");

const modaOrganizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
      maxlength: [150, "Organization name cannot exceed 150 characters"],
    },

    slug: {
      type: String,
      required: [true, "Organization slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    type: {
      type: String,
      required: [true, "Organization type is required"],
      enum: [
        "brand",
        "manufacturer",
        "supplier",
        "retailer",
        "fashion_house",
        "collective",
        "marketplace_partner",
      ],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    location: {
      type: String,
      trim: true,
    },

    website: {
      type: String,
      trim: true,
    },

    logo: {
      type: String,
      trim: true,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const ModaOrganization = mongoose.model(
  "ModaOrganization",
  modaOrganizationSchema
);

module.exports = ModaOrganization;