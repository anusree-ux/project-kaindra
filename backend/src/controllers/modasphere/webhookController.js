const crypto = require("crypto");
const Order = require("../../models/modasphere/Order");
const Shipment = require("../../models/modasphere/Shipment");
const env = require("../../config/environment");
const {
  finalizePaidOrder,
  refundCancelledOrderPayment,
} = require("../../services/modasphere/orderFinalizationService");

/**
 * Handle incoming Razorpay Webhook events.
 * Authenticated by signature only (X-Razorpay-Signature) using RAZORPAY_WEBHOOK_SECRET.
 *
 * @route POST /api/modasphere/webhooks/razorpay
 */
const handleRazorpayWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Razorpay Webhook Error] RAZORPAY_WEBHOOK_SECRET must be configured.");
    return res.status(500).json({ status: "error", message: "Webhook secret missing." });
  }

  // If req.rawBody is missing, return 500 and log (no JSON.stringify fallback)
  if (!req.rawBody) {
    console.error("[Razorpay Webhook Error] Raw request body missing on request.");
    return res.status(500).json({ status: "error", message: "Raw body missing." });
  }

  const signature = req.headers["x-razorpay-signature"];
  if (!signature) {
    return res.status(400).json({ status: "fail", message: "Missing Razorpay webhook signature." });
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(req.rawBody)
    .digest("hex");

  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
    return res.status(400).json({ status: "fail", message: "Invalid Razorpay webhook signature." });
  }

  let eventPayload;
  try {
    eventPayload = typeof req.body === "object" && req.body !== null
      ? req.body
      : JSON.parse(req.rawBody.toString("utf8"));
  } catch (parseErr) {
    return res.status(400).json({ status: "fail", message: "Malformed JSON payload." });
  }

  const { event, payload } = eventPayload;

  try {
    if (event === "payment.captured" || event === "order.paid") {
      const razorpayOrderId = payload?.payment?.entity?.order_id || payload?.order?.entity?.id;
      const razorpayPaymentId = payload?.payment?.entity?.id;

      if (!razorpayOrderId) {
        console.warn("[Razorpay Webhook] Payload does not contain razorpayOrderId.");
        return res.status(200).json({ status: "success", message: "No razorpayOrderId provided." });
      }

      const order = await Order.findOne({ razorpayOrderId });
      if (!order) {
        console.warn(`[Razorpay Webhook] Unknown order with razorpayOrderId: ${razorpayOrderId}`);
        return res.status(200).json({ status: "success", message: "Unknown order." });
      }

      if (order.status === "paid") {
        return res.status(200).json({ status: "success", message: "Order already paid." });
      }

      if (order.status === "cancelled") {
        await refundCancelledOrderPayment(order._id, razorpayPaymentId);
        return res.status(200).json({ status: "success", message: "Order was cancelled; refund handled." });
      }

      const { outcome } = await finalizePaidOrder(order._id, razorpayPaymentId);
      // Handled outcomes (paid, already_paid, out_of_stock, not_pending) return 200
      return res.status(200).json({ status: "success", message: `Outcome: ${outcome}` });
    }

    if (event === "payment.failed") {
      const razorpayOrderId = payload?.payment?.entity?.order_id;
      console.log(`[Razorpay Webhook] Payment failed for razorpayOrderId: ${razorpayOrderId}. Order unchanged.`);
      return res.status(200).json({ status: "success", message: "Payment failure acknowledged." });
    }

    console.log(`[Razorpay Webhook] Ignored unhandled event: "${event}".`);
    return res.status(200).json({ status: "success", message: "Event ignored." });
  } catch (err) {
    console.error("[Razorpay Webhook] Unexpected error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error." });
  }
};

const handleShiprocketWebhook = async (req, res) => {
  try {
    const webhookSecret = env.shiprocket.webhookSecret;
    console.log("[Shiprocket Debug]", {
      configured: !!webhookSecret,
      secretLength: webhookSecret?.length,
    });

    if (!webhookSecret) {
      console.error("[Delivery Webhook] Webhook secret is not configured.");
      return res.status(500).json({
        status: "error",
        message: "Webhook secret is not configured.",
      });
    }

    const receivedKey = req.headers["x-api-key"];

    if (
      typeof receivedKey !== "string" ||
      Buffer.byteLength(receivedKey) !== Buffer.byteLength(webhookSecret) ||
      !crypto.timingSafeEqual(
        Buffer.from(receivedKey),
        Buffer.from(webhookSecret)
      )
    ) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid webhook authentication.",
      });
    }

    const payload = req.body;

    if (!payload || typeof payload !== "object" || !payload.awb) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid delivery update payload.",
      });
    }

    const shipment = await Shipment.findOne({
      provider: "shiprocket",
      awbCode: String(payload.awb),
    });

    if (
        !shipment ||
        (shipment.isMock &&
          !(env.shiprocket.mockMode && env.nodeEnv !== "production"))
      ) {
          return res.status(200).json({
            status: "success",
            message: "Shipment not found or not eligible for updates.",
          });
        }

    const statusMap = {
      42: "picked_up",
      18: "in_transit",
      17: "out_for_delivery",
      7: "delivered",
      21: "failed_delivery",
    };

    const newStatus = statusMap[Number(payload.shipment_status_id)];

    if (!newStatus) {
      return res.status(200).json({
        status: "success",
        message: "Status acknowledged without an update.",
      });
    }

    const statusOrder = {
      pending_pickup: 0,
      picked_up: 1,
      in_transit: 2,
      out_for_delivery: 3,
      failed_delivery: 3,
      delivered: 4,
    };

    if (
      shipment.status === newStatus ||
      shipment.status === "delivered" ||
      statusOrder[newStatus] < statusOrder[shipment.status]
    ) {
      return res.status(200).json({
        status: "success",
        message: "Duplicate or outdated update ignored.",
      });
    }

    const timestamp = payload.current_timestamp
      ? new Date(payload.current_timestamp)
      : new Date();

    shipment.status = newStatus;
    shipment.timeline.push({
      status: newStatus,
      note: `Shiprocket update: ${payload.shipment_status || payload.current_status || newStatus}`,
      timestamp: Number.isNaN(timestamp.getTime()) ? new Date() : timestamp,
    });

    await shipment.save();

    const order = await Order.findById(shipment.orderId);

    if (order && order.status !== "cancelled") {
      if (
        ["picked_up", "in_transit", "out_for_delivery"].includes(newStatus) &&
        order.status === "paid"
      ) {
        order.status = "shipped";
        await order.save();
      }

      if (newStatus === "delivered" && order.status !== "delivered") {
        order.status = "delivered";
        await order.save();
      }
    }

    return res.status(200).json({
      status: "success",
      message: "Delivery update processed.",
    });
  } catch (error) {
    console.error("[Delivery Webhook] Processing failed:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to process delivery update.",
    });
  }
};

module.exports = {
  handleRazorpayWebhook,
  handleShiprocketWebhook,
};
