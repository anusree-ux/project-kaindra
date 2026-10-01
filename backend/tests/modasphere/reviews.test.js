const request = require("supertest");
const app = require("../../src/app");
const Product = require("../../src/models/modasphere/Product");
const Order = require("../../src/models/modasphere/Order");
const Review = require("../../src/models/modasphere/Review");
const { createTestUser } = require("../helpers/testUser");

describe("ModaSphere Product Reviews & Ratings API", () => {
  let seller;
  let buyer1;
  let buyer2;
  let buyer3;
  let nonBuyer;
  let adminUser;
  let product;
  let otherProduct;

  const createDeliveredOrder = async (buyer, prod) => {
    return await Order.create({
      buyerId: buyer.userId,
      subtotalAmount: 100,
      discountAmount: 0,
      totalAmount: 100,
      items: [
        {
          productId: prod._id,
          sellerId: seller.userId,
          name: prod.name,
          price: prod.price,
          quantity: 1,
        },
      ],
      totalAmount: prod.price,
      status: "delivered",
      shippingAddress: {
        name: "Test Receiver",
        phone: "9876543210",
        addressLine1: "123 Fashion Street",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
      },
    });
  };

  beforeEach(async () => {
    await Review.deleteMany({});
    await Order.deleteMany({});
    await Product.deleteMany({});

    seller = await createTestUser({ name: "Moda Seller", role: "user" });
    buyer1 = await createTestUser({ name: "Alice Reviewer", role: "user" });
    buyer2 = await createTestUser({ name: "Bob Shopper", role: "user" });
    buyer3 = await createTestUser({ name: "Charlie Critic", role: "user" });
    nonBuyer = await createTestUser({ name: "Dave Stranger", role: "user" });
    adminUser = await createTestUser({ name: "Admin Mod", role: "admin" });

    product = await Product.create({
      sellerId: seller.userId,
      name: "Tailored Linen Blazer",
      description: "Breathable sustainable linen blazer",
      category: "apparel",
      price: 3499,
      stock: 20,
      status: "active",
    });

    otherProduct = await Product.create({
      sellerId: seller.userId,
      name: "Silk Scarf",
      description: "Handmade silk scarf",
      category: "accessories",
      price: 999,
      stock: 10,
      status: "active",
    });
  });

  describe("1. Review Creation & Authorization", () => {
    test("User who purchased and received (delivered) a product can review it", async () => {
      await createDeliveredOrder(buyer1, product);

      const res = await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({
          rating: 5,
          comment: "Outstanding fabric quality and perfect fit!",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.review).toBeDefined();
      expect(res.body.data.review.rating).toBe(5);
      expect(res.body.data.review.comment).toBe("Outstanding fabric quality and perfect fit!");
      expect(res.body.data.review.productId.toString()).toBe(product._id.toString());
      expect(res.body.data.review.userId.toString()).toBe(buyer1.userId.toString());

      // Check product summary updated
      const updatedProd = await Product.findById(product._id);
      expect(updatedProd.averageRating).toBe(5);
      expect(updatedProd.reviewCount).toBe(1);
    });

    test("User who has not purchased the product is rejected with 403", async () => {
      const res = await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${nonBuyer.token}`)
        .send({
          rating: 4,
          comment: "Looks nice but I never bought it",
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe("fail");
      expect(res.body.message).toMatch(/delivered/i);
    });

    test("User with non-delivered order (e.g. shipped or paid) is rejected with 403", async () => {
      await Order.create({
        buyerId: buyer1.userId,
        subtotalAmount: 100,
        discountAmount: 0,
        totalAmount: 100,
        items: [
          {
            productId: product._id,
            sellerId: seller.userId,
            name: product.name,
            price: product.price,
            quantity: 1,
          },
        ],
        totalAmount: product.price,
        status: "shipped",
        shippingAddress: {
          name: "Test Receiver",
          phone: "9876543210",
          addressLine1: "123 Fashion Street",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
      });

      const res = await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({
          rating: 4,
          comment: "Still on the way",
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe("fail");
    });

    test("Duplicate review attempt by the same user is rejected cleanly with 400", async () => {
      await createDeliveredOrder(buyer1, product);

      // First review
      const firstRes = await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ rating: 5, comment: "First review" });
      expect(firstRes.statusCode).toBe(201);

      // Second review attempt by same buyer on same product
      const secondRes = await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ rating: 4, comment: "Second review attempt" });

      expect(secondRes.statusCode).toBe(400);
      expect(secondRes.body.status).toBe("fail");
      expect(secondRes.body.message).toMatch(/already submitted a review/i);
    });

    test("Different buyers with delivered orders can review the same product without colliding", async () => {
      await createDeliveredOrder(buyer1, product);
      await createDeliveredOrder(buyer2, product);

      const res1 = await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ rating: 5, comment: "Buyer 1 review" });
      expect(res1.statusCode).toBe(201);

      const res2 = await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer2.token}`)
        .send({ rating: 4, comment: "Buyer 2 review" });
      expect(res2.statusCode).toBe(201);

      const updatedProd = await Product.findById(product._id);
      expect(updatedProd.reviewCount).toBe(2);
      expect(updatedProd.averageRating).toBe(4.5);
    });

    test("Rejects review with invalid rating (< 1 or > 5)", async () => {
      await createDeliveredOrder(buyer1, product);

      const resUnder = await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ rating: 0 });
      expect(resUnder.statusCode).toBe(400);

      const resOver = await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ rating: 6 });
      expect(resOver.statusCode).toBe(400);
    });
  });

  describe("2. Review Mathematical Verification across Life Cycle", () => {
    test("Calculates exact expected average rating and count across multiple reviews, updates, and deletes", async () => {
      // Setup 3 buyers with delivered orders
      await createDeliveredOrder(buyer1, product);
      await createDeliveredOrder(buyer2, product);
      await createDeliveredOrder(buyer3, product);

      // 1. Buyer 1 rates 5
      await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ rating: 5, comment: "5 stars" });

      let prod = await Product.findById(product._id);
      expect(prod.reviewCount).toBe(1);
      expect(prod.averageRating).toBe(5);

      // 2. Buyer 2 rates 4
      await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer2.token}`)
        .send({ rating: 4, comment: "4 stars" });

      prod = await Product.findById(product._id);
      expect(prod.reviewCount).toBe(2);
      expect(prod.averageRating).toBe(4.5); // (5 + 4) / 2 = 4.5

      // 3. Buyer 3 rates 3
      const res3 = await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer3.token}`)
        .send({ rating: 3, comment: "3 stars" });

      const review3Id = res3.body.data.review._id;

      prod = await Product.findById(product._id);
      expect(prod.reviewCount).toBe(3);
      expect(prod.averageRating).toBe(4); // (5 + 4 + 3) / 3 = 4.0

      // 4. Buyer 3 updates review from 3 to 2
      const updateRes = await request(app)
        .patch(`/api/modasphere/products/${product._id}/reviews/${review3Id}`)
        .set("Authorization", `Bearer ${buyer3.token}`)
        .send({ rating: 2, comment: "Changed my mind to 2 stars" });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.data.review.rating).toBe(2);

      prod = await Product.findById(product._id);
      expect(prod.reviewCount).toBe(3);
      // Expected: (5 + 4 + 2) / 3 = 11 / 3 = 3.6666... -> rounded to 3.67
      expect(prod.averageRating).toBe(3.67);

      // 5. Buyer 3 deletes review
      const deleteRes = await request(app)
        .delete(`/api/modasphere/products/${product._id}/reviews/${review3Id}`)
        .set("Authorization", `Bearer ${buyer3.token}`);

      expect(deleteRes.statusCode).toBe(200);

      prod = await Product.findById(product._id);
      expect(prod.reviewCount).toBe(2);
      // Expected: (5 + 4) / 2 = 4.5
      expect(prod.averageRating).toBe(4.5);
    });

    test("Only review owner can update their review", async () => {
      await createDeliveredOrder(buyer1, product);
      const res = await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ rating: 5, comment: "Original" });

      const reviewId = res.body.data.review._id;

      // Another user attempts to update
      const unauthorizedRes = await request(app)
        .patch(`/api/modasphere/products/${product._id}/reviews/${reviewId}`)
        .set("Authorization", `Bearer ${buyer2.token}`)
        .send({ rating: 1, comment: "Hacked" });

      expect(unauthorizedRes.statusCode).toBe(403);
    });

    test("Admin can delete any review, and rating recalculates", async () => {
      await createDeliveredOrder(buyer1, product);
      const res = await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ rating: 5, comment: "Buyer review" });

      const reviewId = res.body.data.review._id;

      const deleteRes = await request(app)
        .delete(`/api/modasphere/products/${product._id}/reviews/${reviewId}`)
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(deleteRes.statusCode).toBe(200);

      const prod = await Product.findById(product._id);
      expect(prod.reviewCount).toBe(0);
      expect(prod.averageRating).toBe(0);
    });
  });

  describe("3. Fetching Reviews & User's Own Review", () => {
    test("GET /products/:productId/reviews returns public paginated reviews populated with reviewer name", async () => {
      await createDeliveredOrder(buyer1, product);
      await createDeliveredOrder(buyer2, product);

      await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ rating: 4, comment: "Good quality" });

      await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer2.token}`)
        .send({ rating: 5, comment: "Excellent service" });

      const res = await request(app).get(`/api/modasphere/products/${product._id}/reviews`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.reviews.length).toBe(2);
      expect(res.body.data.pagination.total).toBe(2);
      // Newest first
      expect(res.body.data.reviews[0].comment).toBe("Excellent service");
      expect(res.body.data.reviews[0].userId.name).toBe("Bob Shopper");
      expect(res.body.data.reviews[1].userId.name).toBe("Alice Reviewer");
    });

    test("GET /products/:productId/reviews/me returns the logged in user's review or null", async () => {
      await createDeliveredOrder(buyer1, product);

      // Before reviewing: returns null
      const beforeRes = await request(app)
        .get(`/api/modasphere/products/${product._id}/reviews/me`)
        .set("Authorization", `Bearer ${buyer1.token}`);

      expect(beforeRes.statusCode).toBe(200);
      expect(beforeRes.body.data.review).toBeNull();

      // Submit review
      await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ rating: 5, comment: "My own review" });

      // After reviewing: returns user's review
      const afterRes = await request(app)
        .get(`/api/modasphere/products/${product._id}/reviews/me`)
        .set("Authorization", `Bearer ${buyer1.token}`);

      expect(afterRes.statusCode).toBe(200);
      expect(afterRes.body.data.review).not.toBeNull();
      expect(afterRes.body.data.review.rating).toBe(5);
      expect(afterRes.body.data.review.comment).toBe("My own review");
    });
  });
});
