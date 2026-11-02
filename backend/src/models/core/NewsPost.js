const mongoose = require("mongoose");

const newsPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Post title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Post description is required"],
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters"],
    },
    content: {
      type: String,
      required: [true, "Post content is required"],
      trim: true,
      maxlength: [50000, "Content cannot exceed 50000 characters"],
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2048, "Image URL cannot exceed 2048 characters"],
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  { timestamps: true }
);

newsPostSchema.index({ status: 1, publishedAt: -1 });

module.exports = mongoose.model("NewsPost", newsPostSchema);
