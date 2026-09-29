const Product = require("../../models/modasphere/Product");
const Order = require("../../models/modasphere/Order");
const Review = require("../../models/modasphere/Review");
const { recalculateProductRating } = require("../../services/modasphere/reviewService");
const AppError = require("../../utils/AppError");

/**
 * @desc    Create a product review (Delivered purchase verified)
 * @route   POST /api/modasphere/products/:productId/reviews
 * @access  Private (Buyer with delivered order)
 */
const createReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError("Product not found.", 404));
    }

    // Validate rating
    if (rating === undefined || rating === null) {
      return next(new AppError("Rating is required.", 400));
    }
    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return next(new AppError("Rating must be a number between 1 and 5.", 400));
    }

    if (comment && comment.length > 500) {
      return next(new AppError("Review comment cannot exceed 500 characters.", 400));
    }

    // Verify requesting user has a "delivered" Order containing this product
    const deliveredOrder = await Order.findOne({
      buyerId: req.user._id,
      status: "delivered",
      "items.productId": productId,
    });

    if (!deliveredOrder) {
      return next(
        new AppError(
          "You can only review products from delivered orders that you have purchased.",
          403
        )
      );
    }

    let review;
    try {
      review = await Review.create({
        productId,
        userId: req.user._id,
        rating: numericRating,
        comment: comment || "",
      });
    } catch (err) {
      if (err.code === 11000) {
        return next(
          new AppError("You have already submitted a review for this product.", 400)
        );
      }
      throw err;
    }

    await recalculateProductRating(productId);

    res.status(201).json({
      status: "success",
      message: "Review submitted successfully.",
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing review
 * @route   PATCH /api/modasphere/products/:productId/reviews/:reviewId
 * @access  Private (Review owner only)
 */
const updateReview = async (req, res, next) => {
  try {
    const { productId, reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findOne({ _id: reviewId, productId });
    if (!review) {
      return next(new AppError("Review not found for this product.", 404));
    }

    if (review.userId.toString() !== req.user._id.toString()) {
      return next(new AppError("You are not authorized to update this review.", 403));
    }

    if (rating !== undefined) {
      const numericRating = Number(rating);
      if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        return next(new AppError("Rating must be a number between 1 and 5.", 400));
      }
      review.rating = numericRating;
    }

    if (comment !== undefined) {
      if (comment && comment.length > 500) {
        return next(new AppError("Review comment cannot exceed 500 characters.", 400));
      }
      review.comment = comment;
    }

    await review.save();
    await recalculateProductRating(productId);

    res.status(200).json({
      status: "success",
      message: "Review updated successfully.",
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/modasphere/products/:productId/reviews/:reviewId
 * @access  Private (Review owner or Admin)
 */
const deleteReview = async (req, res, next) => {
  try {
    const { productId, reviewId } = req.params;

    const review = await Review.findOne({ _id: reviewId, productId });
    if (!review) {
      return next(new AppError("Review not found for this product.", 404));
    }

    const isOwner = review.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return next(new AppError("You are not authorized to delete this review.", 403));
    }

    await Review.findByIdAndDelete(reviewId);
    await recalculateProductRating(productId);

    res.status(200).json({
      status: "success",
      message: "Review deleted successfully.",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reviews for a product (paginated, latest first)
 * @route   GET /api/modasphere/products/:productId/reviews
 * @access  Public
 */
const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError("Product not found.", 404));
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ productId })
        .populate("userId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ productId }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        reviews,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit) || 1,
          limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get logged-in user's own review for a product
 * @route   GET /api/modasphere/products/:productId/reviews/me
 * @access  Private
 */
const getMyReview = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const review = await Review.findOne({
      productId,
      userId: req.user._id,
    }).populate("userId", "name");

    res.status(200).json({
      status: "success",
      data: {
        review: review || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  getProductReviews,
  getMyReview,
};
