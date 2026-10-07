const Order = require("../../models/modasphere/Order");
const Shipment = require("../../models/modasphere/Shipment");
const AppError = require("../../utils/AppError");

// Forward-only valid status transition map
const VALID_TRANSITIONS = {
  pending_pickup: ["picked_up", "in_transit", "failed_delivery"],
  picked_up: ["in_transit", "out_for_delivery", "failed_delivery"],
  in_transit: ["out_for_delivery", "delivered", "failed_delivery"],
  out_for_delivery: ["delivered", "failed_delivery"],
  failed_delivery: ["out_for_delivery", "delivered"],
  delivered: [], // Terminal status
};

/**
 * @desc    Update logistics/shipment status (Seller or Admin only)
 * @route   PATCH /api/modasphere/shipments/:orderId/status
 * @access  Private (Seller/Admin)
 */
const updateShipmentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;

    if (!status) {
      return next(new AppError("New shipment status is required.", 400));
    }

    const order = await Order.findById(orderId);
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
        new AppError("Not authorized to update shipment tracking for this order.", 403)
      );
    }

    if (order.status === "delivered" || order.status === "cancelled") {
      return next(
        new AppError(`Cannot update shipment status: Order is already "${order.status}".`, 400)
      );
    }

    const shipment = await Shipment.findOne({ orderId });
    if (!shipment) {
      return next(new AppError("Shipment record not found for this order.", 404));
    }

    const currentStatus = shipment.status;
    const allowedNext = VALID_TRANSITIONS[currentStatus] || [];

    if (!allowedNext.includes(status)) {
      return next(
        new AppError(
          `Invalid shipment status transition from "${currentStatus}" to "${status}".`,
          400
        )
      );
    }

    // Apply new status and append to timeline
    shipment.status = status;
    shipment.timeline.push({
      status,
      note: note || "",
      timestamp: new Date(),
    });
    await shipment.save();

    // If marked "delivered" via shipment update, also confirm parent order delivery
    if (status === "delivered" && order.status !== "delivered") {
      order.status = "delivered";
      await order.save();
    }

    res.status(200).json({
      status: "success",
      message: `Shipment status updated to "${status}".`,
      data: {
        shipment,
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get shipment tracking details by orderId (Buyer, Seller, or Admin)
 * @route   GET /api/modasphere/shipments/:orderId
 * @access  Private
 */
const getShipmentByOrderId = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return next(new AppError("Order not found.", 404));
    }

    const isBuyer =
      order.buyerId &&
      (order.buyerId._id || order.buyerId).toString() === req.user._id.toString();

    const isSeller =
      order.items &&
      order.items.some(
        (item) =>
          item.sellerId &&
          item.sellerId.toString() === req.user._id.toString()
      );
    const isAdmin = req.user.role === "admin";

    if (!isBuyer && !isSeller && !isAdmin) {
      return next(
        new AppError("Not authorized to view tracking details for this order.", 403)
      );
    }

    const shipment = await Shipment.findOne({ orderId });
    if (!shipment) {
      return next(new AppError("Shipment details not found for this order.", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        shipment,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateShipmentStatus,
  getShipmentByOrderId,
};
