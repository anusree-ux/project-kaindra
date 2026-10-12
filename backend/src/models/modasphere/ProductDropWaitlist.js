const mongoose = require("mongoose");

const productDropWaitlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent the same user from joining the same product waitlist twice
productDropWaitlistSchema.index(
  { userId: 1, productId: 1 },
  { unique: true }
);

// Helps retrieve the waitlist in queue order
productDropWaitlistSchema.index({
  productId: 1,
  joinedAt: 1,
});

module.exports = mongoose.model(
  "ProductDropWaitlist",
  productDropWaitlistSchema
);