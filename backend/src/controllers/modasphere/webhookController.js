const crypto = require("crypto");
const Order = require("../../models/modasphere/Order");
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

module.exports = {
  handleRazorpayWebhook,
};
