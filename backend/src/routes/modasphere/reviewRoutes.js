const express = require("express");
const {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  canReviewProduct,
  getSellerReviews,
} = require("../../controllers/modasphere/reviewController");
const multer = require("multer");
const { protect } = require("../../middleware/authMiddleware");
const AppError = require("../../utils/AppError");

// Multer memory storage configuration (up to 5 review photos, 5MB max each)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new AppError("Only image files are allowed!", 400), false);
    }
  },
});

const router = express.Router();

// Seller reviews endpoint (returns only reviews for authenticated seller's products)
router.get("/reviews/seller/me", protect, getSellerReviews);
router.get("/reviews/seller", protect, getSellerReviews);
router.get("/seller/reviews", protect, getSellerReviews);

// Product reviews & eligibility endpoints
router.get("/products/:productId/can-review", protect, canReviewProduct);
router.get("/products/:productId/reviews", getProductReviews);
router.post("/products/:productId/reviews", protect, upload.array("images", 5), createReview);

// Review management endpoints
router.patch("/reviews/:id", protect, updateReview);
router.delete("/reviews/:id", protect, deleteReview);

module.exports = router;
