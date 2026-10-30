const mongoose = require("mongoose");

const pushSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      index: true,
    },
    endpoint: {
      type: String,
      required: [true, "endpoint is required"],
      unique: true,
      trim: true,
    },
    keys: {
      p256dh: {
        type: String,
        required: [true, "p256dh key is required"],
        trim: true,
      },
      auth: {
        type: String,
        required: [true, "auth key is required"],
        trim: true,
      },
    },
    userAgent: {
      type: String,
      default: "",
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Enforces maximum 10 active push subscriptions per user.
 * Evicts the subscriptions with the oldest lastUsedAt timestamp.
 *
 * @param {mongoose.Types.ObjectId|string} userId
 */
pushSubscriptionSchema.statics.enforceSubscriptionLimit = async function (userId) {
  const count = await this.countDocuments({ userId });
  if (count > 10) {
    const excess = count - 10;
    const oldestDocs = await this.find({ userId })
      .sort({ lastUsedAt: 1, createdAt: 1 })
      .limit(excess)
      .select("_id");

    const idsToDelete = oldestDocs.map((doc) => doc._id);
    if (idsToDelete.length > 0) {
      await this.deleteMany({ _id: { $in: idsToDelete } });
    }
  }
};

module.exports = mongoose.model("PushSubscription", pushSubscriptionSchema);
