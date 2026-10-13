const mongoose = require("mongoose");
const Product = require("../../models/modasphere/Product");
const Review = require("../../models/modasphere/Review");

/**
 * Recalculate average rating & review count for a product
 * @param {string|mongoose.Types.ObjectId} productId
 * @returns {Promise<{ averageRating: number, reviewCount: number }>}
 */
const recalculateProductRating = async (productId) => {
  const prodId = new mongoose.Types.ObjectId(productId);

  const stats = await Review.aggregate([
    { $match: { productId: prodId } },
    {
      $group: {
        _id: "$productId",
        reviewCount: { $sum: 1 },
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  let reviewCount = 0;
  let averageRating = 0;

  if (stats.length > 0 && stats[0].reviewCount > 0) {
    reviewCount = stats[0].reviewCount;
    averageRating = Math.round((stats[0].averageRating + Number.EPSILON) * 100) / 100;
  }

  await Product.findByIdAndUpdate(
    productId,
    {
      averageRating,
      reviewCount,
    },
    { returnDocument: "after" }
  );

  return { averageRating, reviewCount };
};

module.exports = {
  recalculateProductRating,
};
