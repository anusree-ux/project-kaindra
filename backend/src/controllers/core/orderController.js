const Order = require("../../models/core/Order");
const AppError = require("../../utils/AppError");

/**
 * @desc    Get all orders for the currently authenticated user
 * @route   GET /api/v1/orders/my-orders
 * @access  Private
 */
const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      status: "success",
      results: orders.length,
      data: {
        orders,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get order details by ID
 * @route   GET /api/v1/orders/:id
 * @access  Private
 */
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({
      $and: [
        { $or: [{ _id: id }, { orderNumber: id }] },
        { userId },
      ],
    });

    if (!order) {
      return next(new AppError("Order not found.", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new order for the authenticated user
 * @route   POST /api/v1/orders
 * @access  Private
 */
const createOrder = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      orderNumber,
      brand,
      items,
      totalAmount,
      currency,
      paymentStatus,
      orderStatus,
      shippingAddress,
      estimatedDelivery,
    } = req.body;

    const finalOrderNumber =
      orderNumber || `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder = await Order.create({
      userId,
      orderNumber: finalOrderNumber,
      brand: brand || "ModaMart",
      items,
      totalAmount,
      currency: currency || "INR",
      paymentStatus: paymentStatus || "paid",
      orderStatus: orderStatus || "Processing",
      shippingAddress,
      estimatedDelivery:
        estimatedDelivery || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });

    res.status(201).json({
      status: "success",
      data: {
        order: newOrder,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyOrders,
  getOrderById,
  createOrder,
};
