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

    content: {
      type: String,
      required: [true, "Article content is required"],
    },

    coverImage: {
      type: String,
      trim: true,
    },

    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Article author is required"],
    },

    category: {
      type: String,
      required: [true, "Article category is required"],
      trim: true,
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const ModaArticle = mongoose.model("ModaArticle", modaArticleSchema);

module.exports = ModaArticle;