const Razorpay = require("razorpay");
const crypto = require("crypto");
const AppError = require("../../utils/AppError");

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new AppError(
      "Razorpay API credentials missing: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured in environment variables.",
      500
    );
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
};

/**
 * Creates a Razorpay order
 * @param {number} amountInPaise - Amount in smallest currency unit (paise)
 * @param {string} receiptId - Internal order reference
 * @returns {Promise<{ razorpayOrderId: string, amount: number, currency: string }>}
 */
const createRazorpayOrder = async (amountInPaise, receiptId) => {
  try {
    const razorpay = getRazorpayInstance();
    const options = {
      amount: Math.round(amountInPaise),
      currency: "INR",
      receipt: String(receiptId),
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    return {
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Razorpay order creation error:", error);
    throw new AppError(`Razorpay order creation failed: ${error.message}`, 500);
  }
};

/**
 * Verifies Razorpay payment signature
 * @param {string} razorpayOrderId
 * @param {string} razorpayPaymentId
 * @param {string} razorpaySignature
 * @returns {boolean}
 */
const verifyPaymentSignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new AppError(
      "Razorpay secret missing: RAZORPAY_KEY_SECRET must be configured for signature verification.",
      500
    );
  }

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return false;
  }

  const payload = `${razorpayOrderId}|${razorpayPaymentId}`;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return expectedSignature === razorpaySignature;
};

/**
 * Initiates a refund for a Razorpay payment
 * @param {string} razorpayPaymentId - Payment ID from Razorpay
 * @param {number} amountInPaise - Amount to refund in paise
 * @returns {Promise<{ refundId: string, status: string, amount: number }>}
 */
const initiateRefund = async (razorpayPaymentId, amountInPaise) => {
  if (!razorpayPaymentId) {
    throw new AppError("Razorpay Payment ID is required to initiate refund.", 400);
  }

  try {
    const razorpay = getRazorpayInstance();
    const refund = await razorpay.payments.refund(razorpayPaymentId, {
      amount: Math.round(amountInPaise),
    });

    return {
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Razorpay refund initiation error:", error);
    throw new AppError(`Razorpay refund initiation failed: ${error.message}`, 500);
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPaymentSignature,
  initiateRefund,
};
