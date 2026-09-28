const mongoose = require("mongoose");

const modaTalesSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },

    storyType: {
      type: String,
      required: [true, "Story type is required"],
      trim: true,
      maxlength: [100, "Story type cannot exceed 100 characters"],
    },

    message: {
      type: String,
      required: [true, "Story message is required"],
      trim: true,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["New", "Reviewed", "Approved", "Rejected"],
      default: "New",
    },
  },
  {
    timestamps: true,
  }
);

const ModaTales = mongoose.model("ModaTales", modaTalesSchema);

module.exports = ModaTales;