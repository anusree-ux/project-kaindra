const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../src/app");
const Product = require("../../src/models/modasphere/Product");
const Wishlist = require("../../src/models/modasphere/Wishlist");
const { createTestUser } = require("../helpers/testUser");

describe("ModaSphere Wishlist / Favorites API", () => {
  let seller;
  let buyer;
  let product1;
  let product2;
  let inactiveProduct;

  beforeEach(async () => {
    await Wishlist.deleteMany({});
    await Product.deleteMany({});

    seller = await createTestUser({ name: "Moda Fashion Seller", role: "user" });
    buyer = await createTestUser({ name: "Shopper Alice", role: "user" });

    product1 = await Product.create({
      sellerId: seller.userId,
      name: "Cashmere Turtleneck Sweater",
      description: "100% pure cashmere",
      category: "apparel",
      price: 8500,
      stock: 10,
      status: "active",
      images: [{ url: "https://example.com/sweater.jpg", publicId: "sweater1" }],
    });

    product2 = await Product.create({
      sellerId: seller.userId,
      name: "Handcrafted Leather Belt",
      description: "Full-grain Italian leather",
      category: "accessories",
      price: 2500,
      stock: 15,
      status: "active",
      images: [{ url: "https://example.com/belt.jpg", publicId: "belt1" }],
    });

    inactiveProduct = await Product.create({
      sellerId: seller.userId,
      name: "Archived Vintage Trench",
      description: "Out of production trench coat",
      category: "apparel",
      price: 15000,
      stock: 0,
      status: "archived",
      images: [{ url: "https://example.com/trench.jpg", publicId: "trench1" }],
    });
  });

  afterAll(async () => {
    await Wishlist.deleteMany({});
    await Product.deleteMany({});
  });

  describe("1. Adding Products to Wishlist", () => {
    it("should successfully add a product to the user's wishlist", async () => {
      const res = await request(app)
        .post(`/api/modasphere/wishlist/${product1._id}`)
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.inWishlist).toBe(true);

      // Verify in DB
      const wishlist = await Wishlist.findOne({ userId: buyer.userId });
      expect(wishlist).toBeDefined();
      expect(wishlist.productIds).toHaveLength(1);
      expect(wishlist.productIds[0].toString()).toBe(product1._id.toString());
    });

    it("should handle adding the same product twice idempotently without duplicating or erroring", async () => {
      // First add
      await request(app)
        .post(`/api/modasphere/wishlist/${product1._id}`)
        .set("Authorization", `Bearer ${buyer.token}`);

      // Second add
      const res = await request(app)
        .post(`/api/modasphere/wishlist/${product1._id}`)
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.inWishlist).toBe(true);

      // Verify in DB: still exactly 1 item
      const wishlist = await Wishlist.findOne({ userId: buyer.userId });
      expect(wishlist.productIds).toHaveLength(1);
      expect(wishlist.productIds[0].toString()).toBe(product1._id.toString());
    });

    it("should return 404 when adding a non-existent product ID", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/modasphere/wishlist/${fakeId}`)
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/product not found/i);
    });
  });

  describe("2. Removing Products from Wishlist", () => {
    it("should remove a product from the user's wishlist", async () => {
      // Add product1 and product2
      await request(app)
        .post(`/api/modasphere/wishlist/${product1._id}`)
        .set("Authorization", `Bearer ${buyer.token}`);

      await request(app)
        .post(`/api/modasphere/wishlist/${product2._id}`)
        .set("Authorization", `Bearer ${buyer.token}`);

      // Remove product1
      const res = await request(app)
        .delete(`/api/modasphere/wishlist/${product1._id}`)
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.inWishlist).toBe(false);

      // Verify in DB
      const wishlist = await Wishlist.findOne({ userId: buyer.userId });
      expect(wishlist.productIds).toHaveLength(1);
      expect(wishlist.productIds[0].toString()).toBe(product2._id.toString());
    });
  });

  describe("3. Retrieving Wishlist & Filtering Inactive Products", () => {
    it("should return populated active products and exclude archived/inactive products without deleting them from DB", async () => {
      // Add active product1 and archived inactiveProduct to wishlist directly
      await Wishlist.create({
        userId: buyer.userId,
        productIds: [product1._id, inactiveProduct._id, product2._id],
      });

      const res = await request(app)
        .get("/api/modasphere/wishlist")
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.wishlist).toHaveLength(2); // Only active product1 & product2
      expect(res.body.data.count).toBe(2);

      const returnedNames = res.body.data.wishlist.map((p) => p.name);
      expect(returnedNames).toContain("Cashmere Turtleneck Sweater");
      expect(returnedNames).toContain("Handcrafted Leather Belt");
      expect(returnedNames).not.toContain("Archived Vintage Trench");

      // Verify DB still retains the inactive product ID
      const dbWishlist = await Wishlist.findOne({ userId: buyer.userId });
      expect(dbWishlist.productIds).toHaveLength(3);
    });

    it("should return empty array if user has not added anything to wishlist", async () => {
      const res = await request(app)
        .get("/api/modasphere/wishlist")
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.wishlist).toEqual([]);
      expect(res.body.data.count).toBe(0);
    });
  });

  describe("4. Check In-Wishlist Status (Quick Boolean Check)", () => {
    it("should return inWishlist: true if product is in wishlist, and false otherwise", async () => {
      // Add product1
      await request(app)
        .post(`/api/modasphere/wishlist/${product1._id}`)
        .set("Authorization", `Bearer ${buyer.token}`);

      // Check product1 (should be true)
      const res1 = await request(app)
        .get(`/api/modasphere/wishlist/check/${product1._id}`)
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res1.status).toBe(200);
      expect(res1.body.data.inWishlist).toBe(true);

      // Check product2 (should be false)
      const res2 = await request(app)
        .get(`/api/modasphere/wishlist/check/${product2._id}`)
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res2.status).toBe(200);
      expect(res2.body.data.inWishlist).toBe(false);
    });
  });

  describe("5. Authentication Checks", () => {
    it("should reject unauthenticated requests with 401", async () => {
      const res = await request(app).get("/api/modasphere/wishlist");
      expect(res.status).toBe(401);
    });
  });
});
