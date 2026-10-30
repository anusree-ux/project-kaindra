const mongoose = require("mongoose");

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      unique: true,
      index: true,
    },
    push: {
      enabled: {
        type: Boolean,
        default: true,
      },
      muted: {
        type: [String],
        default: [],
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "NotificationPreference",
  notificationPreferenceSchema
);
