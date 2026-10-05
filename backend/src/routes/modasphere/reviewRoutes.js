const express = require("express");
const {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  canReviewProduct,
} = require("../../controllers/modasphere/reviewController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// Product reviews & eligibility endpoints
router.get("/products/:productId/can-review", protect, canReviewProduct);
router.get("/products/:productId/reviews", getProductReviews);
router.post("/products/:productId/reviews", protect, createReview);

// Review management endpoints
router.patch("/reviews/:id", protect, updateReview);
router.delete("/reviews/:id", protect, deleteReview);

module.exports = router;
