const Cart = require("../../models/modasphere/Cart");
const Product = require("../../models/modasphere/Product");
const AppError = require("../../utils/AppError");

/**
 * Helper to format cart response and calculate subtotal & total items
 */
const formatCartResponse = (cart, unavailableItemsRemoved = false) => {
  const items = cart.items || [];
  let subtotal = 0;
  let totalItems = 0;

  const formattedItems = items.map((item) => {
    const product = item.productId;
    const price = product?.price || 0;
    const qty = item.quantity || 0;

    subtotal += price * qty;
    totalItems += qty;

    return {
      _id: item._id,
      product: product,
      quantity: qty,
      itemTotal: price * qty,
    };
  });

  return {
    _id: cart._id,
    userId: cart.userId,
    items: formattedItems,
    totalItems,
    subtotal,
    unavailableItemsRemoved,
    updatedAt: cart.updatedAt,
  };
};

/**
 * @desc    Get logged-in user's cart with live populated product data
 * @route   GET /api/modasphere/cart
 * @access  Private
 */
const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id }).populate({
      path: "items.productId",
      populate: { path: "sellerId", select: "name email" },
    });

    if (!cart) {
      return res.status(200).json({
        status: "success",
        data: {
          cart: {
            userId: req.user._id,
            items: [],
            totalItems: 0,
            subtotal: 0,
            unavailableItemsRemoved: false,
          },
        },
      });
    }

    // Filter out items where product was deleted or is no longer "active"
    const initialItemCount = cart.items.length;
    const activeItems = cart.items.filter(
      (item) => item.productId && item.productId.status === "active"
    );

    let unavailableItemsRemoved = false;
    if (activeItems.length !== initialItemCount) {
      unavailableItemsRemoved = true;
      cart.items = activeItems;
      await cart.save();
    }

    res.status(200).json({
      status: "success",
      data: {
        cart: formatCartResponse(cart, unavailableItemsRemoved),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add an item to the cart (or increase quantity if already present)
 * @route   POST /api/modasphere/cart/items
 * @access  Private
 */
const addItemToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return next(new AppError("Product ID is required.", 400));
    }

    const numQuantity = parseInt(quantity, 10);
    if (isNaN(numQuantity) || numQuantity < 1) {
      return next(new AppError("Quantity must be a positive number (minimum 1).", 400));
    }

    const product = await Product.findById(productId);
    if (!product || product.status !== "active") {
      return next(new AppError("Product not found or is currently unavailable.", 404));
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    let requestedTotalQty = numQuantity;
    if (existingItemIndex > -1) {
      requestedTotalQty = cart.items[existingItemIndex].quantity + numQuantity;
    }

    if (requestedTotalQty > product.stock) {
      return next(
        new AppError(
          `Cannot add ${numQuantity} item(s). Requested total (${requestedTotalQty}) exceeds available stock (${product.stock}).`,
          400
        )
      );
    }

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity = requestedTotalQty;
    } else {
      cart.items.push({ productId, quantity: numQuantity });
    }

    await cart.save();

    await cart.populate({
      path: "items.productId",
      populate: { path: "sellerId", select: "name email" },
    });

    res.status(200).json({
      status: "success",
      message: "Item added to cart successfully.",
      data: {
        cart: formatCartResponse(cart),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update quantity for an item already in the cart
 * @route   PATCH /api/modasphere/cart/items/:productId
 * @access  Private
 */
const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const numQuantity = parseInt(quantity, 10);
    if (isNaN(numQuantity) || numQuantity < 1) {
      return next(new AppError("Quantity must be a positive number (minimum 1).", 400));
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return next(new AppError("Cart not found.", 404));
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      return next(new AppError("Product is not in your cart.", 404));
    }

    const product = await Product.findById(productId);
    if (!product || product.status !== "active") {
      return next(new AppError("Product is no longer available.", 400));
    }

    if (numQuantity > product.stock) {
      return next(
        new AppError(
          `Requested quantity (${numQuantity}) exceeds available stock (${product.stock}).`,
          400
        )
      );
    }

    cart.items[itemIndex].quantity = numQuantity;
    await cart.save();

    await cart.populate({
      path: "items.productId",
      populate: { path: "sellerId", select: "name email" },
    });

    res.status(200).json({
      status: "success",
      message: "Cart item updated successfully.",
      data: {
        cart: formatCartResponse(cart),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove one item from the cart
 * @route   DELETE /api/modasphere/cart/items/:productId
 * @access  Private
 */
const removeCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return next(new AppError("Cart not found.", 404));
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId.toString()
    );

    if (cart.items.length === initialLength) {
      return next(new AppError("Product not found in cart.", 404));
    }

    await cart.save();

    await cart.populate({
      path: "items.productId",
      populate: { path: "sellerId", select: "name email" },
    });

    res.status(200).json({
      status: "success",
      message: "Item removed from cart.",
      data: {
        cart: formatCartResponse(cart),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear the entire cart
 * @route   DELETE /api/modasphere/cart
 * @access  Private
 */
const clearCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id });

    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({
      status: "success",
      message: "Cart cleared successfully.",
      data: {
        cart: {
          userId: req.user._id,
          items: [],
          totalItems: 0,
          subtotal: 0,
          unavailableItemsRemoved: false,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
