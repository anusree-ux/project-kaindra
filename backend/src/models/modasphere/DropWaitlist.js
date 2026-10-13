const mongoose = require("mongoose");

const dropWaitlistSchema = new mongoose.Schema(
  {
    dropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Drop",
      required: [true, "Drop ID is required"],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    notified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

dropWaitlistSchema.index({ dropId: 1, userId: 1 }, { unique: true });

module.exports =
  mongoose.models.DropWaitlist ||
  mongoose.model("DropWaitlist", dropWaitlistSchema);
