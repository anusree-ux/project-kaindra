const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Seller email is required."],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    businessName: {
      type: String,
      required: [true, "Business / Store name is required."],
      trim: true,
    },
    ownerName: {
      type: String,
      default: "",
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      default: "apparel",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    location: {
      city: { type: String, default: "", trim: true },
      state: { type: String, default: "", trim: true },
      country: { type: String, default: "India", trim: true },
    },
    gstNumber: {
      type: String,
      default: "",
      trim: true,
    },
    minOrderQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    leadTimeDays: {
      type: Number,
      default: 3,
      min: 1,
    },
    capacity: {
      type: String,
      default: "Active Brand",
      trim: true,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "pending", "suspended"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const Seller = mongoose.model("Seller", sellerSchema);

module.exports = Seller;
