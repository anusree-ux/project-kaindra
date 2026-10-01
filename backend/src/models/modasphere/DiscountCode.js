const mongoose = require("mongoose");

const discountCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Discount code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    discountType: {
      type: String,
      required: [true, "Discount type is required"],
      enum: ["percentage", "flat"],
    },

    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value cannot be negative"],
    },

    maxUsesPerUser: {
      type: Number,
      default: null,
      min: [1, "Max uses per user must be at least 1"],
    },

    maxTotalUses: {
      type: Number,
      default: null,
      min: [1, "Max total uses must be at least 1"],
    },

    expiryDate: {
      type: Date,
      default: null,
      index: true,
    },

    minOrderAmount: {
      type: Number,
      default: 0,
      min: [0, "Minimum order amount cannot be negative"],
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.DiscountCode ||
  mongoose.model("DiscountCode", discountCodeSchema);