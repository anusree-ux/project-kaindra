const express = require("express");
const {
  createReview,
  updateReview,
  deleteReview,
  getProductReviews,
  getMyReview,
} = require("../../controllers/modasphere/reviewController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// Register /products/:productId/reviews/me explicitly before other review endpoints
router.get("/products/:productId/reviews/me", protect, getMyReview);
router.get("/products/:productId/reviews", getProductReviews);
router.post("/products/:productId/reviews", protect, createReview);
router.patch("/products/:productId/reviews/:reviewId", protect, updateReview);
router.delete("/products/:productId/reviews/:reviewId", protect, deleteReview);

module.exports = router;
