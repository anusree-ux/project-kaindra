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

  describe("1. Review Creation & Purchase Verification", () => {
    test("Reviewing a delivered order's product succeeds and updates Product's averageRating/reviewCount", async () => {
      const order = await createDeliveredOrder(buyer1, product);

      const res = await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({
          orderId: order._id,
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
      expect(res.body.data.review.orderId.toString()).toBe(order._id.toString());

      const updatedProd = await Product.findById(product._id);
      expect(updatedProd.averageRating).toBe(5);
      expect(updatedProd.reviewCount).toBe(1);
    });

    test("Reviewing without a delivered order is rejected (400 / 403 / 404)", async () => {
      // 1. Missing orderId
      const resNoOrder = await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ rating: 5, comment: "No order" });
      expect(resNoOrder.statusCode).toBe(400);

      // 2. Non-delivered order status (e.g. shipped)
      const shippedOrder = await Order.create({
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

      const resShipped = await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ orderId: shippedOrder._id, rating: 5 });
      expect(resShipped.statusCode).toBe(400);
      expect(resShipped.body.message).toMatch(/delivered/i);

      // 3. Someone else's delivered order
      const otherBuyerOrder = await createDeliveredOrder(buyer2, product);
      const resOtherBuyer = await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ orderId: otherBuyerOrder._id, rating: 5 });
      expect(resOtherBuyer.statusCode).toBe(403);

      // 4. Delivered order for a different product
      const differentProdOrder = await createDeliveredOrder(buyer1, otherProduct);
      const resWrongProd = await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ orderId: differentProdOrder._id, rating: 5 });
      expect(resWrongProd.statusCode).toBe(400);
      expect(resWrongProd.body.message).toMatch(/does not contain the specified product/i);
    });

    test("Reviewing the same product twice is rejected with clean 400 error", async () => {
      const order1 = await createDeliveredOrder(buyer1, product);
      const order2 = await createDeliveredOrder(buyer1, product); // bought a second time

      // First review
      const firstRes = await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ orderId: order1._id, rating: 5, comment: "First review" });
      expect(firstRes.statusCode).toBe(201);

      // Second review attempt
      const secondRes = await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ orderId: order2._id, rating: 4, comment: "Second review attempt" });

      expect(secondRes.statusCode).toBe(400);
      expect(secondRes.body.status).toBe("fail");
      expect(secondRes.body.message).toMatch(/already submitted a review/i);
    });

    test("Rejects review with invalid rating (< 1 or > 5)", async () => {
      const order = await createDeliveredOrder(buyer1, product);

      const resUnder = await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ orderId: order._id, rating: 0 });
      expect(resUnder.statusCode).toBe(400);

      const resOver = await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ orderId: order._id, rating: 6 });
      expect(resOver.statusCode).toBe(400);
    });
  });

  describe("2. Rating Math Verification & Lifecycle (Update / Delete)", () => {
    test("Multiple reviews calculate exact average rating (ratings 5, 3, 4 produce exactly 4.0)", async () => {
      const order1 = await createDeliveredOrder(buyer1, product);
      const order2 = await createDeliveredOrder(buyer2, product);
      const order3 = await createDeliveredOrder(buyer3, product);

      // Review 1: Rating 5
      await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ orderId: order1._id, rating: 5, comment: "5 stars" });

      let prod = await Product.findById(product._id);
      expect(prod.reviewCount).toBe(1);
      expect(prod.averageRating).toBe(5);

      // Review 2: Rating 3
      const res2 = await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer2.token}`)
        .send({ orderId: order2._id, rating: 3, comment: "3 stars" });
      const review2Id = res2.body.data.review._id;

      prod = await Product.findById(product._id);
      expect(prod.reviewCount).toBe(2);
      expect(prod.averageRating).toBe(4.0); // (5 + 3) / 2 = 4.0

      // Review 3: Rating 4
      await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer3.token}`)
        .send({ orderId: order3._id, rating: 4, comment: "4 stars" });

      prod = await Product.findById(product._id);
      expect(prod.reviewCount).toBe(3);
      // Expected: (5 + 3 + 4) / 3 = 12 / 3 = 4.0 exactly
      expect(prod.averageRating).toBe(4.0);

      // Update Review 2 from 3 to 5 (PATCH /api/modasphere/reviews/:id)
      const updateRes = await request(app)
        .patch(`/api/modasphere/reviews/${review2Id}`)
        .set("Authorization", `Bearer ${buyer2.token}`)
        .send({ rating: 5, comment: "Updated to 5 stars" });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.data.review.rating).toBe(5);

      prod = await Product.findById(product._id);
      expect(prod.reviewCount).toBe(3);
      // Expected: (5 + 5 + 4) / 3 = 14 / 3 = 4.6666... -> 4.67
      expect(prod.averageRating).toBe(4.67);

      // Delete Review 2 (DELETE /api/modasphere/reviews/:id)
      const deleteRes = await request(app)
        .delete(`/api/modasphere/reviews/${review2Id}`)
        .set("Authorization", `Bearer ${buyer2.token}`);

      expect(deleteRes.statusCode).toBe(200);

      prod = await Product.findById(product._id);
      expect(prod.reviewCount).toBe(2);
      // Expected: (5 + 4) / 2 = 4.5
      expect(prod.averageRating).toBe(4.5);
    });

    test("Deleting the only review resets rating and count to 0 without NaN", async () => {
      const order = await createDeliveredOrder(buyer1, product);

      const createRes = await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ orderId: order._id, rating: 5, comment: "Sole review" });

      const reviewId = createRes.body.data.review._id;

      let prod = await Product.findById(product._id);
      expect(prod.reviewCount).toBe(1);
      expect(prod.averageRating).toBe(5);

      // Delete sole review
      const deleteRes = await request(app)
        .delete(`/api/modasphere/reviews/${reviewId}`)
        .set("Authorization", `Bearer ${buyer1.token}`);

      expect(deleteRes.statusCode).toBe(200);

      prod = await Product.findById(product._id);
      expect(prod.reviewCount).toBe(0);
      expect(prod.averageRating).toBe(0);
      expect(isNaN(prod.averageRating)).toBe(false);
    });

    test("Unauthorized user cannot update or delete someone else's review", async () => {
      const order = await createDeliveredOrder(buyer1, product);
      const res = await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ orderId: order._id, rating: 5 });

      const reviewId = res.body.data.review._id;

      // Update attempt by buyer2
      const updateRes = await request(app)
        .patch(`/api/modasphere/reviews/${reviewId}`)
        .set("Authorization", `Bearer ${buyer2.token}`)
        .send({ rating: 1 });
      expect(updateRes.statusCode).toBe(403);

      // Delete attempt by buyer2
      const deleteRes = await request(app)
        .delete(`/api/modasphere/reviews/${reviewId}`)
        .set("Authorization", `Bearer ${buyer2.token}`);
      expect(deleteRes.statusCode).toBe(403);
    });
  });

  describe("3. Eligibility Check (can-review) & Public Listing", () => {
    test("GET /api/modasphere/products/:productId/can-review returns correct true/false and reasons", async () => {
      // 1. Non-purchaser: returns canReview: false
      const res1 = await request(app)
        .get(`/api/modasphere/products/${product._id}/can-review`)
        .set("Authorization", `Bearer ${nonBuyer.token}`);

      expect(res1.statusCode).toBe(200);
      expect(res1.body.data.canReview).toBe(false);
      expect(res1.body.data.reason).toMatch(/only review products from delivered orders/i);

      // 2. Purchaser with delivered order: returns canReview: true
      const order1 = await createDeliveredOrder(buyer1, product);
      await createDeliveredOrder(buyer1, product); // Multiple delivered orders

      const res2 = await request(app)
        .get(`/api/modasphere/products/${product._id}/can-review`)
        .set("Authorization", `Bearer ${buyer1.token}`);

      expect(res2.statusCode).toBe(200);
      expect(res2.body.data.canReview).toBe(true);
      expect(res2.body.data.orderId).toBeDefined();

      // 3. Purchaser after submitting review: returns canReview: false
      await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ orderId: order1._id, rating: 5, comment: "Reviewed!" });

      const res3 = await request(app)
        .get(`/api/modasphere/products/${product._id}/can-review`)
        .set("Authorization", `Bearer ${buyer1.token}`);

      expect(res3.statusCode).toBe(200);
      expect(res3.body.data.canReview).toBe(false);
      expect(res3.body.data.reason).toMatch(/already reviewed this product/i);
    });

    test("GET /api/modasphere/products/:productId/reviews returns public paginated reviews populated with reviewer name", async () => {
      const order1 = await createDeliveredOrder(buyer1, product);
      const order2 = await createDeliveredOrder(buyer2, product);

      await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({ orderId: order1._id, rating: 4, comment: "Good quality" });

      await request(app)
        .post(`/api/modasphere/products/${product._id}/reviews`)
        .set("Authorization", `Bearer ${buyer2.token}`)
        .send({ orderId: order2._id, rating: 5, comment: "Excellent service" });

      const res = await request(app).get(`/api/modasphere/products/${product._id}/reviews`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.reviews.length).toBe(2);
      expect(res.body.data.pagination.total).toBe(2);
      // Sorted newest first
      expect(res.body.data.reviews[0].comment).toBe("Excellent service");
      expect(res.body.data.reviews[0].userId.name).toBe("Bob Shopper");
      expect(res.body.data.reviews[1].userId.name).toBe("Alice Reviewer");
    });
  });
});
