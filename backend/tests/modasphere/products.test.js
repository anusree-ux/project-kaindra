const request = require("supertest");
const app = require("../../src/app");
const Product = require("../../src/models/modasphere/Product");
const { createTestUser } = require("../helpers/testUser");

describe("ModaSphere Products / Marketplace API (ModaMart)", () => {
  let seller;
  let buyer;
  let otherSeller;

  beforeEach(async () => {
    await Product.deleteMany({});
    seller = await createTestUser({ name: "Moda Designer", role: "user" });
    buyer = await createTestUser({ name: "Fashion Lover", role: "user" });
    otherSeller = await createTestUser({ name: "Other Brand", role: "user" });
  });

  describe("1. Product Creation Flow (Draft)", () => {
    test("Authenticated seller can create a product as draft", async () => {
      const res = await request(app)
        .post("/api/modasphere/products")
        .set("Authorization", `Bearer ${seller.token}`)
        .send({
          name: "Silk Oversized Blazer",
          description: "Premium handcrafted silk blazer with modern tailoring.",
          category: "apparel",
          price: 4999,
          stock: 15,
          tags: ["silk", "blazer", "sustainable"],
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.product).toBeDefined();
      expect(res.body.data.product.status).toBe("draft");
      expect(res.body.data.product.name).toBe("Silk Oversized Blazer");
      expect(res.body.data.product.price).toBe(4999);
      expect(res.body.data.product.stock).toBe(15);
      expect(res.body.data.product.tags).toEqual(
        expect.arrayContaining(["silk", "blazer", "sustainable"])
      );
      expect(res.body.data.product.sellerId.toString()).toBe(seller.userId.toString());
    });

    test("Rejects product creation without required name or price", async () => {
      const res = await request(app)
        .post("/api/modasphere/products")
        .set("Authorization", `Bearer ${seller.token}`)
        .send({
          description: "Missing name and price",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe("fail");
    });

    test("Unauthenticated user cannot create a product", async () => {
      const res = await request(app)
        .post("/api/modasphere/products")
        .send({
          name: "Anonymous Dress",
          price: 1999,
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("2. Product Publishing & Stock Validation", () => {
    test("Seller can publish draft product with stock > 0", async () => {
      const product = await Product.create({
        sellerId: seller.userId,
        name: "Vintage Denim Jacket",
        category: "apparel",
        price: 3499,
        stock: 5,
        status: "draft",
      });

      const res = await request(app)
        .patch(`/api/modasphere/products/${product._id}/publish`)
        .set("Authorization", `Bearer ${seller.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.product.status).toBe("active");
    });

    test("Publishing is rejected with 400 if stock is 0", async () => {
      const product = await Product.create({
        sellerId: seller.userId,
        name: "Sold Out Leather Boots",
        category: "footwear",
        price: 7999,
        stock: 0,
        status: "draft",
      });

      const res = await request(app)
        .patch(`/api/modasphere/products/${product._id}/publish`)
        .set("Authorization", `Bearer ${seller.token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/0 stock/i);

      // Verify status remains draft in database
      const unchanged = await Product.findById(product._id);
      expect(unchanged.status).toBe("draft");
    });
  });

  describe("3. Ownership & Authorization Checks", () => {
    let product;

    beforeEach(async () => {
      product = await Product.create({
        sellerId: seller.userId,
        name: "Handcrafted Ceramic Vase",
        category: "home",
        price: 1299,
        stock: 10,
        status: "draft",
      });
    });

    test("Non-owner cannot update someone else's product (403)", async () => {
      const res = await request(app)
        .patch(`/api/modasphere/products/${product._id}`)
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ price: 999 });

      expect(res.statusCode).toBe(403);
    });

    test("Non-owner cannot publish someone else's product (403)", async () => {
      const res = await request(app)
        .patch(`/api/modasphere/products/${product._id}/publish`)
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res.statusCode).toBe(403);
    });

    test("Non-owner cannot delete someone else's product (403)", async () => {
      const res = await request(app)
        .delete(`/api/modasphere/products/${product._id}`)
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res.statusCode).toBe(403);
    });

    test("Owner can successfully update and delete their own product", async () => {
      const updateRes = await request(app)
        .patch(`/api/modasphere/products/${product._id}`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({ price: 1499, stock: 20 });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.data.product.price).toBe(1499);
      expect(updateRes.body.data.product.stock).toBe(20);

      const deleteRes = await request(app)
        .delete(`/api/modasphere/products/${product._id}`)
        .set("Authorization", `Bearer ${seller.token}`);

      expect(deleteRes.statusCode).toBe(200);
      const inDb = await Product.findById(product._id);
      expect(inDb).toBeNull();
    });
  });

  describe("4. Public Product Browsing, Filtering, Search & Pagination", () => {
    beforeEach(async () => {
      await Product.create([
        {
          sellerId: seller.userId,
          name: "Linen Summer Shirt",
          description: "Breathable pure organic linen shirt for summer.",
          category: "apparel",
          tags: ["summer", "linen", "casual"],
          price: 1800,
          stock: 25,
          status: "active",
        },
        {
          sellerId: seller.userId,
          name: "Leather Chelsea Boots",
          description: "Genuine leather handcrafted chelsea boots.",
          category: "footwear",
          tags: ["boots", "leather", "classic"],
          price: 6500,
          stock: 8,
          status: "active",
        },
        {
          sellerId: otherSeller.userId,
          name: "Organic Face Cleanser",
          description: "Hydrating botanical daily face cleanser.",
          category: "beauty",
          tags: ["skincare", "organic", "glow"],
          price: 850,
          stock: 50,
          status: "active",
        },
        {
          sellerId: seller.userId,
          name: "Unreleased Silk Scarf",
          description: "Upcoming winter scarf collection.",
          category: "accessories",
          tags: ["silk", "winter"],
          price: 1200,
          stock: 0,
          status: "draft", // Should NOT appear in public browsing
        },
        {
          sellerId: otherSeller.userId,
          name: "Discontinued Sunglasses",
          description: "Retro aviator frame.",
          category: "accessories",
          price: 2500,
          stock: 0,
          status: "archived", // Should NOT appear in public browsing
        },
      ]);
    });

    test("Public browse returns ONLY active products", async () => {
      const res = await request(app).get("/api/modasphere/products");

      expect(res.statusCode).toBe(200);
      expect(res.body.data.products.length).toBe(3);
      const statuses = res.body.data.products.map((p) => p.status);
      expect(statuses.every((s) => s === "active")).toBe(true);
    });

    test("Filters products by category", async () => {
      const res = await request(app).get("/api/modasphere/products?category=footwear");

      expect(res.statusCode).toBe(200);
      expect(res.body.data.products.length).toBe(1);
      expect(res.body.data.products[0].name).toBe("Leather Chelsea Boots");
    });

    test("Filters products by tag", async () => {
      const res = await request(app).get("/api/modasphere/products?tag=organic");

      expect(res.statusCode).toBe(200);
      expect(res.body.data.products.length).toBe(1);
      expect(res.body.data.products[0].name).toBe("Organic Face Cleanser");
    });

    test("Keyword text search in name or description", async () => {
      const res = await request(app).get("/api/modasphere/products?search=linen");

      expect(res.statusCode).toBe(200);
      expect(res.body.data.products.length).toBe(1);
      expect(res.body.data.products[0].name).toBe("Linen Summer Shirt");
    });

    test("Sorting by price (ascending & descending)", async () => {
      const ascRes = await request(app).get("/api/modasphere/products?sort=price_asc");
      expect(ascRes.statusCode).toBe(200);
      expect(ascRes.body.data.products[0].price).toBe(850);
      expect(ascRes.body.data.products[2].price).toBe(6500);

      const descRes = await request(app).get("/api/modasphere/products?sort=price_desc");
      expect(descRes.statusCode).toBe(200);
      expect(descRes.body.data.products[0].price).toBe(6500);
      expect(descRes.body.data.products[2].price).toBe(850);
    });

    test("Pagination limit and page numbers", async () => {
      const res = await request(app).get("/api/modasphere/products?limit=2&page=1");

      expect(res.statusCode).toBe(200);
      expect(res.body.data.products.length).toBe(2);
      expect(res.body.data.pagination.total).toBe(3);
      expect(res.body.data.pagination.totalPages).toBe(2);
      expect(res.body.data.pagination.page).toBe(1);
    });
  });

  describe("5. Single Product Detail & Seller Portal", () => {
    let activeProduct;
    let draftProduct;

    beforeEach(async () => {
      activeProduct = await Product.create({
        sellerId: seller.userId,
        name: "Active Cotton Tote Bag",
        price: 599,
        stock: 12,
        status: "active",
      });

      draftProduct = await Product.create({
        sellerId: seller.userId,
        name: "Draft Concept Trench Coat",
        price: 8999,
        stock: 2,
        status: "draft",
      });
    });

    test("Anyone can view an active product by ID", async () => {
      const res = await request(app).get(`/api/modasphere/products/${activeProduct._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.product.name).toBe("Active Cotton Tote Bag");
    });

    test("Non-owner gets 404 when viewing a draft product", async () => {
      const anonymousRes = await request(app).get(
        `/api/modasphere/products/${draftProduct._id}`
      );
      expect(anonymousRes.statusCode).toBe(404);

      const otherUserRes = await request(app)
        .get(`/api/modasphere/products/${draftProduct._id}`)
        .set("Authorization", `Bearer ${buyer.token}`);
      expect(otherUserRes.statusCode).toBe(404);
    });

    test("Owner can view their own draft product by ID", async () => {
      const res = await request(app)
        .get(`/api/modasphere/products/${draftProduct._id}`)
        .set("Authorization", `Bearer ${seller.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.product.name).toBe("Draft Concept Trench Coat");
    });

    test("Seller can retrieve all their own products (/seller/me)", async () => {
      const res = await request(app)
        .get("/api/modasphere/products/seller/me")
        .set("Authorization", `Bearer ${seller.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.products.length).toBe(2);
      const names = res.body.data.products.map((p) => p.name);
      expect(names).toContain("Active Cotton Tote Bag");
      expect(names).toContain("Draft Concept Trench Coat");
    });
  });
});
