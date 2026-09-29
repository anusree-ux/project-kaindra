const request = require("supertest");
const app = require("../../src/app");
const Product = require("../../src/models/modasphere/Product");
const Cart = require("../../src/models/modasphere/Cart");
const Order = require("../../src/models/modasphere/Order");
const Drop = require("../../src/models/modasphere/Drop");
const DropWaitlist = require("../../src/models/modasphere/DropWaitlist");
const { updateDropStatuses } = require("../../src/services/modasphere/dropService");
const { createTestUser } = require("../helpers/testUser");

// Mock Razorpay SDK for unit test checkout
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
    };
  };
});

describe("ModaSphere ModaDrop (Time-Limited Product Drops) API", () => {
  let seller;
  let otherSeller;
  let buyer1;
  let buyer2;
  let adminUser;
  let dropProduct;
  let regularProduct;

  const validAddress = {
    name: "Alex Dropfan",
    phone: "9123456780",
    addressLine1: "45 Hype Street",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
  };

  beforeEach(async () => {
    await DropWaitlist.deleteMany({});
    await Drop.deleteMany({});
    await Order.deleteMany({});
    await Cart.deleteMany({});
    await Product.deleteMany({});

    seller = await createTestUser({ name: "Drop Designer", role: "user" });
    otherSeller = await createTestUser({ name: "Other Seller", role: "user" });
    buyer1 = await createTestUser({ name: "Sneakerhead 1", role: "user" });
    buyer2 = await createTestUser({ name: "Sneakerhead 2", role: "user" });
    adminUser = await createTestUser({ name: "Admin Lead", role: "admin" });

    dropProduct = await Product.create({
      sellerId: seller.userId,
      name: "Limited Edition Cyber Hoodie",
      description: "Numbered limited edition hoodie with NFC authentication",
      category: "apparel",
      price: 8999,
      stock: 50,
      status: "active",
    });

    regularProduct = await Product.create({
      sellerId: seller.userId,
      name: "Standard Graphic Tee",
      description: "Everyday cotton tee",
      category: "apparel",
      price: 1499,
      stock: 100,
      status: "active",
    });
  });

  describe("1. Drop Creation & Product Ownership Validation", () => {
    test("Seller can create an upcoming drop with their own products", async () => {
      const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h later
      const futureEnd = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h later

      const res = await request(app)
        .post("/api/modasphere/drops")
        .set("Authorization", `Bearer ${seller.token}`)
        .send({
          title: "Cyberpunk Autumn Drop",
          description: "Exclusive futuristic autumn line",
          productIds: [dropProduct._id],
          startTime: futureStart,
          endTime: futureEnd,
          maxPerUser: 2,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.drop).toBeDefined();
      expect(res.body.data.drop.status).toBe("upcoming");
      expect(res.body.data.drop.title).toBe("Cyberpunk Autumn Drop");
      expect(res.body.data.drop.maxPerUser).toBe(2);
    });

    test("Seller cannot include products they do not own (403)", async () => {
      const unownedProduct = await Product.create({
        sellerId: otherSeller.userId,
        name: "Other Brand Jacket",
        category: "apparel",
        price: 5000,
        stock: 10,
        status: "active",
      });

      const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const res = await request(app)
        .post("/api/modasphere/drops")
        .set("Authorization", `Bearer ${seller.token}`)
        .send({
          title: "Stolen Collection Drop",
          productIds: [unownedProduct._id],
          startTime: futureStart,
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe("fail");
    });

    test("Admin can curate drops containing any seller's products", async () => {
      const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const res = await request(app)
        .post("/api/modasphere/drops")
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({
          title: "Platform Curated Mega Drop",
          productIds: [dropProduct._id],
          startTime: futureStart,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.drop.title).toBe("Platform Curated Mega Drop");
    });
  });

  describe("2. Drop Status Transitions via Time Calculation", () => {
    test("Transitions upcoming -> live -> ended based on current time", async () => {
      const pastStart = new Date(Date.now() - 3600 * 1000); // 1h ago
      const pastEnd = new Date(Date.now() - 1800 * 1000); // 30m ago
      const futureEnd = new Date(Date.now() + 3600 * 1000); // 1h future

      // 1. Drop ready to go live
      const liveCandidate = await Drop.create({
        title: "Live Ready Drop",
        createdBy: seller.userId,
        productIds: [dropProduct._id],
        startTime: pastStart,
        endTime: futureEnd,
        status: "upcoming",
      });

      // 2. Drop whose end time has passed
      const endedCandidate = await Drop.create({
        title: "Expired Drop",
        createdBy: seller.userId,
        productIds: [dropProduct._id],
        startTime: pastStart,
        endTime: pastEnd,
        status: "live",
      });

      const { updatedToLive, updatedToEnded } = await updateDropStatuses();

      expect(updatedToLive).toBe(1);
      expect(updatedToEnded).toBe(1);

      const updatedLive = await Drop.findById(liveCandidate._id);
      expect(updatedLive.status).toBe("live");

      const updatedEnded = await Drop.findById(endedCandidate._id);
      expect(updatedEnded.status).toBe("ended");
    });
  });

  describe("3. Drop Waitlist Lifecycle", () => {
    let upcomingDrop;
    let liveDrop;

    beforeEach(async () => {
      upcomingDrop = await Drop.create({
        title: "Upcoming Drop",
        createdBy: seller.userId,
        productIds: [dropProduct._id],
        startTime: new Date(Date.now() + 24 * 3600 * 1000),
        status: "upcoming",
      });

      liveDrop = await Drop.create({
        title: "Live Drop",
        createdBy: seller.userId,
        productIds: [dropProduct._id],
        startTime: new Date(Date.now() - 3600 * 1000),
        status: "live",
      });
    });

    test("User can join and leave waitlist for an upcoming drop", async () => {
      // Join
      const joinRes = await request(app)
        .post(`/api/modasphere/drops/${upcomingDrop._id}/waitlist`)
        .set("Authorization", `Bearer ${buyer1.token}`);

      expect(joinRes.statusCode).toBe(201);
      expect(joinRes.body.status).toBe("success");

      // Leave
      const leaveRes = await request(app)
        .delete(`/api/modasphere/drops/${upcomingDrop._id}/waitlist`)
        .set("Authorization", `Bearer ${buyer1.token}`);

      expect(leaveRes.statusCode).toBe(200);
      expect(leaveRes.body.status).toBe("success");
    });

    test("Duplicate waitlist join is rejected cleanly with 400", async () => {
      await request(app)
        .post(`/api/modasphere/drops/${upcomingDrop._id}/waitlist`)
        .set("Authorization", `Bearer ${buyer1.token}`);

      const duplicateRes = await request(app)
        .post(`/api/modasphere/drops/${upcomingDrop._id}/waitlist`)
        .set("Authorization", `Bearer ${buyer1.token}`);

      expect(duplicateRes.statusCode).toBe(400);
      expect(duplicateRes.body.status).toBe("fail");
      expect(duplicateRes.body.message).toMatch(/already on the waitlist/i);
    });

    test("Joining waitlist on live or ended drop is rejected with 400", async () => {
      const res = await request(app)
        .post(`/api/modasphere/drops/${liveDrop._id}/waitlist`)
        .set("Authorization", `Bearer ${buyer1.token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/only available for upcoming drops/i);
    });
  });

  describe("4. Checkout Restrictions & Purchase Quotas (maxPerUser)", () => {
    test("Checkout is blocked when product belongs to an 'upcoming' drop", async () => {
      await Drop.create({
        title: "Premature Drop",
        createdBy: seller.userId,
        productIds: [dropProduct._id],
        startTime: new Date(Date.now() + 24 * 3600 * 1000),
        status: "upcoming",
        maxPerUser: 2,
      });

      // Add drop product to cart via /api/modasphere/cart/items
      await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ productId: dropProduct._id, quantity: 1 });

      // Attempt checkout
      const res = await request(app)
        .post("/api/modasphere/orders/checkout")
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ shippingAddress: validAddress });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/upcoming/i);
    });

    test("Checkout is blocked when product belongs to an 'ended' drop", async () => {
      await Drop.create({
        title: "Past Drop",
        createdBy: seller.userId,
        productIds: [dropProduct._id],
        startTime: new Date(Date.now() - 48 * 3600 * 1000),
        endTime: new Date(Date.now() - 24 * 3600 * 1000),
        status: "ended",
        maxPerUser: 2,
      });

      await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ productId: dropProduct._id, quantity: 1 });

      const res = await request(app)
        .post("/api/modasphere/orders/checkout")
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ shippingAddress: validAddress });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/ended/i);
    });

    test("Checkout succeeds when within maxPerUser limit and tests exact boundary conditions", async () => {
      const drop = await Drop.create({
        title: "Live Exclusive Drop",
        createdBy: seller.userId,
        productIds: [dropProduct._id],
        startTime: new Date(Date.now() - 3600 * 1000),
        status: "live",
        maxPerUser: 2,
      });

      // 1. First purchase: buy 1 unit (allowed, 1 <= 2)
      await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ productId: dropProduct._id, quantity: 1 });

      const checkout1Res = await request(app)
        .post("/api/modasphere/orders/checkout")
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ shippingAddress: validAddress });

      expect(checkout1Res.statusCode).toBe(201);
      const order1Id = checkout1Res.body.data.orderId;

      // Simulate order paid & cart cleared after successful checkout/payment
      await Order.findByIdAndUpdate(order1Id, { status: "paid" });
      await Cart.findOneAndUpdate({ userId: buyer1.userId }, { items: [] });

      // Check purchase limit endpoint: bought 1, remaining 1
      const limitRes1 = await request(app)
        .get(`/api/modasphere/drops/${drop._id}/purchase-limit`)
        .set("Authorization", `Bearer ${buyer1.token}`);
      expect(limitRes1.body.data.purchasedCount).toBe(1);
      expect(limitRes1.body.data.remainingLimit).toBe(1);

      // 2. Exact boundary checkout: buy 1 more unit (1 existing + 1 in cart = 2 == maxPerUser 2 -> allowed)
      await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ productId: dropProduct._id, quantity: 1 });

      const checkout2Res = await request(app)
        .post("/api/modasphere/orders/checkout")
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ shippingAddress: validAddress });

      expect(checkout2Res.statusCode).toBe(201);
      const order2Id = checkout2Res.body.data.orderId;
      await Order.findByIdAndUpdate(order2Id, { status: "paid" });
      await Cart.findOneAndUpdate({ userId: buyer1.userId }, { items: [] });

      // Check purchase limit endpoint: bought 2, remaining 0
      const limitRes2 = await request(app)
        .get(`/api/modasphere/drops/${drop._id}/purchase-limit`)
        .set("Authorization", `Bearer ${buyer1.token}`);
      expect(limitRes2.body.data.purchasedCount).toBe(2);
      expect(limitRes2.body.data.remainingLimit).toBe(0);

      // 3. Exceeded boundary checkout: attempt to buy 1 more unit (2 existing + 1 in cart = 3 > 2 -> REJECTED)
      await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ productId: dropProduct._id, quantity: 1 });

      const checkout3Res = await request(app)
        .post("/api/modasphere/orders/checkout")
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ shippingAddress: validAddress });

      expect(checkout3Res.statusCode).toBe(400);
      expect(checkout3Res.body.message).toMatch(/Purchase limit exceeded/i);

      // 4. Boundary verification for unrelated products:
      // Buyer who reached maxPerUser on dropProduct can still freely buy regularProduct
      await request(app)
        .delete("/api/modasphere/cart")
        .set("Authorization", `Bearer ${buyer1.token}`);

      await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ productId: regularProduct._id, quantity: 3 });

      const unrelatedCheckoutRes = await request(app)
        .post("/api/modasphere/orders/checkout")
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ shippingAddress: validAddress });

      expect(unrelatedCheckoutRes.statusCode).toBe(201);
    });
  });
});
