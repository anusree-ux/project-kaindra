const Product = require("../../models/modasphere/Product");
const Order = require("../../models/modasphere/Order");
const Review = require("../../models/modasphere/Review");
const { recalculateProductRating } = require("../../services/modasphere/reviewService");
const AppError = require("../../utils/AppError");

/**
 * @desc    Create a product review for a delivered order
 * @route   POST /api/modasphere/products/:productId/reviews
 * @access  Private (Buyer with delivered order)
 */
const createReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { orderId, rating, comment } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError("Product not found.", 404));
    }

    if (!orderId) {
      return next(new AppError("Order ID is required to review a product.", 400));
    }

    if (rating === undefined || rating === null) {
      return next(new AppError("Rating is required.", 400));
    }
    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return next(new AppError("Rating must be a number between 1 and 5.", 400));
    }

    if (comment && comment.length > 1000) {
      return next(new AppError("Review comment cannot exceed 1000 characters.", 400));
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      productId,
      userId: req.user._id,
    });
    if (existingReview) {
      return next(
        new AppError("You have already submitted a review for this product.", 400)
      );
    }

    // Validate order
    const order = await Order.findById(orderId);
    if (!order) {
      return next(new AppError("Order not found.", 404));
    }

    if (order.buyerId.toString() !== req.user._id.toString()) {
      return next(new AppError("You can only review products from your own orders.", 403));
    }

    if (order.status !== "delivered") {
      return next(
        new AppError(
          `Cannot review item. Order status is "${order.status}", but review requires "delivered" status.`,
          400
        )
      );
    }

    const itemExists = order.items.some(
      (item) => item.productId.toString() === productId
    );
    if (!itemExists) {
      return next(
        new AppError("This order does not contain the specified product.", 400)
      );
    }

    let review;
    try {
      review = await Review.create({
        productId,
        userId: req.user._id,
        orderId: order._id,
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
 * @desc    Update own review
 * @route   PATCH /api/modasphere/reviews/:id
 * @access  Private (Owner only)
 */
const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return next(new AppError("Review not found.", 404));
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
      if (comment && comment.length > 1000) {
        return next(new AppError("Review comment cannot exceed 1000 characters.", 400));
      }
      review.comment = comment;
    }

    await review.save();
    await recalculateProductRating(review.productId);

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
 * @desc    Delete own review
 * @route   DELETE /api/modasphere/reviews/:id
 * @access  Private (Owner only)
 */
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return next(new AppError("Review not found.", 404));
    }

    if (review.userId.toString() !== req.user._id.toString()) {
      return next(new AppError("You are not authorized to delete this review.", 403));
    }

    const productId = review.productId;
    await Review.findByIdAndDelete(id);
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
 * @desc    Check if logged-in user can review a product
 * @route   GET /api/modasphere/products/:productId/can-review
 * @access  Private
 */
const canReviewProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // 1. Check if already reviewed
    const existingReview = await Review.findOne({
      productId,
      userId: req.user._id,
    });
    if (existingReview) {
      return res.status(200).json({
        status: "success",
        data: {
          canReview: false,
          reason: "You have already reviewed this product.",
        },
      });
    }

    // 2. Check if user has a delivered order containing this product
    const deliveredOrder = await Order.findOne({
      buyerId: req.user._id,
      status: "delivered",
      "items.productId": productId,
    });

    if (!deliveredOrder) {
      return res.status(200).json({
        status: "success",
        data: {
          canReview: false,
          reason: "You can only review products from delivered orders that you have purchased.",
        },
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        canReview: true,
        reason: "Eligible to review.",
        orderId: deliveredOrder._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  canReviewProduct,
};
