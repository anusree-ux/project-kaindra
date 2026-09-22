const mongoose = require("mongoose");

const modaArticleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Article title is required"],
      trim: true,
      maxlength: [200, "Article title cannot exceed 200 characters"],
    },

    slug: {
      type: String,
      required: [true, "Article slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    excerpt: {
      type: String,
      trim: true,
      maxlength: [500, "Article excerpt cannot exceed 500 characters"],
    },

    content: {
      type: String,
      required: [true, "Article content is required"],
    },

    coverImage: {
      type: String,
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Article category is required"],
      trim: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Article creator is required"],
    },

    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const ModaArticle = mongoose.model(
  "ModaArticle",
  modaArticleSchema
);

module.exports = ModaArticle;