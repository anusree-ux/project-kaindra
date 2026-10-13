const Order = require("../../models/modasphere/Order");
const Product = require("../../models/modasphere/Product");
const Cart = require("../../models/modasphere/Cart");
const { initiateRefund } = require("./paymentService");
const AppError = require("../../utils/AppError");

/**
 * Atomically claims and initiates a refund for a cancelled or expired order.
 * Only one caller wins the transition from refundStatus "none" to "pending".
 *
 * @param {string|ObjectId} orderId
 * @param {string} razorpayPaymentId
 * @returns {Promise<{ order: Object, winner: boolean }>}
 */
const refundCancelledOrderPayment = async (orderId, razorpayPaymentId) => {
  if (!razorpayPaymentId) {
    return { order: await Order.findById(orderId), winner: false };
  }

  // Atomically claim the refund: only one caller wins
  const claimedOrder = await Order.findOneAndUpdate(
    {
      _id: orderId,
      status: "cancelled",
      refundStatus: "none",
    },
    {
      $set: {
        refundStatus: "pending",
        razorpayPaymentId,
      },
    },
    { new: true }
  );

  if (!claimedOrder) {
    const existing = await Order.findById(orderId);
    return { order: existing, winner: false };
  }

  // Only the winning caller invokes initiateRefund
  try {
    const amountInPaise = Math.round(claimedOrder.totalAmount * 100);
    const refundResult = await initiateRefund(razorpayPaymentId, amountInPaise);

    claimedOrder.refundStatus = "processed";
    claimedOrder.refundId = refundResult.refundId;
    claimedOrder.refundAmount = claimedOrder.totalAmount; // In Rupees (INR), matching cancelOrder
    claimedOrder.refundedAt = new Date();
    await claimedOrder.save();

    console.log(`[Refund] Successfully processed refund for cancelled order ${claimedOrder._id}`);
    return { order: claimedOrder, winner: true };
  } catch (refundError) {
    console.error(
      `[Refund Error] Failed to process refund for cancelled order ${claimedOrder._id}:`,
      refundError
    );
    claimedOrder.refundStatus = "failed";
    await claimedOrder.save();
    return { order: claimedOrder, winner: true };
  }
};

/**
 * Atomically finalizes a paid order.
 *
 * @param {string|ObjectId} orderId
 * @param {string} razorpayPaymentId
 * @param {string} [razorpaySignature]
 * @returns {Promise<{ order: Object, outcome: "paid" | "already_paid" | "out_of_stock" | "not_pending" }>}
 */
const finalizePaidOrder = async (orderId, razorpayPaymentId, razorpaySignature = null) => {
  const updateFields = {
    status: "paid",
    razorpayPaymentId,
  };
  if (razorpaySignature) {
    updateFields.razorpaySignature = razorpaySignature;
  }

  // Atomic race: only one caller wins transition from "pending_payment" to "paid"
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: orderId, status: "pending_payment" },
    { $set: updateFields },
    { new: true }
  );

  if (!updatedOrder) {
    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) {
      throw new AppError("Order not found.", 404);
    }
    if (existingOrder.status === "paid") {
      return { order: existingOrder, outcome: "already_paid" };
    }
    return { order: existingOrder, outcome: "not_pending" };
  }

  // Winner decrements stock conditionally: updateOne({ _id, stock: { $gte: qty } })
  const decrementedItems = [];
  let outOfStockFound = false;

  for (const item of updatedOrder.items) {
    try {
      const res = await Product.updateOne(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );

      if (res.modifiedCount === 0) {
        // Product ran out of stock
        outOfStockFound = true;
        break;
      }

      decrementedItems.push({
        productId: item.productId,
        quantity: item.quantity,
      });
    } catch (nonStockError) {
      // Non-stock error mid-loop (e.g. DB network drop):
      // Restore stock for items already decremented
      for (const dec of decrementedItems) {
        await Product.updateOne(
          { _id: dec.productId },
          { $inc: { stock: dec.quantity } }
        );
      }
      // Revert order back to pending_payment
      await Order.updateOne(
        { _id: orderId, status: "paid" },
        { $set: { status: "pending_payment" } }
      );
      throw nonStockError;
    }
  }

  if (outOfStockFound) {
    // Restore stock for items already decremented
    for (const dec of decrementedItems) {
      await Product.updateOne(
        { _id: dec.productId },
        { $inc: { stock: dec.quantity } }
      );
    }

    // Mark order cancelled
    updatedOrder.status = "cancelled";
    await updatedOrder.save();

    console.warn(`[Order Finalization] Out of stock for order ${updatedOrder._id}. Order cancelled; refund started.`);

    // Start refund via shared helper
    const refundRes = await refundCancelledOrderPayment(orderId, razorpayPaymentId);
    const finalOrder = refundRes?.order || updatedOrder;

    return { order: finalOrder, outcome: "out_of_stock" };
  }

  // Clear buyer's cart ONLY on successful finalization
  if (updatedOrder.buyerId) {
    const buyerUserId = updatedOrder.buyerId._id || updatedOrder.buyerId;
    await Cart.findOneAndUpdate({ userId: buyerUserId }, { $set: { items: [] } });
  }

  return { order: updatedOrder, outcome: "paid" };
};

/**
 * Cancels pending_payment orders older than expiryMinutes window.
 *
 * @param {number} [expiryMinutes]
 * @returns {Promise<{ modifiedCount: number }>}
 */
const expireStaleOrders = async (
  expiryMinutes = parseInt(process.env.STALE_ORDER_EXPIRY_MINUTES || "60", 10)
) => {
  try {
    const cutoff = new Date(Date.now() - expiryMinutes * 60 * 1000);
    const result = await Order.updateMany(
      {
        status: "pending_payment",
        createdAt: { $lt: cutoff },
      },
      {
        $set: { status: "cancelled" },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(
        `[Order Expiry] Expired ${result.modifiedCount} stale pending_payment order(s) older than ${expiryMinutes}m.`
      );
    }

    return result;
  } catch (err) {
    console.error("[Order Expiry Error]:", err.message || err);
    throw err;
  }
};

module.exports = {
  finalizePaidOrder,
  refundCancelledOrderPayment,
  expireStaleOrders,
};
