const request = require("supertest");
const crypto = require("crypto");
const mongoose = require("mongoose");
const app = require("../../src/app");
const Product = require("../../src/models/modasphere/Product");
const Cart = require("../../src/models/modasphere/Cart");
const Order = require("../../src/models/modasphere/Order");
const {
  finalizePaidOrder,
  refundCancelledOrderPayment,
  expireStaleOrders,
} = require("../../src/services/modasphere/orderFinalizationService");
const { createTestUser } = require("../helpers/testUser");

// Mock Razorpay SDK
let mockRefundCount = 0;
jest.mock("razorpay", () => {
  return function MockRazorpay() {
    return {
      orders: {
        create: jest.fn(async (options) => ({
          id: `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          amount: options.amount,
          currency: options.currency || "INR",
          status: "created",
        })),
      },
      payments: {
        refund: jest.fn(async (paymentId, options) => {
          mockRefundCount++;
          if (paymentId === "pay_mock_refund_failure") {
            throw new Error("Razorpay refund gateway error");
          }
          return {
            id: `rfrnd_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            payment_id: paymentId,
            amount: options.amount,
            status: "processed",
          };
        }),
      },
    };
  };
});

describe("ModaSphere Razorpay Webhooks & Stale Order Expiry", () => {
  const TEST_KEY_SECRET = "rzp_test_mockSecret789";
  const TEST_WEBHOOK_SECRET = "rzp_webhook_mockSecretXYZ";

  let buyer;
  let nonBuyer;
  let seller;
  let product1;
  let product2;

  const validShippingAddress = {
    name: "Jane Buyer",
    phone: "9876543210",
    addressLine1: "456 Silk Road",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
  };

  const signWebhookPayload = (payloadString) => {
    return crypto
      .createHmac("sha256", TEST_WEBHOOK_SECRET)
      .update(Buffer.from(payloadString))
      .digest("hex");
  };

  beforeEach(async () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_mockKey123";
    process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;
    process.env.RAZORPAY_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;

    mockRefundCount = 0;

    await Order.deleteMany({});
    await Cart.deleteMany({});
    await Product.deleteMany({});

    seller = await createTestUser({ name: "Studio Moda", role: "user" });
    buyer = await createTestUser({ name: "Jane Buyer", role: "user" });
    nonBuyer = await createTestUser({ name: "Stranger User", role: "user" });

    product1 = await Product.create({
      sellerId: seller.userId,
      name: "Couture Blazer",
      category: "apparel",
      price: 5000,
      stock: 10,
      status: "active",
      images: [{ url: "https://example.com/blazer.jpg", publicId: "blazer1" }],
    });

    product2 = await Product.create({
      sellerId: seller.userId,
      name: "Silk Scarf",
      category: "accessories",
      price: 1500,
      stock: 5,
      status: "active",
      images: [{ url: "https://example.com/scarf.jpg", publicId: "scarf1" }],
    });
  });

  afterAll(async () => {
    await Order.deleteMany({});
    await Cart.deleteMany({});
    await Product.deleteMany({});
  });

  describe("1. Webhook Signature & Event Verification", () => {
    it("valid signature on payment.captured marks a pending order paid, decrements stock once, clears the cart", async () => {
      // 1. Setup pending order and cart item
      const order = await Order.create({
        buyerId: buyer.userId,
        items: [{ productId: product1._id, sellerId: seller.userId, name: product1.name, price: 5000, quantity: 2 }],
        subtotalAmount: 10000,
        totalAmount: 10000,
        status: "pending_payment",
        razorpayOrderId: "order_wh_test_1",
        shippingAddress: validShippingAddress,
      });

      await Cart.create({
        userId: buyer.userId,
        items: [{ productId: product1._id, quantity: 2 }],
      });

      const payload = {
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: "pay_captured_123",
              order_id: "order_wh_test_1",
              amount: 1000000,
            },
          },
        },
      };

      const rawBody = JSON.stringify(payload);
      const signature = signWebhookPayload(rawBody);

      const res = await request(app)
        .post("/api/modasphere/webhooks/razorpay")
        .set("Content-Type", "application/json")
        .set("x-razorpay-signature", signature)
        .send(rawBody);

      expect(res.status).toBe(200);

      // Verify order is paid
      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder.status).toBe("paid");
      expect(updatedOrder.razorpayPaymentId).toBe("pay_captured_123");

      // Verify stock decremented: 10 - 2 = 8
      const p1 = await Product.findById(product1._id);
      expect(p1.stock).toBe(8);

      // Verify buyer's cart cleared
      const cart = await Cart.findOne({ userId: buyer.userId });
      expect(cart.items).toHaveLength(0);
    });

    it("invalid or missing signature returns 400 and changes nothing", async () => {
      const order = await Order.create({
        buyerId: buyer.userId,
        items: [{ productId: product1._id, sellerId: seller.userId, name: product1.name, price: 5000, quantity: 1 }],
        subtotalAmount: 5000,
        totalAmount: 5000,
        status: "pending_payment",
        razorpayOrderId: "order_wh_test_bad_sig",
        shippingAddress: validShippingAddress,
      });

      const payload = {
        event: "payment.captured",
        payload: {
          payment: {
            entity: { id: "pay_bad", order_id: "order_wh_test_bad_sig" },
          },
        },
      };
      const rawBody = JSON.stringify(payload);

      // Missing signature
      const resNoSig = await request(app)
        .post("/api/modasphere/webhooks/razorpay")
        .set("Content-Type", "application/json")
        .send(rawBody);

      expect(resNoSig.status).toBe(400);

      // Invalid signature
      const resBadSig = await request(app)
        .post("/api/modasphere/webhooks/razorpay")
        .set("Content-Type", "application/json")
        .set("x-razorpay-signature", "wrong_signature_hex_value")
        .send(rawBody);

      expect(resBadSig.status).toBe(400);

      // Verify order and stock untouched
      const dbOrder = await Order.findById(order._id);
      expect(dbOrder.status).toBe("pending_payment");
      const p1 = await Product.findById(product1._id);
      expect(p1.stock).toBe(10);
    });

    it("the same webhook delivered twice changes nothing the second time", async () => {
      const order = await Order.create({
        buyerId: buyer.userId,
        items: [{ productId: product1._id, sellerId: seller.userId, name: product1.name, price: 5000, quantity: 2 }],
        subtotalAmount: 10000,
        totalAmount: 10000,
        status: "pending_payment",
        razorpayOrderId: "order_wh_duplicate_test",
        shippingAddress: validShippingAddress,
      });

      const payload = {
        event: "payment.captured",
        payload: {
          payment: {
            entity: { id: "pay_dup_999", order_id: "order_wh_duplicate_test" },
          },
        },
      };
      const rawBody = JSON.stringify(payload);
      const signature = signWebhookPayload(rawBody);

      // Delivery 1
      const res1 = await request(app)
        .post("/api/modasphere/webhooks/razorpay")
        .set("Content-Type", "application/json")
        .set("x-razorpay-signature", signature)
        .send(rawBody);
      expect(res1.status).toBe(200);

      const pAfter1 = await Product.findById(product1._id);
      expect(pAfter1.stock).toBe(8);

      // Delivery 2 (Duplicate)
      const res2 = await request(app)
        .post("/api/modasphere/webhooks/razorpay")
        .set("Content-Type", "application/json")
        .set("x-razorpay-signature", signature)
        .send(rawBody);
      expect(res2.status).toBe(200);

      // Stock must still be 8 (NOT decremented twice)
      const pAfter2 = await Product.findById(product1._id);
      expect(pAfter2.stock).toBe(8);
    });
  });

  describe("2. Concurrency & Out-of-Stock Handling", () => {
    it("verify-payment and the webhook racing (call finalizePaidOrder twice concurrently) decrements stock exactly once", async () => {
      const order = await Order.create({
        buyerId: buyer.userId,
        items: [{ productId: product1._id, sellerId: seller.userId, name: product1.name, price: 5000, quantity: 3 }],
        subtotalAmount: 15000,
        totalAmount: 15000,
        status: "pending_payment",
        razorpayOrderId: "order_race_test",
        shippingAddress: validShippingAddress,
      });

      // Call finalizePaidOrder concurrently twice
      const [res1, res2] = await Promise.all([
        finalizePaidOrder(order._id, "pay_race_1"),
        finalizePaidOrder(order._id, "pay_race_2"),
      ]);

      const outcomes = [res1.outcome, res2.outcome];
      expect(outcomes).toContain("paid");
      expect(outcomes).toContain("already_paid");

      // Verify stock was decremented by 3 exactly once: 10 - 3 = 7
      const p1 = await Product.findById(product1._id);
      expect(p1.stock).toBe(7);
    });

    it("insufficient stock at finalization cancels the order, starts a refund, and leaves stock correct", async () => {
      // Deplete product1 stock to 1
      await Product.findByIdAndUpdate(product1._id, { stock: 1 });

      const order = await Order.create({
        buyerId: buyer.userId,
        items: [
          { productId: product2._id, sellerId: seller.userId, name: product2.name, price: 1500, quantity: 1 },
          { productId: product1._id, sellerId: seller.userId, name: product1.name, price: 5000, quantity: 2 }, // needs 2, only 1 available!
        ],
        subtotalAmount: 11500,
        totalAmount: 11500,
        status: "pending_payment",
        razorpayOrderId: "order_out_of_stock_test",
        shippingAddress: validShippingAddress,
      });

      const { order: finalizedOrder, outcome } = await finalizePaidOrder(
        order._id,
        "pay_out_of_stock"
      );

      expect(outcome).toBe("out_of_stock");
      expect(finalizedOrder.status).toBe("cancelled");
      expect(finalizedOrder.refundStatus).toBe("processed");
      expect(finalizedOrder.refundAmount).toBe(11500);

      // Verify product2 stock was restored (5 - 1 + 1 = 5)
      const p2 = await Product.findById(product2._id);
      expect(p2.stock).toBe(5);

      // Verify product1 stock stayed 1
      const p1 = await Product.findById(product1._id);
      expect(p1.stock).toBe(1);
    });

    it("out-of-stock during webhook finalization returns 200", async () => {
      await Product.findByIdAndUpdate(product1._id, { stock: 0 });

      const order = await Order.create({
        buyerId: buyer.userId,
        items: [{ productId: product1._id, sellerId: seller.userId, name: product1.name, price: 5000, quantity: 1 }],
        subtotalAmount: 5000,
        totalAmount: 5000,
        status: "pending_payment",
        razorpayOrderId: "order_wh_out_of_stock",
        shippingAddress: validShippingAddress,
      });

      const payload = {
        event: "payment.captured",
        payload: {
          payment: {
            entity: { id: "pay_oos_webhook", order_id: "order_wh_out_of_stock" },
          },
        },
      };

      const rawBody = JSON.stringify(payload);
      const signature = signWebhookPayload(rawBody);

      const res = await request(app)
        .post("/api/modasphere/webhooks/razorpay")
        .set("Content-Type", "application/json")
        .set("x-razorpay-signature", signature)
        .send(rawBody);

      // Webhook handled outcomes return 200
      expect(res.status).toBe(200);

      const dbOrder = await Order.findById(order._id);
      expect(dbOrder.status).toBe("cancelled");
      expect(dbOrder.refundStatus).toBe("processed");
    });

    it("a non-stock error mid-loop restores stock, leaves the order pending_payment, and does not refund", async () => {
      const order = await Order.create({
        buyerId: buyer.userId,
        items: [
          { productId: product1._id, sellerId: seller.userId, name: product1.name, price: 5000, quantity: 2 },
          { productId: product2._id, sellerId: seller.userId, name: product2.name, price: 1500, quantity: 1 },
        ],
        subtotalAmount: 11500,
        totalAmount: 11500,
        status: "pending_payment",
        razorpayOrderId: "order_mid_loop_error",
        shippingAddress: validShippingAddress,
      });

      // Mock Product.updateOne on the second item to simulate a database failure mid-loop
      const originalUpdateOne = Product.updateOne;
      let callCount = 0;
      jest.spyOn(Product, "updateOne").mockImplementation(async (filter, update) => {
        callCount++;
        if (callCount === 2) {
          throw new Error("Simulated database network timeout mid-loop");
        }
        return originalUpdateOne.call(Product, filter, update);
      });

      await expect(
        finalizePaidOrder(order._id, "pay_err_mid_loop")
      ).rejects.toThrow("Simulated database network timeout mid-loop");

      Product.updateOne.mockRestore();

      // Verify stock for product1 was restored back to 10
      const p1 = await Product.findById(product1._id);
      expect(p1.stock).toBe(10);

      // Verify order was reverted to pending_payment, and no refund was initiated
      const dbOrder = await Order.findById(order._id);
      expect(dbOrder.status).toBe("pending_payment");
      expect(dbOrder.refundStatus).toBe("none");
    });
  });

  describe("3. Expired & Cancelled Orders Webhooks & Multi-Refund Prevention", () => {
    it("payment.captured for an expired (cancelled) order starts a refund", async () => {
      const order = await Order.create({
        buyerId: buyer.userId,
        items: [{ productId: product1._id, sellerId: seller.userId, name: product1.name, price: 5000, quantity: 1 }],
        subtotalAmount: 5000,
        totalAmount: 5000,
        status: "cancelled", // expired
        refundStatus: "none",
        razorpayOrderId: "order_expired_paid_later",
        shippingAddress: validShippingAddress,
      });

      const payload = {
        event: "payment.captured",
        payload: {
          payment: {
            entity: { id: "pay_late_capture", order_id: "order_expired_paid_later" },
          },
        },
      };
      const rawBody = JSON.stringify(payload);
      const signature = signWebhookPayload(rawBody);

      const res = await request(app)
        .post("/api/modasphere/webhooks/razorpay")
        .set("Content-Type", "application/json")
        .set("x-razorpay-signature", signature)
        .send(rawBody);

      expect(res.status).toBe(200);

      const dbOrder = await Order.findById(order._id);
      expect(dbOrder.status).toBe("cancelled");
      expect(dbOrder.refundStatus).toBe("processed");
      expect(dbOrder.refundAmount).toBe(5000);
      expect(dbOrder.refundId).toMatch(/^rfrnd_mock_/);
    });

    it("payment.captured and order.paid for the same cancelled order delivered concurrently produce exactly ONE initiateRefund call and end with refundStatus 'processed'", async () => {
      const order = await Order.create({
        buyerId: buyer.userId,
        items: [{ productId: product1._id, sellerId: seller.userId, name: product1.name, price: 5000, quantity: 1 }],
        subtotalAmount: 5000,
        totalAmount: 5000,
        status: "cancelled",
        refundStatus: "none",
        razorpayOrderId: "order_concurrent_refund_test",
        shippingAddress: validShippingAddress,
      });

      const payloadPaymentCaptured = JSON.stringify({
        event: "payment.captured",
        payload: {
          payment: { entity: { id: "pay_concurrent_ref", order_id: "order_concurrent_refund_test" } },
        },
      });

      const payloadOrderPaid = JSON.stringify({
        event: "order.paid",
        payload: {
          order: { entity: { id: "order_concurrent_refund_test" } },
          payment: { entity: { id: "pay_concurrent_ref" } },
        },
      });

      const sig1 = signWebhookPayload(payloadPaymentCaptured);
      const sig2 = signWebhookPayload(payloadOrderPaid);

      // Fire both webhooks concurrently
      const [res1, res2] = await Promise.all([
        request(app)
          .post("/api/modasphere/webhooks/razorpay")
          .set("Content-Type", "application/json")
          .set("x-razorpay-signature", sig1)
          .send(payloadPaymentCaptured),
        request(app)
          .post("/api/modasphere/webhooks/razorpay")
          .set("Content-Type", "application/json")
          .set("x-razorpay-signature", sig2)
          .send(payloadOrderPaid),
      ]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);

      // Verify initiateRefund was called exactly ONCE
      expect(mockRefundCount).toBe(1);

      const dbOrder = await Order.findById(order._id);
      expect(dbOrder.refundStatus).toBe("processed");
    });

    it("payment.failed leaves the order unchanged", async () => {
      const order = await Order.create({
        buyerId: buyer.userId,
        items: [{ productId: product1._id, sellerId: seller.userId, name: product1.name, price: 5000, quantity: 1 }],
        subtotalAmount: 5000,
        totalAmount: 5000,
        status: "pending_payment",
        razorpayOrderId: "order_pay_failed_test",
        shippingAddress: validShippingAddress,
      });

      const payload = {
        event: "payment.failed",
        payload: {
          payment: {
            entity: { order_id: "order_pay_failed_test", error_description: "Card declined" },
          },
        },
      };

      const rawBody = JSON.stringify(payload);
      const signature = signWebhookPayload(rawBody);

      const res = await request(app)
        .post("/api/modasphere/webhooks/razorpay")
        .set("Content-Type", "application/json")
        .set("x-razorpay-signature", signature)
        .send(rawBody);

      expect(res.status).toBe(200);

      const dbOrder = await Order.findById(order._id);
      expect(dbOrder.status).toBe("pending_payment");
    });

    it("unknown event and unknown order return 200", async () => {
      // 1. Unknown event
      const unknownEventPayload = JSON.stringify({
        event: "refund.speed_changed",
        payload: {},
      });
      const sig1 = signWebhookPayload(unknownEventPayload);

      const resUnknownEvent = await request(app)
        .post("/api/modasphere/webhooks/razorpay")
        .set("Content-Type", "application/json")
        .set("x-razorpay-signature", sig1)
        .send(unknownEventPayload);

      expect(resUnknownEvent.status).toBe(200);

      // 2. Unknown order ID
      const unknownOrderPayload = JSON.stringify({
        event: "payment.captured",
        payload: {
          payment: { entity: { id: "pay_unknown", order_id: "order_does_not_exist" } },
        },
      });
      const sig2 = signWebhookPayload(unknownOrderPayload);

      const resUnknownOrder = await request(app)
        .post("/api/modasphere/webhooks/razorpay")
        .set("Content-Type", "application/json")
        .set("x-razorpay-signature", sig2)
        .send(unknownOrderPayload);

      expect(resUnknownOrder.status).toBe(200);
    });
  });

  describe("4. verifyPayment Buyer Ownership & Outcome Mapping", () => {
    it("verify-payment by a non-buyer returns 403 and changes nothing", async () => {
      const order = await Order.create({
        buyerId: buyer.userId,
        items: [{ productId: product1._id, sellerId: seller.userId, name: product1.name, price: 5000, quantity: 1 }],
        subtotalAmount: 5000,
        totalAmount: 5000,
        status: "pending_payment",
        razorpayOrderId: "order_non_buyer_test",
        shippingAddress: validShippingAddress,
      });

      const res = await request(app)
        .post(`/api/modasphere/orders/${order._id}/verify-payment`)
        .set("Authorization", `Bearer ${nonBuyer.token}`)
        .send({
          razorpayPaymentId: "pay_stranger",
          razorpaySignature: "dummy_sig",
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not authorized/i);

      // Order must remain pending_payment (non-buyer cannot trigger signature-fail cancel)
      const dbOrder = await Order.findById(order._id);
      expect(dbOrder.status).toBe("pending_payment");
    });

    it("verify-payment with a valid signature on an expired order does not return a success message and starts exactly one refund (409)", async () => {
      const rzpOrderId = "order_expired_verify";
      const paymentId = "pay_expired_verify";
      const validSignature = crypto
        .createHmac("sha256", TEST_KEY_SECRET)
        .update(`${rzpOrderId}|${paymentId}`)
        .digest("hex");

      const order = await Order.create({
        buyerId: buyer.userId,
        items: [{ productId: product1._id, sellerId: seller.userId, name: product1.name, price: 5000, quantity: 1 }],
        subtotalAmount: 5000,
        totalAmount: 5000,
        status: "cancelled", // expired
        refundStatus: "none",
        razorpayOrderId: rzpOrderId,
        shippingAddress: validShippingAddress,
      });

      const res = await request(app)
        .post(`/api/modasphere/orders/${order._id}/verify-payment`)
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({
          razorpayPaymentId: paymentId,
          razorpaySignature: validSignature,
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toBe("This order expired. Your payment is being refunded.");
      expect(res.body.data.order.status).toBe("cancelled");
      expect(res.body.data.order.refundStatus).toBe("processed");
      expect(mockRefundCount).toBe(1);
    });
  });

  describe("5. Stale Order Expiry Service", () => {
    it("expiry cancels only pending_payment orders older than the window, not newer ones and not paid ones", async () => {
      const twoHoursAgo = new Date(Date.now() - 120 * 60 * 1000);
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      // 1. Stale pending order (> 60m old)
      const staleOrder = await Order.create({
        buyerId: buyer.userId,
        items: [{ productId: product1._id, sellerId: seller.userId, name: product1.name, price: 5000, quantity: 1 }],
        subtotalAmount: 5000,
        totalAmount: 5000,
        status: "pending_payment",
        razorpayOrderId: "order_stale_1",
        shippingAddress: validShippingAddress,
        createdAt: twoHoursAgo,
      });

      // 2. Recent pending order (10m old)
      const recentOrder = await Order.create({
        buyerId: buyer.userId,
        items: [{ productId: product1._id, sellerId: seller.userId, name: product1.name, price: 5000, quantity: 1 }],
        subtotalAmount: 5000,
        totalAmount: 5000,
        status: "pending_payment",
        razorpayOrderId: "order_recent_1",
        shippingAddress: validShippingAddress,
        createdAt: tenMinutesAgo,
      });

      // 3. Paid order from two hours ago
      const paidOldOrder = await Order.create({
        buyerId: buyer.userId,
        items: [{ productId: product1._id, sellerId: seller.userId, name: product1.name, price: 5000, quantity: 1 }],
        subtotalAmount: 5000,
        totalAmount: 5000,
        status: "paid",
        razorpayOrderId: "order_paid_old",
        shippingAddress: validShippingAddress,
        createdAt: twoHoursAgo,
      });

      // Run expiry with 60-minute window
      const result = await expireStaleOrders(60);
      expect(result.modifiedCount).toBe(1);

      // Stale order cancelled
      const o1 = await Order.findById(staleOrder._id);
      expect(o1.status).toBe("cancelled");
      expect(o1.refundStatus).toBe("none");

      // Recent order stays pending_payment
      const o2 = await Order.findById(recentOrder._id);
      expect(o2.status).toBe("pending_payment");

      // Paid order stays paid
      const o3 = await Order.findById(paidOldOrder._id);
      expect(o3.status).toBe("paid");
    });
  });
});
