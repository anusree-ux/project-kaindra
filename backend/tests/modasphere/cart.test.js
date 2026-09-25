const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../src/app");
const Product = require("../../src/models/modasphere/Product");
const Cart = require("../../src/models/modasphere/Cart");
const { createTestUser } = require("../helpers/testUser");

describe("ModaSphere Cart System", () => {
  let seller;
  let buyer;
  let product1;
  let product2;
  let lowStockProduct;

  beforeEach(async () => {
    await Cart.deleteMany({});
    await Product.deleteMany({});

    seller = await createTestUser({ name: "Cart Seller", role: "user" });
    buyer = await createTestUser({ name: "Cart Buyer", role: "user" });

    // Create products
    product1 = await Product.create({
      sellerId: seller.userId,
      name: "Silk Summer Shirt",
      description: "Breathable silk shirt",
      category: "apparel",
      price: 1500,
      stock: 10,
      status: "active",
      images: [{ url: "https://example.com/shirt.jpg", publicId: "shirt1" }],
    });

    product2 = await Product.create({
      sellerId: seller.userId,
      name: "Linen Trousers",
      description: "Comfortable linen trousers",
      category: "apparel",
      price: 2000,
      stock: 5,
      status: "active",
      images: [{ url: "https://example.com/pants.jpg", publicId: "pants1" }],
    });

    lowStockProduct = await Product.create({
      sellerId: seller.userId,
      name: "Limited Edition Jacket",
      description: "Very low stock item",
      category: "apparel",
      price: 5000,
      stock: 2,
      status: "active",
      images: [{ url: "https://example.com/jacket.jpg", publicId: "jacket1" }],
    });
  });

  describe("1. Adding Items to Cart", () => {
    it("should create a cart and add an item successfully", async () => {
      const res = await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({
          productId: product1._id,
          quantity: 2,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.cart.items).toHaveLength(1);
      expect(res.body.data.cart.items[0].product._id.toString()).toBe(product1._id.toString());
      expect(res.body.data.cart.items[0].quantity).toBe(2);
      expect(res.body.data.cart.totalItems).toBe(2);
      expect(res.body.data.cart.subtotal).toBe(3000);
    });

    it("should increase quantity when adding the same product twice (no duplicate items)", async () => {
      // First addition: 2 units
      await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ productId: product1._id, quantity: 2 });

      // Second addition: 3 units
      const res = await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ productId: product1._id, quantity: 3 });

      expect(res.status).toBe(200);
      expect(res.body.data.cart.items).toHaveLength(1);
      expect(res.body.data.cart.items[0].quantity).toBe(5);
      expect(res.body.data.cart.totalItems).toBe(5);
      expect(res.body.data.cart.subtotal).toBe(7500);
    });

    it("should reject adding more than available stock (400)", async () => {
      const res = await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({
          productId: lowStockProduct._id,
          quantity: 5, // stock is only 2
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/exceeds available stock/i);
    });

    it("should reject adding when cumulative quantity in cart exceeds stock", async () => {
      // Add 2 units (all stock)
      await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ productId: lowStockProduct._id, quantity: 2 });

      // Try adding 1 more unit
      const res = await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ productId: lowStockProduct._id, quantity: 1 });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/exceeds available stock/i);
    });

    it("should reject adding non-existent or inactive products", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ productId: fakeId, quantity: 1 });

      expect(res.status).toBe(404);
    });
  });

  describe("2. Updating Cart Item Quantity", () => {
    beforeEach(async () => {
      await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ productId: product1._id, quantity: 2 });
    });

    it("should update the quantity of an existing item in the cart", async () => {
      const res = await request(app)
        .patch(`/api/modasphere/cart/items/${product1._id}`)
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ quantity: 4 });

      expect(res.status).toBe(200);
      expect(res.body.data.cart.items[0].quantity).toBe(4);
      expect(res.body.data.cart.totalItems).toBe(4);
      expect(res.body.data.cart.subtotal).toBe(6000);
    });

    it("should reject quantity update if requested quantity exceeds stock (400)", async () => {
      const res = await request(app)
        .patch(`/api/modasphere/cart/items/${product1._id}`)
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ quantity: 15 }); // stock is 10

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/exceeds available stock/i);
    });

    it("should reject updating product not currently in cart (404)", async () => {
      const res = await request(app)
        .patch(`/api/modasphere/cart/items/${product2._id}`)
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ quantity: 1 });

      expect(res.status).toBe(404);
    });
  });

  describe("3. Removing Items & Clearing Cart", () => {
    beforeEach(async () => {
      await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ productId: product1._id, quantity: 2 });

      await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ productId: product2._id, quantity: 1 });
    });

    it("should remove a single item from the cart", async () => {
      const res = await request(app)
        .delete(`/api/modasphere/cart/items/${product1._id}`)
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.cart.items).toHaveLength(1);
      expect(res.body.data.cart.items[0].product._id.toString()).toBe(product2._id.toString());
      expect(res.body.data.cart.totalItems).toBe(1);
    });

    it("should clear the entire cart", async () => {
      const res = await request(app)
        .delete("/api/modasphere/cart")
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.cart.items).toHaveLength(0);
      expect(res.body.data.cart.totalItems).toBe(0);
      expect(res.body.data.cart.subtotal).toBe(0);
    });
  });

  describe("4. Dynamic Availability & Stale/Archived Items Handling", () => {
    it("should exclude deleted or archived products on GET /api/modasphere/cart without crashing", async () => {
      // Add product1 and a temporary product
      const tempProduct = await Product.create({
        sellerId: seller.userId,
        name: "Temporary Sample Shoes",
        category: "footwear",
        price: 3500,
        stock: 5,
        status: "active",
      });

      await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ productId: product1._id, quantity: 1 });

      await request(app)
        .post("/api/modasphere/cart/items")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({ productId: tempProduct._id, quantity: 2 });

      // Archive temp product
      tempProduct.status = "archived";
      await tempProduct.save();

      // Retrieve cart
      const res = await request(app)
        .get("/api/modasphere/cart")
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.cart.unavailableItemsRemoved).toBe(true);
      expect(res.body.data.cart.items).toHaveLength(1);
      expect(res.body.data.cart.items[0].product._id.toString()).toBe(product1._id.toString());
      expect(res.body.data.cart.subtotal).toBe(1500);
    });
  });

  describe("5. Authentication Checks", () => {
    it("should reject unauthenticated access with 401", async () => {
      const res = await request(app).get("/api/modasphere/cart");
      expect(res.status).toBe(401);
    });
  });
});
