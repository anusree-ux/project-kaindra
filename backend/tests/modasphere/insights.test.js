const request = require("supertest");
const app = require("../../src/app");
const Order = require("../../src/models/modasphere/Order");
const Product = require("../../src/models/modasphere/Product");
const { createTestUser } = require("../helpers/testUser");

describe("ModaSphere ModaInsights Analytics API & Aggregation Service", () => {
  let admin;
  let sellerA;
  let sellerB;
  let buyer1;
  let buyer2;

  let productA1;
  let productA2;
  let productB1;

  beforeEach(async () => {
    await Order.deleteMany({});
    await Product.deleteMany({});

    // Create users (sellers and buyers are regular users; admin has role "admin")
    admin = await createTestUser({ name: "Moda Admin", role: "admin" });
    sellerA = await createTestUser({ name: "Seller Alice", role: "user" });
    sellerB = await createTestUser({ name: "Seller Bob", role: "user" });
    buyer1 = await createTestUser({ name: "Buyer Charlie", role: "user" });
    buyer2 = await createTestUser({ name: "Buyer Dave", role: "user" });

    // Products for Seller A
    productA1 = await Product.create({
      sellerId: sellerA.userId,
      name: "Linen Shirt",
      price: 1000,
      stock: 50,
      category: "apparel",
      status: "active",
    });

    productA2 = await Product.create({
      sellerId: sellerA.userId,
      name: "Leather Belt",
      price: 500,
      stock: 30,
      category: "accessories",
      status: "active",
    });

    // Product for Seller B
    productB1 = await Product.create({
      sellerId: sellerB.userId,
      name: "Silk Scarf",
      price: 2000,
      stock: 20,
      category: "accessories",
      status: "active",
    });
  });

  describe("1. Revenue Math & Fixtures Verification", () => {
    test("Computes exact seller revenue, units sold, distinct orders, and average order value", async () => {
      // Order 1 (paid): 2x Product A1 (2000) + 1x Product A2 (500) = 2500, 3 units
      await Order.create({
        buyerId: buyer1.userId,
        status: "paid",
        subtotalAmount: 2500,
        totalAmount: 2500,
        items: [
          {
            productId: productA1._id,
            sellerId: sellerA.userId,
            name: productA1.name,
            price: 1000,
            quantity: 2,
          },
          {
            productId: productA2._id,
            sellerId: sellerA.userId,
            name: productA2.name,
            price: 500,
            quantity: 1,
          },
        ],
        shippingAddress: {
          name: "Buyer",
          phone: "9999999999",
          addressLine1: "Street 1",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
      });

      // Order 2 (delivered): 1x Product A2 (500) = 500, 1 unit
      await Order.create({
        buyerId: buyer2.userId,
        status: "delivered",
        subtotalAmount: 500,
        totalAmount: 500,
        items: [
          {
            productId: productA2._id,
            sellerId: sellerA.userId,
            name: productA2.name,
            price: 500,
            quantity: 1,
          },
        ],
        shippingAddress: {
          name: "Buyer",
          phone: "9999999999",
          addressLine1: "Street 1",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
      });

      // Expected for Seller A:
      // totalRevenue: 2500 + 500 = 3000
      // totalUnitsSold: 3 + 1 = 4
      // distinctOrders: 2
      // averageOrderValue: 3000 / 2 = 1500
      // ordersByStatus: paid: 1, delivered: 1
      const res = await request(app)
        .get("/api/modasphere/insights/seller/summary")
        .set("Authorization", `Bearer ${sellerA.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.totalRevenue).toBe(3000);
      expect(res.body.data.totalUnitsSold).toBe(4);
      expect(res.body.data.distinctOrders).toBe(2);
      expect(res.body.data.averageOrderValue).toBe(1500);
      expect(res.body.data.ordersByStatus.paid).toBe(1);
      expect(res.body.data.ordersByStatus.delivered).toBe(1);
      expect(res.body.data.ordersByStatus.shipped).toBe(0);
      expect(res.body.data.ordersByStatus.cancelled).toBe(0);
    });

    test("Multi-seller order credits each seller only for their own items (does not overcount with totalAmount)", async () => {
      // Order with items from Seller A (1000) and Seller B (2000), totalAmount = 3000
      await Order.create({
        buyerId: buyer1.userId,
        status: "paid",
        subtotalAmount: 3000,
        totalAmount: 3000,
        items: [
          {
            productId: productA1._id,
            sellerId: sellerA.userId,
            name: productA1.name,
            price: 1000,
            quantity: 1,
          },
          {
            productId: productB1._id,
            sellerId: sellerB.userId,
            name: productB1.name,
            price: 2000,
            quantity: 1,
          },
        ],
        shippingAddress: {
          name: "Buyer",
          phone: "9999999999",
          addressLine1: "Street 1",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
      });

      // Seller A gets 1000 (not 3000)
      const resA = await request(app)
        .get("/api/modasphere/insights/seller/summary")
        .set("Authorization", `Bearer ${sellerA.token}`);

      expect(resA.statusCode).toBe(200);
      expect(resA.body.data.totalRevenue).toBe(1000);
      expect(resA.body.data.totalUnitsSold).toBe(1);
      expect(resA.body.data.distinctOrders).toBe(1);

      // Seller B gets 2000 (not 3000)
      const resB = await request(app)
        .get("/api/modasphere/insights/seller/summary")
        .set("Authorization", `Bearer ${sellerB.token}`);

      expect(resB.statusCode).toBe(200);
      expect(resB.body.data.totalRevenue).toBe(2000);
      expect(resB.body.data.totalUnitsSold).toBe(1);
      expect(resB.body.data.distinctOrders).toBe(1);
    });

    test("Cancelled and pending_payment orders are excluded from revenue & volume metrics", async () => {
      // Cancelled order (should be excluded)
      await Order.create({
        buyerId: buyer1.userId,
        status: "cancelled",
        subtotalAmount: 5000,
        totalAmount: 5000,
        items: [
          {
            productId: productA1._id,
            sellerId: sellerA.userId,
            name: productA1.name,
            price: 1000,
            quantity: 5,
          },
        ],
        shippingAddress: {
          name: "Buyer",
          phone: "9999999999",
          addressLine1: "Street 1",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
      });

      // Pending payment order (should be excluded)
      await Order.create({
        buyerId: buyer1.userId,
        status: "pending_payment",
        subtotalAmount: 4000,
        totalAmount: 4000,
        items: [
          {
            productId: productA1._id,
            sellerId: sellerA.userId,
            name: productA1.name,
            price: 1000,
            quantity: 4,
          },
        ],
        shippingAddress: {
          name: "Buyer",
          phone: "9999999999",
          addressLine1: "Street 1",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
      });

      const res = await request(app)
        .get("/api/modasphere/insights/seller/summary")
        .set("Authorization", `Bearer ${sellerA.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.totalRevenue).toBe(0);
      expect(res.body.data.totalUnitsSold).toBe(0);
      expect(res.body.data.distinctOrders).toBe(0);
      expect(res.body.data.averageOrderValue).toBe(0);
      expect(res.body.data.ordersByStatus.cancelled).toBe(1);
      expect(res.body.data.ordersByStatus.pending_payment).toBe(1);
    });
  });

  describe("2. Date Range Handling & Boundaries", () => {
    test("Date-only 'to' parameter includes orders placed up to 23:59:59 of that day", async () => {
      // Order placed on 2026-05-15 at 23:59:00 UTC
      await Order.create({
        buyerId: buyer1.userId,
        status: "delivered",
        subtotalAmount: 1000,
        totalAmount: 1000,
        createdAt: new Date("2026-05-15T23:59:00.000Z"),
        items: [
          {
            productId: productA1._id,
            sellerId: sellerA.userId,
            name: productA1.name,
            price: 1000,
            quantity: 1,
          },
        ],
        shippingAddress: {
          name: "Buyer",
          phone: "9999999999",
          addressLine1: "Street 1",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
      });

      // Order placed on 2026-05-16 at 00:01:00 UTC (should be excluded)
      await Order.create({
        buyerId: buyer1.userId,
        status: "delivered",
        subtotalAmount: 1000,
        totalAmount: 1000,
        createdAt: new Date("2026-05-16T00:01:00.000Z"),
        items: [
          {
            productId: productA1._id,
            sellerId: sellerA.userId,
            name: productA1.name,
            price: 1000,
            quantity: 1,
          },
        ],
        shippingAddress: {
          name: "Buyer",
          phone: "9999999999",
          addressLine1: "Street 1",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
      });

      const res = await request(app)
        .get("/api/modasphere/insights/seller/summary?from=2026-05-10&to=2026-05-15")
        .set("Authorization", `Bearer ${sellerA.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.totalRevenue).toBe(1000);
      expect(res.body.data.totalUnitsSold).toBe(1);
      expect(res.body.data.distinctOrders).toBe(1);
    });

    test("Date validation rejects invalid formats and ranges over 366 days with 400", async () => {
      // Invalid date string
      const resInvalid = await request(app)
        .get("/api/modasphere/insights/seller/summary?from=notadate")
        .set("Authorization", `Bearer ${sellerA.token}`);

      expect(resInvalid.statusCode).toBe(400);
      expect(resInvalid.body.message).toMatch(/invalid/i);

      // Over 366 days
      const resTooLong = await request(app)
        .get("/api/modasphere/insights/seller/summary?from=2024-01-01&to=2026-01-01")
        .set("Authorization", `Bearer ${sellerA.token}`);

      expect(resTooLong.statusCode).toBe(400);
      expect(resTooLong.body.message).toMatch(/366 days/i);

      // from after to
      const resInverted = await request(app)
        .get("/api/modasphere/insights/seller/summary?from=2026-06-20&to=2026-06-10")
        .set("Authorization", `Bearer ${sellerA.token}`);

      expect(resInverted.statusCode).toBe(400);
      expect(resInverted.body.message).toMatch(/cannot be after/i);
    });
  });

  describe("3. Sales Trend & Top Products", () => {
    test("Sales trend groups revenue, units, and order counts across distinct dates", async () => {
      // Day 1: 2026-06-01 (2 units, 2000)
      await Order.create({
        buyerId: buyer1.userId,
        status: "delivered",
        subtotalAmount: 2000,
        totalAmount: 2000,
        createdAt: new Date("2026-06-01T10:00:00.000Z"),
        items: [
          {
            productId: productA1._id,
            sellerId: sellerA.userId,
            name: productA1.name,
            price: 1000,
            quantity: 2,
          },
        ],
        shippingAddress: {
          name: "Buyer",
          phone: "9999999999",
          addressLine1: "Street 1",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
      });

      // Day 2: 2026-06-03 (Order 1: 1 unit A1 (1000), Order 2: 3 units A2 (1500))
      await Order.create({
        buyerId: buyer1.userId,
        status: "paid",
        subtotalAmount: 1000,
        totalAmount: 1000,
        createdAt: new Date("2026-06-03T12:00:00.000Z"),
        items: [
          {
            productId: productA1._id,
            sellerId: sellerA.userId,
            name: productA1.name,
            price: 1000,
            quantity: 1,
          },
        ],
        shippingAddress: {
          name: "Buyer",
          phone: "9999999999",
          addressLine1: "Street 1",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
      });

      await Order.create({
        buyerId: buyer2.userId,
        status: "delivered",
        subtotalAmount: 1500,
        totalAmount: 1500,
        createdAt: new Date("2026-06-03T15:00:00.000Z"),
        items: [
          {
            productId: productA2._id,
            sellerId: sellerA.userId,
            name: productA2.name,
            price: 500,
            quantity: 3,
          },
        ],
        shippingAddress: {
          name: "Buyer",
          phone: "9999999999",
          addressLine1: "Street 1",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
      });

      const res = await request(app)
        .get("/api/modasphere/insights/seller/trend?from=2026-06-01&to=2026-06-05&interval=day")
        .set("Authorization", `Bearer ${sellerA.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.trend.length).toBe(2);

      // Day 1
      expect(res.body.data.trend[0].date).toBe("2026-06-01");
      expect(res.body.data.trend[0].revenue).toBe(2000);
      expect(res.body.data.trend[0].units).toBe(2);
      expect(res.body.data.trend[0].orders).toBe(1);

      // Day 2
      expect(res.body.data.trend[1].date).toBe("2026-06-03");
      expect(res.body.data.trend[1].revenue).toBe(2500);
      expect(res.body.data.trend[1].units).toBe(4);
      expect(res.body.data.trend[1].orders).toBe(2);
    });

    test("Top products returns best sellers by units and by revenue accurately", async () => {
      // Product A1 (price 1000): 3 units = 3000 revenue
      // Product A2 (price 500): 10 units = 5000 revenue
      await Order.create({
        buyerId: buyer1.userId,
        status: "delivered",
        subtotalAmount: 8000,
        totalAmount: 8000,
        items: [
          {
            productId: productA1._id,
            sellerId: sellerA.userId,
            name: productA1.name,
            price: 1000,
            quantity: 3,
          },
          {
            productId: productA2._id,
            sellerId: sellerA.userId,
            name: productA2.name,
            price: 500,
            quantity: 10,
          },
        ],
        shippingAddress: {
          name: "Buyer",
          phone: "9999999999",
          addressLine1: "Street 1",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
      });

      const res = await request(app)
        .get("/api/modasphere/insights/seller/top-products")
        .set("Authorization", `Bearer ${sellerA.token}`);

      expect(res.statusCode).toBe(200);

      // byUnits: Product A2 has 10 units, Product A1 has 3 units
      expect(res.body.data.byUnits[0].name).toBe("Leather Belt");
      expect(res.body.data.byUnits[0].unitsSold).toBe(10);
      expect(res.body.data.byUnits[1].name).toBe("Linen Shirt");
      expect(res.body.data.byUnits[1].unitsSold).toBe(3);

      // byRevenue: Product A2 has 5000 revenue, Product A1 has 3000 revenue
      expect(res.body.data.byRevenue[0].name).toBe("Leather Belt");
      expect(res.body.data.byRevenue[0].revenue).toBe(5000);
      expect(res.body.data.byRevenue[1].name).toBe("Linen Shirt");
      expect(res.body.data.byRevenue[1].revenue).toBe(3000);
    });
  });

  describe("4. Low Stock Filter & Empty State Handling", () => {
    test("Low stock returns only active products at or below threshold (ignores draft and high stock)", async () => {
      // 1. Active with stock 3 (should be returned)
      const pActiveLow = await Product.create({
        sellerId: sellerA.userId,
        name: "Low Stock Active Jacket",
        price: 4999,
        stock: 3,
        status: "active",
      });

      // 2. Draft with stock 1 (should be ignored)
      await Product.create({
        sellerId: sellerA.userId,
        name: "Draft Low Stock Top",
        price: 1299,
        stock: 1,
        status: "draft",
      });

      // 3. Active with stock 20 (above threshold 5, should be ignored)
      await Product.create({
        sellerId: sellerA.userId,
        name: "Ample Stock Trouser",
        price: 1999,
        stock: 20,
        status: "active",
      });

      const res = await request(app)
        .get("/api/modasphere/insights/seller/low-stock?threshold=5")
        .set("Authorization", `Bearer ${sellerA.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.products.length).toBe(1);
      expect(res.body.data.products[0]._id.toString()).toBe(pActiveLow._id.toString());
      expect(res.body.data.products[0].name).toBe("Low Stock Active Jacket");
      expect(res.body.data.products[0].stock).toBe(3);
    });

    test("Seller with no orders gets HTTP 200 with zero metrics and empty arrays (no NaN or errors)", async () => {
      const freshSeller = await createTestUser({ name: "Fresh Seller", role: "user" });

      const resSummary = await request(app)
        .get("/api/modasphere/insights/seller/summary")
        .set("Authorization", `Bearer ${freshSeller.token}`);

      expect(resSummary.statusCode).toBe(200);
      expect(resSummary.body.data.totalRevenue).toBe(0);
      expect(resSummary.body.data.totalUnitsSold).toBe(0);
      expect(resSummary.body.data.distinctOrders).toBe(0);
      expect(resSummary.body.data.averageOrderValue).toBe(0);
      expect(isNaN(resSummary.body.data.averageOrderValue)).toBe(false);

      const resTrend = await request(app)
        .get("/api/modasphere/insights/seller/trend")
        .set("Authorization", `Bearer ${freshSeller.token}`);

      expect(resTrend.statusCode).toBe(200);
      expect(resTrend.body.data.trend).toEqual([]);

      const resTop = await request(app)
        .get("/api/modasphere/insights/seller/top-products")
        .set("Authorization", `Bearer ${freshSeller.token}`);

      expect(resTop.statusCode).toBe(200);
      expect(resTop.body.data.byUnits).toEqual([]);
      expect(resTop.body.data.byRevenue).toEqual([]);
    });
  });

  describe("5. Platform Insights & Admin Authorization", () => {
    test("Platform summary aggregates gross revenue, buyers, active sellers, and processed refunds", async () => {
      // 1. Valid sales order: 2500
      await Order.create({
        buyerId: buyer1.userId,
        status: "delivered",
        subtotalAmount: 2500,
        totalAmount: 2500,
        items: [
          {
            productId: productA1._id,
            sellerId: sellerA.userId,
            name: productA1.name,
            price: 1000,
            quantity: 2,
          },
          {
            productId: productA2._id,
            sellerId: sellerA.userId,
            name: productA2.name,
            price: 500,
            quantity: 1,
          },
        ],
        shippingAddress: {
          name: "Buyer",
          phone: "9999999999",
          addressLine1: "Street 1",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
      });

      // 2. Multi-seller valid order: 3000
      await Order.create({
        buyerId: buyer2.userId,
        status: "shipped",
        subtotalAmount: 3000,
        totalAmount: 3000,
        items: [
          {
            productId: productA1._id,
            sellerId: sellerA.userId,
            name: productA1.name,
            price: 1000,
            quantity: 1,
          },
          {
            productId: productB1._id,
            sellerId: sellerB.userId,
            name: productB1.name,
            price: 2000,
            quantity: 1,
          },
        ],
        shippingAddress: {
          name: "Buyer",
          phone: "9999999999",
          addressLine1: "Street 1",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
      });

      // 3. Processed refund on cancelled order: refundAmount 1200
      await Order.create({
        buyerId: buyer1.userId,
        status: "cancelled",
        refundStatus: "processed",
        refundAmount: 1200,
        subtotalAmount: 1200,
        totalAmount: 1200,
        items: [
          {
            productId: productA1._id,
            sellerId: sellerA.userId,
            name: productA1.name,
            price: 1200,
            quantity: 1,
          },
        ],
        shippingAddress: {
          name: "Buyer",
          phone: "9999999999",
          addressLine1: "Street 1",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
      });

      const res = await request(app)
        .get("/api/modasphere/insights/platform/summary")
        .set("Authorization", `Bearer ${admin.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.totalOrders).toBe(2);
      expect(res.body.data.grossRevenue).toBe(5500); // 2500 + 3000
      expect(res.body.data.totalBuyers).toBe(2); // buyer1, buyer2
      expect(res.body.data.activeSellers).toBe(2); // sellerA, sellerB
      expect(res.body.data.refundCount).toBe(1);
      expect(res.body.data.totalRefundedAmount).toBe(1200);
    });

    test("Platform top categories aggregates revenue and units by product category", async () => {
      // apparel: 2x 1000 = 2000
      // accessories: 1x 500 (belt) + 1x 2000 (scarf) = 2500
      await Order.create({
        buyerId: buyer1.userId,
        status: "delivered",
        subtotalAmount: 4500,
        totalAmount: 4500,
        items: [
          {
            productId: productA1._id,
            sellerId: sellerA.userId,
            name: productA1.name,
            price: 1000,
            quantity: 2,
          },
          {
            productId: productA2._id,
            sellerId: sellerA.userId,
            name: productA2.name,
            price: 500,
            quantity: 1,
          },
          {
            productId: productB1._id,
            sellerId: sellerB.userId,
            name: productB1.name,
            price: 2000,
            quantity: 1,
          },
        ],
        shippingAddress: {
          name: "Buyer",
          phone: "9999999999",
          addressLine1: "Street 1",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
      });

      const res = await request(app)
        .get("/api/modasphere/insights/platform/top-categories")
        .set("Authorization", `Bearer ${admin.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.categories.length).toBe(2);

      // Top category by revenue is accessories (2500)
      expect(res.body.data.categories[0].category).toBe("accessories");
      expect(res.body.data.categories[0].revenue).toBe(2500);
      expect(res.body.data.categories[0].unitsSold).toBe(2);

      // Second is apparel (2000)
      expect(res.body.data.categories[1].category).toBe("apparel");
      expect(res.body.data.categories[1].revenue).toBe(2000);
      expect(res.body.data.categories[1].unitsSold).toBe(2);
    });

    test("Non-admin users receive 403 Forbidden on platform insights endpoints", async () => {
      const resSummary = await request(app)
        .get("/api/modasphere/insights/platform/summary")
        .set("Authorization", `Bearer ${sellerA.token}`);

      expect(resSummary.statusCode).toBe(403);
      expect(resSummary.body.message).toMatch(/not authorized/i);

      const resCategories = await request(app)
        .get("/api/modasphere/insights/platform/top-categories")
        .set("Authorization", `Bearer ${sellerA.token}`);

      expect(resCategories.statusCode).toBe(403);
      expect(resCategories.body.message).toMatch(/not authorized/i);
    });
  });
});
