const Order = require("../../models/modasphere/Order");
const Cart = require("../../models/modasphere/Cart");
const Product = require("../../models/modasphere/Product");
const {
  createRazorpayOrder,
  verifyPaymentSignature,
  initiateRefund,
} = require("../../services/modasphere/paymentService");
const AppError = require("../../utils/AppError");

/**
 * @desc    Initiate checkout from user's Cart & generate Razorpay order
 * @route   POST /api/modasphere/orders/checkout
 * @access  Private
 */
const checkout = async (req, res, next) => {
  let order = null;
  try {
    const { shippingAddress } = req.body;

    if (
      !shippingAddress ||
      !shippingAddress.name ||
      !shippingAddress.phone ||
      !shippingAddress.addressLine1 ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.pincode
    ) {
      return next(
        new AppError("Complete shipping address is required for checkout.", 400)
      );
    }

    const cart = await Cart.findOne({ userId: req.user._id }).populate(
      "items.productId"
    );
    if (!cart || !cart.items || cart.items.length === 0) {
      return next(
        new AppError("Your cart is empty. Add products before checking out.", 400)
      );
    }

    const orderItems = [];
    let totalAmount = 0;

    // Validate stock and build order snapshot
    for (const item of cart.items) {
      const product = item.productId;
      if (!product || product.status !== "active") {
        return next(
          new AppError(
            `Product "${product?.name || "Item"}" is no longer available. Please update your cart.`,
            400
          )
        );
      }

      if (item.quantity > product.stock) {
        return next(
          new AppError(
            `Insufficient stock for "${product.name}". Requested ${item.quantity}, but only ${product.stock} left.`,
            400
          )
        );
      }

      const itemPrice = Number(product.price);
      totalAmount += itemPrice * item.quantity;

      orderItems.push({
        productId: product._id,
        sellerId: product.sellerId,
        name: product.name,
        price: itemPrice,
        quantity: item.quantity,
      });
    }

    // Create pending order
    order = await Order.create({
      buyerId: req.user._id,
      items: orderItems,
      totalAmount,
      status: "pending_payment",
      shippingAddress,
    });

    // Create Razorpay Order
    const amountInPaise = Math.round(totalAmount * 100);
    const razorpayOrder = await createRazorpayOrder(amountInPaise, order._id);

    order.razorpayOrderId = razorpayOrder.razorpayOrderId;
    await order.save();

    res.status(201).json({
      status: "success",
      message: "Order initiated. Please complete Razorpay payment.",
      data: {
        orderId: order._id,
        razorpayOrderId: razorpayOrder.razorpayOrderId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID || "",
      },
    });
  } catch (error) {
    // If Razorpay API call fails after order was created in DB, clean up the orphaned pending order
    if (order && order._id && !order.razorpayOrderId) {
      try {
        await Order.findByIdAndDelete(order._id);
      } catch (cleanupError) {
        console.error("Failed to clean up orphaned pending order:", cleanupError);
      }
    }
    next(error);
  }
};

/**
 * @desc    Verify Razorpay payment signature & finalize order
 * @route   POST /api/modasphere/orders/:id/verify-payment
 * @access  Private
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { razorpayPaymentId, razorpaySignature } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return next(new AppError("Order not found.", 404));
    }

    if (order.buyerId.toString() !== req.user._id.toString()) {
      return next(
        new AppError("Not authorized to verify payment for this order.", 403)
      );
    }

    if (order.status === "paid") {
      return res.status(200).json({
        status: "success",
        message: "Order is already paid.",
        data: { order },
      });
    }

    const isValid = verifyPaymentSignature(
      order.razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      order.status = "cancelled";
      await order.save();
      return next(
        new AppError(
          "Invalid payment signature verification. Order cancelled.",
          400
        )
      );
    }

    // Mark paid
    order.status = "paid";
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    await order.save();

    // Decrement stock for each product
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    // Clear user's Cart
    const cart = await Cart.findOne({ userId: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({
      status: "success",
      message: "Payment verified successfully. Order confirmed.",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get logged-in buyer's own orders
 * @route   GET /api/modasphere/orders/me
 * @access  Private
 */
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ buyerId: req.user._id })
      .populate("items.productId", "images category")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      data: { orders },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single order detail (Buyer, relevant Seller, or Admin)
 * @route   GET /api/modasphere/orders/:id
 * @access  Private
 */
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate(
      "buyerId",
      "name email phoneNumber"
    );

    if (!order) {
      return next(new AppError("Order not found.", 404));
    }

    const isBuyer =
      order.buyerId &&
      (order.buyerId._id || order.buyerId).toString() ===
        req.user._id.toString();
    const isSeller =
      order.items &&
      order.items.some(
        (item) =>
          item.sellerId &&
          item.sellerId.toString() === req.user._id.toString()
      );
    const isAdmin = req.user.role === "admin";

    if (!isBuyer && !isSeller && !isAdmin) {
      return next(new AppError("Not authorized to view this order.", 403));
    }

    let responseData = order.toObject();

    // Data privacy: if caller is a seller (not buyer or admin), restrict items and total to their own sold items
    if (isSeller && !isBuyer && !isAdmin) {
      const sellerItems = order.items.filter(
        (item) =>
          item.sellerId &&
          item.sellerId.toString() === req.user._id.toString()
      );
      const sellerSubtotal = sellerItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      responseData.items = sellerItems;
      responseData.sellerSubtotal = sellerSubtotal;
    }

    res.status(200).json({
      status: "success",
      data: { order: responseData },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get orders containing products sold by the logged-in seller
 * @route   GET /api/modasphere/orders/seller/me
 * @access  Private
 */
const getSellerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ "items.sellerId": req.user._id })
      .populate("buyerId", "name email")
      .sort({ createdAt: -1 });

    // Isolate only items belonging to this seller for each order
    const sellerOrders = orders.map((order) => {
      const orderObj = order.toObject();
      const sellerItems = (order.items || []).filter(
        (item) =>
          item.sellerId &&
          item.sellerId.toString() === req.user._id.toString()
      );
      const sellerSubtotal = sellerItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      orderObj.items = sellerItems;
      orderObj.sellerSubtotal = sellerSubtotal;
      return orderObj;
    });

    res.status(200).json({
      status: "success",
      data: { orders: sellerOrders },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ship an order (Seller only)
 * @route   PATCH /api/modasphere/orders/:id/ship
 * @access  Private
 */
const shipOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return next(new AppError("Order not found.", 404));
    }

    const isSeller =
      order.items &&
      order.items.some(
        (item) =>
          item.sellerId &&
          item.sellerId.toString() === req.user._id.toString()
      );
    const isAdmin = req.user.role === "admin";

    if (!isSeller && !isAdmin) {
      return next(
        new AppError("Not authorized to update shipment status for this order.", 403)
      );
    }

    if (order.status !== "paid") {
      return next(
        new AppError(
          `Cannot mark order as shipped. Current status is "${order.status}", but status must be "paid".`,
          400
        )
      );
    }

    // Known simplification: updates the whole order's status to "shipped", rather
    // than per-item / per-seller shipment tracking. Out of scope for now as single-seller orders are the common case.
    order.status = "shipped";
    await order.save();

    res.status(200).json({
      status: "success",
      message: "Order marked as shipped.",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Confirm delivery / receipt of an order (Buyer only)
 * @route   PATCH /api/modasphere/orders/:id/deliver
 * @access  Private
 */
const deliverOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return next(new AppError("Order not found.", 404));
    }

    const isBuyer =
      order.buyerId &&
      (order.buyerId._id || order.buyerId).toString() ===
        req.user._id.toString();

    if (!isBuyer) {
      return next(
        new AppError("Not authorized to confirm delivery for this order.", 403)
      );
    }

    if (order.status !== "shipped") {
      return next(
        new AppError(
          `Cannot mark order as delivered. Current status is "${order.status}", but status must be "shipped".`,
          400
        )
      );
    }

    order.status = "delivered";
    await order.save();

    res.status(200).json({
      status: "success",
      message: "Order marked as delivered.",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel an order (Buyer only)
 * @route   PATCH /api/modasphere/orders/:id/cancel
 * @access  Private
 */
const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return next(new AppError("Order not found.", 404));
    }

    const isBuyer =
      order.buyerId &&
      (order.buyerId._id || order.buyerId).toString() ===
        req.user._id.toString();

    if (!isBuyer) {
      return next(
        new AppError("Not authorized to cancel this order.", 403)
      );
    }

    if (order.status !== "pending_payment" && order.status !== "paid") {
      return next(
        new AppError(
          `Cannot cancel order. Current status is "${order.status}". Orders can only be cancelled when in "pending_payment" or "paid" status.`,
          400
        )
      );
    }

    // If cancelling a paid order, restore product stock and initiate Razorpay refund
    if (order.status === "paid") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
        });
      }

      order.status = "cancelled";

      if (order.razorpayPaymentId) {
        order.refundStatus = "pending";
        try {
          const amountInPaise = Math.round(order.totalAmount * 100);
          const refundResult = await initiateRefund(
            order.razorpayPaymentId,
            amountInPaise
          );
          order.refundStatus = "processed";
          order.refundId = refundResult.refundId;
          order.refundAmount = order.totalAmount;
          order.refundedAt = new Date();
        } catch (refundError) {
          console.error(
            `[ModaSphere Refund Error] Failed to process refund for order ${order._id}:`,
            refundError
          );
          // Do NOT roll back order cancellation or stock restoration
          order.refundStatus = "failed";
        }
      }
    } else {
      // For pending_payment orders, no payment occurred so skip refund
      order.status = "cancelled";
    }

    await order.save();

    res.status(200).json({
      status: "success",
      message: "Order cancelled successfully.",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get refund status of an order (Buyer or Admin only)
 * @route   GET /api/modasphere/orders/:id/refund-status
 * @access  Private
 */
const getRefundStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return next(new AppError("Order not found.", 404));
    }

    const isBuyer =
      order.buyerId &&
      (order.buyerId._id || order.buyerId).toString() ===
        req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isBuyer && !isAdmin) {
      return next(
        new AppError("Not authorized to view refund status for this order.", 403)
      );
    }

    res.status(200).json({
      status: "success",
      data: {
        orderId: order._id,
        refundStatus: order.refundStatus,
        refundId: order.refundId,
        refundAmount: order.refundAmount,
        refundedAt: order.refundedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Retry a failed refund (Admin only)
 * @route   POST /api/modasphere/orders/:id/retry-refund
 * @access  Private (Admin)
 */
const retryRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return next(new AppError("Order not found.", 404));
    }

    if (order.status !== "cancelled") {
      return next(
        new AppError(
          `Only cancelled orders can be refunded. Current status is "${order.status}".`,
          400
        )
      );
    }

    if (order.refundStatus === "processed") {
      return next(
        new AppError("Refund has already been processed for this order.", 400)
      );
    }

    if (!order.razorpayPaymentId) {
      return next(
        new AppError("Cannot process refund: No Razorpay Payment ID found on order.", 400)
      );
    }

    order.refundStatus = "pending";
    try {
      const amountInPaise = Math.round(order.totalAmount * 100);
      const refundResult = await initiateRefund(
        order.razorpayPaymentId,
        amountInPaise
      );
      order.refundStatus = "processed";
      order.refundId = refundResult.refundId;
      order.refundAmount = order.totalAmount;
      order.refundedAt = new Date();
      await order.save();

      res.status(200).json({
        status: "success",
        message: "Refund retried and processed successfully.",
        data: {
          orderId: order._id,
          refundStatus: order.refundStatus,
          refundId: order.refundId,
          refundAmount: order.refundAmount,
          refundedAt: order.refundedAt,
        },
      });
    } catch (refundError) {
      console.error(
        `[ModaSphere Retry Refund Error] Failed to retry refund for order ${order._id}:`,
        refundError
      );
      order.refundStatus = "failed";
      await order.save();
      return next(
        new AppError(`Refund retry failed: ${refundError.message}`, 500)
      );
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkout,
  verifyPayment,
  getMyOrders,
  getOrderById,
  getSellerOrders,
  shipOrder,
  deliverOrder,
  cancelOrder,
  getRefundStatus,
  retryRefund,
};
