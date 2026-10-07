const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../src/app");
const Product = require("../../src/models/modasphere/Product");
const Order = require("../../src/models/modasphere/Order");
const Shipment = require("../../src/models/modasphere/Shipment");
const { createTestUser } = require("../helpers/testUser");

describe("ModaSphere ModaLogix - Shipment & Logistics Tracking", () => {
  let buyer;
  let seller;
  let otherUser;
  let adminUser;
  let product;
  let paidOrder;

  const validShippingAddress = {
    name: "Jane Doe",
    phone: "9876543210",
    addressLine1: "456 Fashion Ave",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001",
  };

  beforeEach(async () => {
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Shipment.deleteMany({});

    buyer = await createTestUser({ role: "user" });
    seller = await createTestUser({ role: "user" });
    otherUser = await createTestUser({ role: "user" });
    adminUser = await createTestUser({ role: "admin" });

    product = await Product.create({
      sellerId: seller.userId,
      title: "Silk Embroidered Jacket",
      description: "Luxury artisanal jacket",
      price: 4999,
      discountPrice: 4499,
      stock: 10,
      images: ["https://example.com/jacket.jpg"],
      category: "womenswear",
    });

    paidOrder = await Order.create({
      buyerId: buyer.userId,
      items: [
        {
          productId: product._id,
          sellerId: seller.userId,
          name: product.title,
          price: 4499,
          quantity: 1,
        },
      ],
      subtotalAmount: 4499,
      totalAmount: 4499,
      status: "paid",
      shippingAddress: validShippingAddress,
      razorpayPaymentId: "pay_test_shipment_123",
    });
  });

  describe("PATCH /api/modasphere/orders/:id/ship (Order Shipping & Shipment Creation)", () => {
    it("should require carrier and trackingNumber to ship an order", async () => {
      const res = await request(app)
        .patch(`/api/modasphere/orders/${paidOrder._id}/ship`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Carrier is required/i);

      // Verify order status is still paid (not corrupted)
      const freshOrder = await Order.findById(paidOrder._id);
      expect(freshOrder.status).toBe("paid");
    });

    it("should reject shipping if tracking number is missing", async () => {
      const res = await request(app)
        .patch(`/api/modasphere/orders/${paidOrder._id}/ship`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({ carrier: "Delhivery" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Tracking number is required/i);

      const freshOrder = await Order.findById(paidOrder._id);
      expect(freshOrder.status).toBe("paid");
    });

    it("should successfully ship an order, create Shipment with pending_pickup, and record initial timeline", async () => {
      const res = await request(app)
        .patch(`/api/modasphere/orders/${paidOrder._id}/ship`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({
          carrier: "Delhivery",
          trackingNumber: "DEL123456789IN",
          estimatedDeliveryDate: new Date(Date.now() + 3 * 86400000).toISOString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.order.status).toBe("shipped");
      expect(res.body.data.shipment).toBeDefined();
      expect(res.body.data.shipment.carrier).toBe("Delhivery");
      expect(res.body.data.shipment.trackingNumber).toBe("DEL123456789IN");
      expect(res.body.data.shipment.status).toBe("pending_pickup");
      expect(res.body.data.shipment.timeline).toHaveLength(1);
      expect(res.body.data.shipment.timeline[0].status).toBe("pending_pickup");

      const dbShipment = await Shipment.findOne({ orderId: paidOrder._id });
      expect(dbShipment).toBeDefined();
      expect(dbShipment.status).toBe("pending_pickup");
    });

    it("should reject shipping by a non-seller user with 403", async () => {
      const res = await request(app)
        .patch(`/api/modasphere/orders/${paidOrder._id}/ship`)
        .set("Authorization", `Bearer ${otherUser.token}`)
        .send({
          carrier: "Bluedart",
          trackingNumber: "BLU987654321",
        });

      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/modasphere/shipments/:orderId/status (Shipment Status Progression)", () => {
    let shippedOrder;

    beforeEach(async () => {
      const res = await request(app)
        .patch(`/api/modasphere/orders/${paidOrder._id}/ship`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({
          carrier: "Delhivery",
          trackingNumber: "DEL123456789IN",
        });
      shippedOrder = res.body.data.order;
    });

    it("should allow the seller to advance status forward (pending_pickup -> picked_up -> in_transit -> out_for_delivery)", async () => {
      // Step 1: picked_up
      const res1 = await request(app)
        .patch(`/api/modasphere/shipments/${shippedOrder._id}/status`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({ status: "picked_up", note: "Package picked up from seller warehouse." });

      expect(res1.status).toBe(200);
      expect(res1.body.data.shipment.status).toBe("picked_up");
      expect(res1.body.data.shipment.timeline).toHaveLength(2);

      // Step 2: in_transit
      const res2 = await request(app)
        .patch(`/api/modasphere/shipments/${shippedOrder._id}/status`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({ status: "in_transit", note: "Departed hub towards destination city." });

      expect(res2.status).toBe(200);
      expect(res2.body.data.shipment.status).toBe("in_transit");
      expect(res2.body.data.shipment.timeline).toHaveLength(3);

      // Step 3: out_for_delivery
      const res3 = await request(app)
        .patch(`/api/modasphere/shipments/${shippedOrder._id}/status`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({ status: "out_for_delivery", note: "Courier executive out for delivery." });

      expect(res3.status).toBe(200);
      expect(res3.body.data.shipment.status).toBe("out_for_delivery");
      expect(res3.body.data.shipment.timeline).toHaveLength(4);
    });

    it("should reject backward / invalid status transitions with 400", async () => {
      // First move to picked_up
      await request(app)
        .patch(`/api/modasphere/shipments/${shippedOrder._id}/status`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({ status: "picked_up" });

      // Attempt invalid backward move back to pending_pickup
      const resInvalid = await request(app)
        .patch(`/api/modasphere/shipments/${shippedOrder._id}/status`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({ status: "pending_pickup" });

      expect(resInvalid.status).toBe(400);
      expect(resInvalid.body.message).toMatch(/Invalid shipment status transition/i);
    });

    it("should reject out_for_delivery -> in_transit backward transition", async () => {
      await request(app)
        .patch(`/api/modasphere/shipments/${shippedOrder._id}/status`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({ status: "in_transit" });

      await request(app)
        .patch(`/api/modasphere/shipments/${shippedOrder._id}/status`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({ status: "out_for_delivery" });

      const res = await request(app)
        .patch(`/api/modasphere/shipments/${shippedOrder._id}/status`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({ status: "in_transit" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid shipment status transition/i);
    });

    it("should update parent Order status to 'delivered' when shipment is marked 'delivered'", async () => {
      await request(app)
        .patch(`/api/modasphere/shipments/${shippedOrder._id}/status`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({ status: "in_transit" });

      const res = await request(app)
        .patch(`/api/modasphere/shipments/${shippedOrder._id}/status`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({ status: "delivered", note: "Delivered to customer." });

      expect(res.status).toBe(200);
      expect(res.body.data.shipment.status).toBe("delivered");
      expect(res.body.data.order.status).toBe("delivered");

      const freshOrder = await Order.findById(shippedOrder._id);
      expect(freshOrder.status).toBe("delivered");
    });

    it("should reject further updates once order is already delivered", async () => {
      await request(app)
        .patch(`/api/modasphere/shipments/${shippedOrder._id}/status`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({ status: "in_transit" });

      await request(app)
        .patch(`/api/modasphere/shipments/${shippedOrder._id}/status`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({ status: "delivered" });

      const resAttempt = await request(app)
        .patch(`/api/modasphere/shipments/${shippedOrder._id}/status`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({ status: "failed_delivery" });

      expect(resAttempt.status).toBe(400);
      expect(resAttempt.body.message).toMatch(/already "delivered"/i);
    });

    it("should reject shipment updates by buyers or unauthorized users with 403", async () => {
      const resBuyer = await request(app)
        .patch(`/api/modasphere/shipments/${shippedOrder._id}/status`)
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ status: "picked_up" });

      expect(resBuyer.status).toBe(403);

      const resOther = await request(app)
        .patch(`/api/modasphere/shipments/${shippedOrder._id}/status`)
        .set("Authorization", `Bearer ${otherUser.token}`)
        .send({ status: "picked_up" });

      expect(resOther.status).toBe(403);
    });
  });

  describe("PATCH /api/modasphere/orders/:id/deliver (Buyer Delivery Sync)", () => {
    it("should sync Shipment status to 'delivered' with buyer confirmation note when buyer marks order delivered", async () => {
      await request(app)
        .patch(`/api/modasphere/orders/${paidOrder._id}/ship`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({ carrier: "Delhivery", trackingNumber: "DEL123456" });

      const res = await request(app)
        .patch(`/api/modasphere/orders/${paidOrder._id}/deliver`)
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.order.status).toBe("delivered");
      expect(res.body.data.shipment.status).toBe("delivered");
      const lastEntry = res.body.data.shipment.timeline.slice(-1)[0];
      expect(lastEntry.status).toBe("delivered");
      expect(lastEntry.note).toBe("Confirmed received by buyer");
    });
  });

  describe("GET /api/modasphere/shipments/:orderId (Shipment Tracking Details)", () => {
    let shippedOrder;

    beforeEach(async () => {
      const res = await request(app)
        .patch(`/api/modasphere/orders/${paidOrder._id}/ship`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({
          carrier: "Delhivery",
          trackingNumber: "DEL123456789IN",
          estimatedDeliveryDate: new Date(Date.now() + 2 * 86400000).toISOString(),
        });
      shippedOrder = res.body.data.order;
    });

    it("should allow the buyer to view full shipment tracking details and timeline", async () => {
      const res = await request(app)
        .get(`/api/modasphere/shipments/${shippedOrder._id}`)
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.shipment).toBeDefined();
      expect(res.body.data.shipment.carrier).toBe("Delhivery");
      expect(res.body.data.shipment.trackingNumber).toBe("DEL123456789IN");
      expect(res.body.data.shipment.timeline).toBeInstanceOf(Array);
      expect(res.body.data.shipment.timeline.length).toBeGreaterThanOrEqual(1);
    });

    it("should allow the seller to view full shipment tracking details", async () => {
      const res = await request(app)
        .get(`/api/modasphere/shipments/${shippedOrder._id}`)
        .set("Authorization", `Bearer ${seller.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.shipment.carrier).toBe("Delhivery");
    });

    it("should reject strangers from viewing shipment details with 403", async () => {
      const res = await request(app)
        .get(`/api/modasphere/shipments/${shippedOrder._id}`)
        .set("Authorization", `Bearer ${otherUser.token}`);

      expect(res.status).toBe(403);
    });

    it("should return 404 if order does not exist", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/modasphere/shipments/${nonExistentId}`)
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res.status).toBe(404);
    });
  });
});
