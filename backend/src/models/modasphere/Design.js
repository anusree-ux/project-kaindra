const mongoose = require("mongoose");

const designAssetSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    resourceType: {
      type: String,
      enum: ["image", "raw"],
      required: true,
    },
    fileName: {
      type: String,
      default: "",
    },
    note: {
      type: String,
      default: "",
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const collaboratorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["viewer", "editor"],
      required: true,
    },
  },
  { _id: true }
);

const designSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Design title is required."],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [2000, "Description cannot exceed 2000 characters."],
      default: "",
      trim: true,
    },
    category: {
      type: String,
      default: "general",
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "in_progress", "ready_for_production", "archived"],
      default: "draft",
    },
    visibility: {
      type: String,
      enum: ["private", "collaborators", "public"],
      default: "private",
    },
    assets: {
      type: [designAssetSchema],
      default: [],
    },
    collaborators: {
      type: [collaboratorSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Design = mongoose.model("Design", designSchema);

module.exports = Design;
