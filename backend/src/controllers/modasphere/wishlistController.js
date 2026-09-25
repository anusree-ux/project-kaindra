const Wishlist = require("../../models/modasphere/Wishlist");
const Product = require("../../models/modasphere/Product");
const AppError = require("../../utils/AppError");

/**
 * @desc    Get user's wishlist (active products only)
 * @route   GET /api/modasphere/wishlist
 * @access  Private
 */
const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user._id }).populate({
      path: "productIds",
      select: "name price images stock status category sellerId",
    });

    if (!wishlist || !wishlist.productIds) {
      return res.status(200).json({
        status: "success",
        data: {
          wishlist: [],
          count: 0,
        },
      });
    }

    // Filter out inactive/archived products from the response without deleting them from DB
    const activeProducts = wishlist.productIds.filter(
      (product) => product && product.status === "active"
    );

    res.status(200).json({
      status: "success",
      data: {
        wishlist: activeProducts,
        count: activeProducts.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add product to wishlist (idempotent)
 * @route   POST /api/modasphere/wishlist/:productId
 * @access  Private
 */
const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError("Product not found.", 404));
    }

    let wishlist = await Wishlist.findOne({ userId: req.user._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        userId: req.user._id,
        productIds: [productId],
      });
    } else {
      const alreadyInWishlist = wishlist.productIds.some(
        (id) => id.toString() === productId
      );

      if (!alreadyInWishlist) {
        wishlist.productIds.push(productId);
        await wishlist.save();
      }
    }

    res.status(200).json({
      status: "success",
      message: "Product added to wishlist.",
      data: { inWishlist: true },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove product from wishlist
 * @route   DELETE /api/modasphere/wishlist/:productId
 * @access  Private
 */
const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ userId: req.user._id });

    if (wishlist) {
      wishlist.productIds = wishlist.productIds.filter(
        (id) => id.toString() !== productId
      );
      await wishlist.save();
    }

    res.status(200).json({
      status: "success",
      message: "Product removed from wishlist.",
      data: { inWishlist: false },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check if a product is in the user's wishlist
 * @route   GET /api/modasphere/wishlist/check/:productId
 * @access  Private
 */
const checkInWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({
      userId: req.user._id,
      productIds: productId,
    });

    res.status(200).json({
      status: "success",
      data: { inWishlist: !!wishlist },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkInWishlist,
};
