const mongoose = require("mongoose");

const modaTalesSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Story title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
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

    
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["New", "Reviewed", "Approved", "Rejected", "Removed"],
      default: "New",
    },

    publicationStatus: {
      type: String,
      enum: ["Draft", "Published"],
      default: "Published",
    },

    removedAt: {
      type: Date,
      default: null,
    },
    removedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    removalReason: {
      type: String,
      trim: true,
      maxlength: [500, "Removal reason cannot exceed 500 characters"],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const ModaTales = mongoose.model("ModaTales", modaTalesSchema);

module.exports = ModaTales;