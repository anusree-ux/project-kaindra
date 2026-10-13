const crypto = require("crypto");
const {
  createRazorpayOrder,
  verifyPaymentSignature,
  initiateRefund,
} = require("../../src/services/modasphere/paymentService");

describe("ModaSphere Payment Service Unit Tests", () => {
  const savedEnv = { ...process.env };

  beforeEach(() => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_key123";
    process.env.RAZORPAY_KEY_SECRET = "rzp_test_secret456";
  });

  afterEach(() => {
    process.env.RAZORPAY_KEY_ID = savedEnv.RAZORPAY_KEY_ID || "rzp_test_key123";
    process.env.RAZORPAY_KEY_SECRET = savedEnv.RAZORPAY_KEY_SECRET || "rzp_test_secret456";
  });

  afterAll(() => {
    Object.keys(process.env).forEach((key) => {
      if (!(key in savedEnv)) delete process.env[key];
    });
    Object.assign(process.env, savedEnv);
  });

  describe("Configuration & Missing Credential Errors", () => {
    it("should throw a 500 configuration error if RAZORPAY_KEY_ID is missing when creating an order", async () => {
      delete process.env.RAZORPAY_KEY_ID;
      process.env.RAZORPAY_KEY_SECRET = "secret_test_123";

      await expect(createRazorpayOrder(1000, "receipt_1")).rejects.toThrow(
        /Razorpay API credentials missing/i
      );
    });

    it("should throw a 500 configuration error if RAZORPAY_KEY_SECRET is missing when creating an order", async () => {
      process.env.RAZORPAY_KEY_ID = "key_test_123";
      delete process.env.RAZORPAY_KEY_SECRET;

      await expect(createRazorpayOrder(1000, "receipt_1")).rejects.toThrow(
        /Razorpay API credentials missing/i
      );
    });

    it("should throw a 500 configuration error in verifyPaymentSignature if RAZORPAY_KEY_SECRET is missing", () => {
      delete process.env.RAZORPAY_KEY_SECRET;

      expect(() => {
        verifyPaymentSignature("order_123", "pay_123", "sig_123");
      }).toThrow(/Razorpay secret missing: RAZORPAY_KEY_SECRET must be configured/i);
    });

    it("should throw a 500 configuration error in initiateRefund if credentials are missing", async () => {
      delete process.env.RAZORPAY_KEY_SECRET;

      await expect(initiateRefund("pay_123", 5000)).rejects.toThrow(
        /Razorpay API credentials missing/i
      );
    });
  });

  describe("verifyPaymentSignature Logic", () => {
    const SECRET = "super_secure_rzp_test_secret_987";

    beforeEach(() => {
      process.env.RAZORPAY_KEY_SECRET = SECRET;
    });

    it("should return false if any signature parameter is falsy or missing", () => {
      expect(verifyPaymentSignature(null, "pay_1", "sig_1")).toBe(false);
      expect(verifyPaymentSignature("order_1", null, "sig_1")).toBe(false);
      expect(verifyPaymentSignature("order_1", "pay_1", "")).toBe(false);
    });

    it("should return true when the HMAC-SHA256 signature matches", () => {
      const orderId = "order_live_ABC123";
      const paymentId = "pay_live_XYZ789";
      const validSignature = crypto
        .createHmac("sha256", SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      const result = verifyPaymentSignature(orderId, paymentId, validSignature);
      expect(result).toBe(true);
    });

    it("should return false when a signature is forged or mismatched", () => {
      const orderId = "order_live_ABC123";
      const paymentId = "pay_live_XYZ789";
      const tamperedSignature = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

      const result = verifyPaymentSignature(orderId, paymentId, tamperedSignature);
      expect(result).toBe(false);
    });
  });
});
