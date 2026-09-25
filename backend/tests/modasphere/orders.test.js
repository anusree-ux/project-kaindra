const request = require("supertest");
const mongoose = require("mongoose");
const crypto = require("crypto");
const app = require("../../src/app");
const Product = require("../../src/models/modasphere/Product");
const Cart = require("../../src/models/modasphere/Cart");
const Order = require("../../src/models/modasphere/Order");
const { createTestUser } = require("../helpers/testUser");

// Mock the Razorpay SDK library constructor
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

describe("ModaSphere Orders & Razorpay Payment Integration (ModaPay)", () => {
  const TEST_KEY_SECRET = "rzp_test_mockSecret789";
  const TEST_KEY_ID = "rzp_test_mockKey123";

  let buyer;
  let seller;
  let otherUser;
  let adminUser;
  let product1;
  let product2;

  const validShippingAddress = {
    name: "John Doe",
    phone: "9876543210",
    addressLine1: "123 Fashion Blvd",
    addressLine2: "Suite 4B",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
  };

  beforeEach(async () => {
    // Explicitly set real mock env vars before running payment-related tests
    process.env.RAZORPAY_KEY_ID = TEST_KEY_ID;
    process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;

    await Order.deleteMany({});
    await Cart.deleteMany({});
    await Product.deleteMany({});

    seller = await createTestUser({ name: "Moda Designer Studio", role: "user" });
    buyer = await createTestUser({ name: "Alice Shopper", role: "user" });
    otherUser = await createTestUser({ name: "Bob Bystander", role: "user" });
    adminUser = await createTestUser({ name: "Admin Manager", role: "admin" });

    // Create products
    product1 = await Product.create({
      sellerId: seller.userId,
      name: "Designer Silk Gown",
      description: "Handcrafted couture gown",
      category: "apparel",
      price: 10000,
      stock: 5,
      status: "active",
      images: [{ url: "https://example.com/gown.jpg", publicId: "gown1" }],
    });

    product2 = await Product.create({
      sellerId: seller.userId,
      name: "Leather Boots",
      description: "Italian leather boots",
      category: "footwear",
      price: 6000,
      stock: 3,
      status: "active",
      images: [{ url: "https://example.com/boots.jpg", publicId: "boots1" }],
    });
  });

  afterAll(async () => {
    await Order.deleteMany({});
    await Cart.deleteMany({});
    await Product.deleteMany({});
  });

  describe("1. Checkout & Pending Order Creation", () => {
    it("should successfully initiate checkout from cart and create pending order + Razorpay order", async () => {
      // Add items to buyer's cart
      await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ productId: product1._id, quantity: 2 }); // 2 * 10,000 = 20,000

      await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ productId: product2._id, quantity: 1 }); // 1 * 6,000 = 6,000

      // Checkout
      const res = await request(app)
        .post("/api/modasphere/orders/checkout")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ shippingAddress: validShippingAddress });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.orderId).toBeDefined();
      expect(res.body.data.razorpayOrderId).toMatch(/^order_mock_/);
      expect(res.body.data.amount).toBe(2600000); // 26,000 INR in paise
      expect(res.body.data.key).toBe(TEST_KEY_ID);

      // Verify in DB
      const order = await Order.findById(res.body.data.orderId);
      expect(order.status).toBe("pending_payment");
      expect(order.totalAmount).toBe(26000);
      expect(order.items).toHaveLength(2);
      expect(order.items[0].name).toBe("Designer Silk Gown");
      expect(order.items[0].price).toBe(10000);
    });

    it("should reject checkout if live product stock is insufficient at that moment", async () => {
      // Add 2 gowns to cart
      await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ productId: product1._id, quantity: 2 });

      // Simulate stock depletion in DB before checkout
      await Product.findByIdAndUpdate(product1._id, { stock: 1 });

      const res = await request(app)
        .post("/api/modasphere/orders/checkout")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ shippingAddress: validShippingAddress });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/insufficient stock/i);
    });

    it("should reject checkout if user's cart is empty", async () => {
      const res = await request(app)
        .post("/api/modasphere/orders/checkout")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ shippingAddress: validShippingAddress });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cart is empty/i);
    });
  });

  describe("2. Payment Verification & Order Finalization", () => {
    let pendingOrderId;
    let razorpayOrderId;

    beforeEach(async () => {
      // Prepare cart & checkout
      await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ productId: product1._id, quantity: 2 });

      const checkoutRes = await request(app)
        .post("/api/modasphere/orders/checkout")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ shippingAddress: validShippingAddress });

      pendingOrderId = checkoutRes.body.data.orderId;
      razorpayOrderId = checkoutRes.body.data.razorpayOrderId;
    });

    it("should mark order paid, decrement product stock, and clear user's cart on valid signature", async () => {
      const paymentId = "pay_mock_123456";
      const validSignature = crypto
        .createHmac("sha256", TEST_KEY_SECRET)
        .update(`${razorpayOrderId}|${paymentId}`)
        .digest("hex");

      const res = await request(app)
        .post(`/api/modasphere/orders/${pendingOrderId}/verify-payment`)
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({
          razorpayPaymentId: paymentId,
          razorpaySignature: validSignature,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.order.status).toBe("paid");
      expect(res.body.data.order.razorpayPaymentId).toBe(paymentId);

      // Verify product stock decremented (5 - 2 = 3)
      const updatedProduct = await Product.findById(product1._id);
      expect(updatedProduct.stock).toBe(3);

      // Verify buyer's cart is cleared
      const cart = await Cart.findOne({ userId: buyer.userId });
      expect(cart.items).toHaveLength(0);
    });

    it("should reject tampered signature, mark order cancelled, and NOT decrement product stock", async () => {
      const fakePaymentId = "pay_fake_999";
      const invalidSignature = "invalid_tampered_signature_hex_12345";

      const res = await request(app)
        .post(`/api/modasphere/orders/${pendingOrderId}/verify-payment`)
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({
          razorpayPaymentId: fakePaymentId,
          razorpaySignature: invalidSignature,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid payment signature/i);

      // Verify order cancelled in DB
      const order = await Order.findById(pendingOrderId);
      expect(order.status).toBe("cancelled");

      // Verify stock was NOT decremented
      const product = await Product.findById(product1._id);
      expect(product.stock).toBe(5);
    });
  });

  describe("3. Order Visibility & Permissions", () => {
    let orderId;

    beforeEach(async () => {
      // Create a paid order
      await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ productId: product1._id, quantity: 1 });

      const checkoutRes = await request(app)
        .post("/api/modasphere/orders/checkout")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ shippingAddress: validShippingAddress });

      orderId = checkoutRes.body.data.orderId;
      const rzpOrderId = checkoutRes.body.data.razorpayOrderId;

      const paymentId = "pay_perm_test";
      const signature = crypto
        .createHmac("sha256", TEST_KEY_SECRET)
        .update(`${rzpOrderId}|${paymentId}`)
        .digest("hex");

      await request(app)
        .post(`/api/modasphere/orders/${orderId}/verify-payment`)
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ razorpayPaymentId: paymentId, razorpaySignature: signature });
    });

    it("should allow buyer to retrieve their own orders", async () => {
      const res = await request(app)
        .get("/api/modasphere/orders/me")
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.orders).toHaveLength(1);
      expect(res.body.data.orders[0]._id.toString()).toBe(orderId.toString());
    });

    it("should allow relevant seller to view single order containing their product and isolate only their sold items", async () => {
      const res = await request(app)
        .get(`/api/modasphere/orders/${orderId}`)
        .set("Authorization", `Bearer ${seller.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.order._id.toString()).toBe(orderId.toString());
      expect(res.body.data.order.items).toHaveLength(1);
      expect(res.body.data.order.items[0].name).toBe("Designer Silk Gown");
      expect(res.body.data.order.sellerSubtotal).toBe(10000);
    });

    it("should allow relevant seller to view list of their sold orders (/seller/me) with items filtered to their own", async () => {
      const res = await request(app)
        .get("/api/modasphere/orders/seller/me")
        .set("Authorization", `Bearer ${seller.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.orders).toHaveLength(1);
      expect(res.body.data.orders[0].items).toHaveLength(1);
      expect(res.body.data.orders[0].sellerSubtotal).toBe(10000);
    });

    it("should forbid third-party user who is neither buyer nor seller from viewing order (403)", async () => {
      const res = await request(app)
        .get(`/api/modasphere/orders/${orderId}`)
        .set("Authorization", `Bearer ${otherUser.token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    it("should clean up and not leave orphaned pending orders if Razorpay call fails during checkout", async () => {
      // Temporarily remove RAZORPAY_KEY_ID to trigger paymentService error in checkout
      const oldKey = process.env.RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_ID;

      // Add item to cart
      await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ productId: product1._id, quantity: 1 });

      const res = await request(app)
        .post("/api/modasphere/orders/checkout")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ shippingAddress: validShippingAddress });

      expect(res.status).toBe(500);

      // Verify no orphaned pending order in DB
      const orphanedOrders = await Order.find({ buyerId: buyer.userId, status: "pending_payment" });
      expect(orphanedOrders).toHaveLength(0);

      // Restore key
      process.env.RAZORPAY_KEY_ID = oldKey;
    });
  });

  describe("4. Order Status Progression (Ship, Deliver, Cancel)", () => {
    let paidOrderId;
    let pendingOrderId;

    beforeEach(async () => {
      // 1. Create a paid order
      await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ productId: product1._id, quantity: 2 }); // stock was 5 -> now 3

      const checkoutRes = await request(app)
        .post("/api/modasphere/orders/checkout")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ shippingAddress: validShippingAddress });

      paidOrderId = checkoutRes.body.data.orderId;
      const rzpOrderId = checkoutRes.body.data.razorpayOrderId;
      const paymentId = "pay_progression_test";
      const signature = crypto
        .createHmac("sha256", TEST_KEY_SECRET)
        .update(`${rzpOrderId}|${paymentId}`)
        .digest("hex");

      await request(app)
        .post(`/api/modasphere/orders/${paidOrderId}/verify-payment`)
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ razorpayPaymentId: paymentId, razorpaySignature: signature });

      // 2. Create a pending_payment order
      await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ productId: product2._id, quantity: 1 });

      const pendingCheckout = await request(app)
        .post("/api/modasphere/orders/checkout")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ shippingAddress: validShippingAddress });

      pendingOrderId = pendingCheckout.body.data.orderId;
    });

    it("should allow relevant seller to ship a paid order", async () => {
      const res = await request(app)
        .patch(`/api/modasphere/orders/${paidOrderId}/ship`)
        .set("Authorization", `Bearer ${seller.token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.order.status).toBe("shipped");

      // Verify in DB
      const order = await Order.findById(paidOrderId);
      expect(order.status).toBe("shipped");
    });

    it("should reject shipping with 403 if the seller has no items in the order", async () => {
      const res = await request(app)
        .patch(`/api/modasphere/orders/${paidOrderId}/ship`)
        .set("Authorization", `Bearer ${otherUser.token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    it("should reject shipping an order that is not in paid status (e.g. pending_payment)", async () => {
      const res = await request(app)
        .patch(`/api/modasphere/orders/${pendingOrderId}/ship`)
        .set("Authorization", `Bearer ${seller.token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/must be "paid"/i);
    });

    it("should allow buyer to confirm delivery on a shipped order", async () => {
      // First ship the paid order
      await request(app)
        .patch(`/api/modasphere/orders/${paidOrderId}/ship`)
        .set("Authorization", `Bearer ${seller.token}`);

      // Buyer marks delivered
      const res = await request(app)
        .patch(`/api/modasphere/orders/${paidOrderId}/deliver`)
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.order.status).toBe("delivered");

      const order = await Order.findById(paidOrderId);
      expect(order.status).toBe("delivered");
    });

    it("should reject delivery confirmation if order has not been shipped yet", async () => {
      const res = await request(app)
        .patch(`/api/modasphere/orders/${paidOrderId}/deliver`)
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/must be "shipped"/i);
    });

    it("should reject delivery confirmation by a non-buyer (403)", async () => {
      // Ship order
      await request(app)
        .patch(`/api/modasphere/orders/${paidOrderId}/ship`)
        .set("Authorization", `Bearer ${seller.token}`);

      const res = await request(app)
        .patch(`/api/modasphere/orders/${paidOrderId}/deliver`)
        .set("Authorization", `Bearer ${otherUser.token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    it("should allow buyer to cancel a paid order and restore product stock back to DB", async () => {
      // Product1 stock was 5 - 2 = 3 after paid order
      const beforeProduct = await Product.findById(product1._id);
      expect(beforeProduct.stock).toBe(3);

      const res = await request(app)
        .patch(`/api/modasphere/orders/${paidOrderId}/cancel`)
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.order.status).toBe("cancelled");

      // Verify in DB that order is cancelled
      const order = await Order.findById(paidOrderId);
      expect(order.status).toBe("cancelled");

      // Verify product stock was restored: 3 + 2 = 5
      const afterProduct = await Product.findById(product1._id);
      expect(afterProduct.stock).toBe(5);
    });

    it("should allow buyer to cancel a pending_payment order without altering product stock", async () => {
      const res = await request(app)
        .patch(`/api/modasphere/orders/${pendingOrderId}/cancel`)
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.order.status).toBe("cancelled");
    });

    it("should reject cancellation if order is already shipped or delivered", async () => {
      // Ship the order
      await request(app)
        .patch(`/api/modasphere/orders/${paidOrderId}/ship`)
        .set("Authorization", `Bearer ${seller.token}`);

      const res = await request(app)
        .patch(`/api/modasphere/orders/${paidOrderId}/cancel`)
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot cancel order/i);
    });
  });

  describe("5. Razorpay Refund Integration on Order Cancellation", () => {
    let paidOrderId;
    let pendingOrderId;

    beforeEach(async () => {
      // Create a paid order with standard mock payment id
      await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ productId: product1._id, quantity: 2 }); // 20,000 INR

      const checkoutRes = await request(app)
        .post("/api/modasphere/orders/checkout")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ shippingAddress: validShippingAddress });

      paidOrderId = checkoutRes.body.data.orderId;
      const rzpOrderId = checkoutRes.body.data.razorpayOrderId;
      const paymentId = "pay_refund_test_standard";
      const signature = crypto
        .createHmac("sha256", TEST_KEY_SECRET)
        .update(`${rzpOrderId}|${paymentId}`)
        .digest("hex");

      await request(app)
        .post(`/api/modasphere/orders/${paidOrderId}/verify-payment`)
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ razorpayPaymentId: paymentId, razorpaySignature: signature });

      // Create a pending order
      await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ productId: product2._id, quantity: 1 });

      const pendingCheckout = await request(app)
        .post("/api/modasphere/orders/checkout")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ shippingAddress: validShippingAddress });

      pendingOrderId = pendingCheckout.body.data.orderId;
    });

    it("should initiate refund and set refundStatus to 'processed' when cancelling a paid order", async () => {
      const res = await request(app)
        .patch(`/api/modasphere/orders/${paidOrderId}/cancel`)
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.order.status).toBe("cancelled");
      expect(res.body.data.order.refundStatus).toBe("processed");
      expect(res.body.data.order.refundId).toMatch(/^rfrnd_mock_/);
      expect(res.body.data.order.refundAmount).toBe(20000);
      expect(res.body.data.order.refundedAt).toBeDefined();

      // DB verification
      const order = await Order.findById(paidOrderId);
      expect(order.refundStatus).toBe("processed");
      expect(order.refundAmount).toBe(20000);
    });

    it("should set refundStatus to 'failed' if Razorpay refund fails, but NOT roll back cancellation or stock restoration", async () => {
      // Create an order paid with special ID that triggers simulated failure in mock
      await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ productId: product1._id, quantity: 1 }); // stock: 3 -> 2

      const checkoutRes = await request(app)
        .post("/api/modasphere/orders/checkout")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ shippingAddress: validShippingAddress });

      const failOrderId = checkoutRes.body.data.orderId;
      const failRzpOrderId = checkoutRes.body.data.razorpayOrderId;
      const failPaymentId = "pay_mock_refund_failure"; // triggers throw in mock
      const signature = crypto
        .createHmac("sha256", TEST_KEY_SECRET)
        .update(`${failRzpOrderId}|${failPaymentId}`)
        .digest("hex");

      await request(app)
        .post(`/api/modasphere/orders/${failOrderId}/verify-payment`)
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ razorpayPaymentId: failPaymentId, razorpaySignature: signature });

      // Cancel the order
      const cancelRes = await request(app)
        .patch(`/api/modasphere/orders/${failOrderId}/cancel`)
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.order.status).toBe("cancelled");
      expect(cancelRes.body.data.order.refundStatus).toBe("failed");

      // Verify stock was still restored (2 + 1 = 3)
      const p = await Product.findById(product1._id);
      expect(p.stock).toBe(3);
    });

    it("should skip refund entirely when cancelling a pending_payment order", async () => {
      const res = await request(app)
        .patch(`/api/modasphere/orders/${pendingOrderId}/cancel`)
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.order.status).toBe("cancelled");
      expect(res.body.data.order.refundStatus).toBe("none");
      expect(res.body.data.order.refundId).toBeNull();
    });

    it("should allow buyer and admin to view refund-status (GET /:id/refund-status)", async () => {
      // First cancel the paid order
      await request(app)
        .patch(`/api/modasphere/orders/${paidOrderId}/cancel`)
        .set("Authorization", `Bearer ${buyer.token}`);

      // Buyer check
      const buyerRes = await request(app)
        .get(`/api/modasphere/orders/${paidOrderId}/refund-status`)
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(buyerRes.status).toBe(200);
      expect(buyerRes.body.data.refundStatus).toBe("processed");
      expect(buyerRes.body.data.refundAmount).toBe(20000);

      // Admin check
      const adminRes = await request(app)
        .get(`/api/modasphere/orders/${paidOrderId}/refund-status`)
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(adminRes.status).toBe(200);
      expect(adminRes.body.data.refundStatus).toBe("processed");

      // Third party check (rejected 403)
      const strangerRes = await request(app)
        .get(`/api/modasphere/orders/${paidOrderId}/refund-status`)
        .set("Authorization", `Bearer ${otherUser.token}`);

      expect(strangerRes.status).toBe(403);
    });

    it("should allow admin to retry a failed refund (POST /:id/retry-refund) and forbid non-admins (403)", async () => {
      // Create an order with refundStatus 'failed'
      const order = await Order.create({
        buyerId: buyer.userId,
        items: [
          {
            productId: product1._id,
            sellerId: seller.userId,
            name: "Designer Silk Gown",
            price: 10000,
            quantity: 1,
          },
        ],
        totalAmount: 10000,
        status: "cancelled",
        refundStatus: "failed",
        razorpayPaymentId: "pay_retry_success_test",
        shippingAddress: validShippingAddress,
      });

      // Regular user attempt (rejected 403)
      const userAttempt = await request(app)
        .post(`/api/modasphere/orders/${order._id}/retry-refund`)
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(userAttempt.status).toBe(403);

      // Admin attempt (successful 200)
      const adminAttempt = await request(app)
        .post(`/api/modasphere/orders/${order._id}/retry-refund`)
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(adminAttempt.status).toBe(200);
      expect(adminAttempt.body.data.refundStatus).toBe("processed");
      expect(adminAttempt.body.data.refundAmount).toBe(10000);

      // DB check
      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder.refundStatus).toBe("processed");
      expect(updatedOrder.refundId).toMatch(/^rfrnd_mock_/);
    });

    it("should reject retrying refund with 400 if refund is already processed (prevent double-refund)", async () => {
      // First cancel the paid order so refund is processed
      await request(app)
        .patch(`/api/modasphere/orders/${paidOrderId}/cancel`)
        .set("Authorization", `Bearer ${buyer.token}`);

      // Attempt to retry refund via admin
      const res = await request(app)
        .post(`/api/modasphere/orders/${paidOrderId}/retry-refund`)
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already been processed/i);
    });
  });
});
