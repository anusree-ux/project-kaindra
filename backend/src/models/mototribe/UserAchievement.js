const mongoose = require("mongoose");

const userAchievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    badgeKey: {
      type: String,
      required: true,
    },
    earnedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent earning the same badge twice
userAchievementSchema.index({ userId: 1, badgeKey: 1 }, { unique: true });

const UserAchievement = mongoose.model(
  "UserAchievement",
  userAchievementSchema
);

module.exports = UserAchievement;
