const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../src/app");
const Product = require("../../src/models/modasphere/Product");
const Order = require("../../src/models/modasphere/Order");
const Shipment = require("../../src/models/modasphere/Shipment");
const { createTestUser } = require("../helpers/testUser");
const env = require("../../src/config/environment");

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
    env.shiprocket.mockMode = true;
    env.nodeEnv = "test";

    await Product.deleteMany({});
    await Order.deleteMany({});
    await Shipment.deleteMany({});

    buyer = await createTestUser({ role: "user" });
    seller = await createTestUser({ role: "user" });
    otherUser = await createTestUser({ role: "user" });
    adminUser = await createTestUser({ role: "admin" });

    product = await Product.create({
      sellerId: seller.userId,
      name: "Silk Embroidered Jacket",
      description: "Luxury artisanal jacket",
      price: 4999,
      discountPrice: 4499,
      stock: 10,
      images: [{ url: "https://example.com/jacket.jpg", publicId: "jacket1" }],
      category: "womenswear",
    });

    paidOrder = await Order.create({
      buyerId: buyer.userId,
      items: [
        {
          productId: product._id,
          sellerId: seller.userId,
          name: product.name,
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
    it("should create a mock Shiprocket shipment and keep order paid until pickup", async () => {
      const res = await request(app)
        .patch(`/api/modasphere/orders/${paidOrder._id}/ship`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({});

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.order.status).toBe("paid");

      const shipment = res.body.data.shipment;
      expect(shipment).toBeDefined();
      expect(shipment.provider).toBe("shiprocket");
      expect(shipment.isMock).toBe(true);
      expect(shipment.awbCode).toMatch(/^MOCK-AWB-/);
      expect(shipment.carrier).toBe("Mock Express");
      expect(shipment.status).toBe("pending_pickup");
      expect(shipment.timeline).toHaveLength(1);

      const dbShipment = await Shipment.findOne({
        orderId: paidOrder._id,
      });

      expect(dbShipment).toBeDefined();
      expect(dbShipment.isMock).toBe(true);
      expect(dbShipment.status).toBe("pending_pickup");

      const freshOrder = await Order.findById(paidOrder._id);
      expect(freshOrder.status).toBe("paid");
    });

    it("should reject duplicate shipment creation", async () => {
      const firstResponse = await request(app)
        .patch(`/api/modasphere/orders/${paidOrder._id}/ship`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({});

      expect(firstResponse.status).toBe(201);

      const secondResponse = await request(app)
        .patch(`/api/modasphere/orders/${paidOrder._id}/ship`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({});

      expect(secondResponse.status).toBe(409);

      const shipments = await Shipment.find({
        orderId: paidOrder._id,
      });

      expect(shipments).toHaveLength(1);
    });

    it("should reject shipment creation for an order that is not paid", async () => {
      paidOrder.status = "pending_payment";
      await paidOrder.save();

      const res = await request(app)
        .patch(`/api/modasphere/orders/${paidOrder._id}/ship`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(await Shipment.countDocuments({
        orderId: paidOrder._id,
      })).toBe(0);
    });

    it("should reject shipping by a non-seller user with 403", async () => {
      const res = await request(app)
        .patch(`/api/modasphere/orders/${paidOrder._id}/ship`)
        .set("Authorization", `Bearer ${otherUser.token}`)
        .send({});

      expect(res.status).toBe(403);
    });

    it("should reject shipment creation by an unauthenticated user", async () => {
      const res = await request(app)
        .patch(`/api/modasphere/orders/${paidOrder._id}/ship`)
        .send({});

      expect(res.status).toBe(401);
    });
  });


  describe("PATCH /api/modasphere/orders/:id/deliver (Buyer Delivery Sync)", () => {

    it("should sync Shipment status to delivered when buyer confirms receipt", async () => {
      // Create a mock Shiprocket shipment.
      const shipmentResponse = await request(app)
        .patch(`/api/modasphere/orders/${paidOrder._id}/ship`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({});

      expect(shipmentResponse.status).toBe(201);

      // Simulate the courier having picked up the package.
      paidOrder.status = "shipped";
      await paidOrder.save();

      const shipment = await Shipment.findOne({
        orderId: paidOrder._id,
      });

      shipment.status = "picked_up";
      await shipment.save();

      // Buyer confirms receipt.
      const res = await request(app)
        .patch(`/api/modasphere/orders/${paidOrder._id}/deliver`)
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.order.status).toBe("delivered");
      expect(res.body.data.shipment.status).toBe("delivered");

      const updatedShipment = await Shipment.findOne({
        orderId: paidOrder._id,
      });

      expect(updatedShipment.status).toBe("delivered");
      expect(
        updatedShipment.timeline.some(
          (entry) => entry.note === "Confirmed received by buyer"
        )
      ).toBe(true);
    });
  });

  describe("GET /api/modasphere/shipments/:orderId (Shipment Tracking Details)", () => {
    let shippedOrder;


    beforeEach(async () => {
      const res = await request(app)
        .patch(`/api/modasphere/orders/${paidOrder._id}/ship`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({});

      expect(res.status).toBe(201);
      shippedOrder = res.body.data.order;
    });

    it("should allow the buyer to view full shipment tracking details and timeline", async () => {
      const res = await request(app)
        .get(`/api/modasphere/shipments/${shippedOrder._id}`)
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.shipment.provider).toBe("shiprocket");
      expect(res.body.data.shipment.isMock).toBe(true);
      expect(res.body.data.shipment.carrier).toBe("Mock Express");
      expect(res.body.data.shipment.awbCode).toMatch(/^MOCK-AWB-/);
      expect(res.body.data.shipment.status).toBe("pending_pickup");
      expect(res.body.data.shipment.timeline).toHaveLength(1);
    });

    it("should allow the seller to view full shipment tracking details", async () => {
      const res = await request(app)
        .get(`/api/modasphere/shipments/${shippedOrder._id}`)
        .set("Authorization", `Bearer ${seller.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.shipment.provider).toBe("shiprocket");
      expect(res.body.data.shipment.carrier).toBe("Mock Express");
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
