const mongoose = require("mongoose");

const designCommentSchema = new mongoose.Schema(
  {
    designId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Design",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: [true, "Comment message is required."],
      maxlength: [1000, "Comment cannot exceed 1000 characters."],
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

const DesignComment = mongoose.model("DesignComment", designCommentSchema);

module.exports = DesignComment;
