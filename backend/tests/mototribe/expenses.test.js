const request = require("supertest");
const app = require("../../src/app");
const Ride = require("../../src/models/mototribe/Ride");
const RideParticipant = require("../../src/models/mototribe/RideParticipant");
const RideExpense = require("../../src/models/mototribe/RideExpense");
const { createTestUser } = require("../helpers/testUser");

describe("MotoTribe Ride Expense Tracking API", () => {
  let organizerToken, organizerId, organizerVehicleId;
  let participantToken, participantId;
  let outsiderToken, outsiderId;
  let rideId;

  beforeEach(async () => {
    // 1. Organizer
    const org = await createTestUser({ name: "Organizer Rider" });
    organizerToken = org.token;
    organizerId = org.userId;
    organizerVehicleId = org.vehicleId;

    // 2. Confirmed Participant
    const part = await createTestUser({ name: "Confirmed Participant" });
    participantToken = part.token;
    participantId = part.userId;

    // 3. Outsider (Non-participant)
    const out = await createTestUser({ name: "Outsider Rider" });
    outsiderToken = out.token;
    outsiderId = out.userId;

    // Create ride with budget = 5000
    const ride = await Ride.create({
      organizerId,
      vehicleId: organizerVehicleId,
      title: "Southern Highway Tour",
      origin: "Bangalore",
      destination: "Kanyakumari",
      startDate: new Date(Date.now() + 86400000),
      distanceKm: 650,
      budget: 5000,
      status: "planning",
    });
    rideId = ride._id.toString();

    // Add confirmed participant
    await RideParticipant.create({
      rideId: ride._id,
      userId: participantId,
      status: "confirmed",
    });
  });

  describe("POST /api/mototribe/rides/:id/expenses", () => {
    test("Organizer can create an expense entry successfully", async () => {
      const res = await request(app)
        .post(`/api/mototribe/rides/${rideId}/expenses`)
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          category: "fuel",
          amount: 1500,
          note: "Petrol refill at Shell",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.expense.category).toBe("fuel");
      expect(res.body.data.expense.amount).toBe(1500);
      expect(res.body.data.expense.note).toBe("Petrol refill at Shell");
      expect(res.body.data.expense.userId).toBe(organizerId.toString());
    });

    test("Confirmed participant can create an expense entry successfully", async () => {
      const res = await request(app)
        .post(`/api/mototribe/rides/${rideId}/expenses`)
        .set("Authorization", `Bearer ${participantToken}`)
        .send({
          category: "food",
          amount: 800,
          note: "Highway lunch for team",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.expense.category).toBe("food");
      expect(res.body.data.expense.amount).toBe(800);
    });

    test("Non-participant (outsider) is rejected with 403 Forbidden", async () => {
      const res = await request(app)
        .post(`/api/mototribe/rides/${rideId}/expenses`)
        .set("Authorization", `Bearer ${outsiderToken}`)
        .send({
          category: "toll",
          amount: 200,
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/must be an organizer or confirmed participant/i);
    });

    test("Rejects invalid category or negative amount with 400 validation error", async () => {
      const res = await request(app)
        .post(`/api/mototribe/rides/${rideId}/expenses`)
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          category: "invalid_category",
          amount: -50,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Validation failed/i);
    });
  });

  describe("GET /api/mototribe/rides/:id/expenses", () => {
    test("Returns all ride expenses sorted most recent first", async () => {
      await RideExpense.create({
        rideId,
        userId: organizerId,
        category: "fuel",
        amount: 1000,
        createdAt: new Date(Date.now() - 10000),
      });

      await RideExpense.create({
        rideId,
        userId: participantId,
        category: "accommodation",
        amount: 2500,
        createdAt: new Date(),
      });

      const res = await request(app)
        .get(`/api/mototribe/rides/${rideId}/expenses`)
        .set("Authorization", `Bearer ${participantToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.expenses.length).toBe(2);
      expect(res.body.data.expenses[0].category).toBe("accommodation");
      expect(res.body.data.expenses[0].userId.name).toBe("Confirmed Participant");
    });

    test("Non-participant is rejected with 403 Forbidden", async () => {
      const res = await request(app)
        .get(`/api/mototribe/rides/${rideId}/expenses`)
        .set("Authorization", `Bearer ${outsiderToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe("GET /api/mototribe/rides/:id/expenses/summary & Budget Comparison Math", () => {
    test("Calculates correct category breakdown, user breakdown, and under-budget comparison", async () => {
      // Organizer spends: 1500 (fuel) + 500 (toll) = 2000
      await RideExpense.create({
        rideId,
        userId: organizerId,
        category: "fuel",
        amount: 1500,
      });
      await RideExpense.create({
        rideId,
        userId: organizerId,
        category: "toll",
        amount: 500,
      });

      // Participant spends: 1000 (food) = 1000
      await RideExpense.create({
        rideId,
        userId: participantId,
        category: "food",
        amount: 1000,
      });

      // Total spent = 3000, Budget = 5000
      const res = await request(app)
        .get(`/api/mototribe/rides/${rideId}/expenses/summary`)
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(res.statusCode).toBe(200);
      const summary = res.body.data.summary;

      expect(summary.totalSpent).toBe(3000);
      expect(summary.categoryBreakdown.fuel).toBe(1500);
      expect(summary.categoryBreakdown.toll).toBe(500);
      expect(summary.categoryBreakdown.food).toBe(1000);
      expect(summary.categoryBreakdown.accommodation).toBe(0);

      // User breakdown checks
      expect(summary.userBreakdown.length).toBe(2);
      const orgUser = summary.userBreakdown.find((u) => u.userId === organizerId.toString());
      expect(orgUser.totalSpent).toBe(2000);
      const partUser = summary.userBreakdown.find((u) => u.userId === participantId.toString());
      expect(partUser.totalSpent).toBe(1000);

      // Budget comparison checks (Under budget)
      expect(summary.budgetComparison.budget).toBe(5000);
      expect(summary.budgetComparison.totalSpent).toBe(3000);
      expect(summary.budgetComparison.difference).toBe(2000);
      expect(summary.budgetComparison.isOverBudget).toBe(false);
    });

    test("Calculates correct over-budget comparison when total spent exceeds ride budget", async () => {
      // Spend 6000 total on budget of 5000
      await RideExpense.create({
        rideId,
        userId: organizerId,
        category: "accommodation",
        amount: 6000,
      });

      const res = await request(app)
        .get(`/api/mototribe/rides/${rideId}/expenses/summary`)
        .set("Authorization", `Bearer ${participantToken}`);

      expect(res.statusCode).toBe(200);
      const summary = res.body.data.summary;

      expect(summary.budgetComparison.budget).toBe(5000);
      expect(summary.budgetComparison.totalSpent).toBe(6000);
      expect(summary.budgetComparison.difference).toBe(-1000);
      expect(summary.budgetComparison.isOverBudget).toBe(true);
    });
  });

  describe("PATCH /api/mototribe/rides/:id/expenses/:expenseId", () => {
    let organizerExpenseId;

    beforeEach(async () => {
      const exp = await RideExpense.create({
        rideId,
        userId: organizerId,
        category: "food",
        amount: 500,
        note: "Initial breakfast",
      });
      organizerExpenseId = exp._id.toString();
    });

    test("Owner can update their own expense entry", async () => {
      const res = await request(app)
        .patch(`/api/mototribe/rides/${rideId}/expenses/${organizerExpenseId}`)
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({
          amount: 750,
          note: "Breakfast + Coffee",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.expense.amount).toBe(750);
      expect(res.body.data.expense.note).toBe("Breakfast + Coffee");

      const expInDb = await RideExpense.findById(organizerExpenseId);
      expect(expInDb.amount).toBe(750);
    });

    test("Non-owner (confirmed participant) attempting to edit organizer's expense is rejected with 403 Forbidden", async () => {
      const res = await request(app)
        .patch(`/api/mototribe/rides/${rideId}/expenses/${organizerExpenseId}`)
        .set("Authorization", `Bearer ${participantToken}`)
        .send({
          amount: 9999,
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/only edit your own expense entries/i);
    });
  });

  describe("DELETE /api/mototribe/rides/:id/expenses/:expenseId", () => {
    let organizerExpenseId;

    beforeEach(async () => {
      const exp = await RideExpense.create({
        rideId,
        userId: organizerId,
        category: "maintenance",
        amount: 1200,
        note: "Puncture repair",
      });
      organizerExpenseId = exp._id.toString();
    });

    test("Non-owner attempting to delete organizer's expense is rejected with 403 Forbidden", async () => {
      const res = await request(app)
        .delete(`/api/mototribe/rides/${rideId}/expenses/${organizerExpenseId}`)
        .set("Authorization", `Bearer ${participantToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/only delete your own expense entries/i);

      // Verify entry still exists in DB
      const expInDb = await RideExpense.findById(organizerExpenseId);
      expect(expInDb).not.toBeNull();
    });

    test("Owner can delete their own expense entry", async () => {
      const res = await request(app)
        .delete(`/api/mototribe/rides/${rideId}/expenses/${organizerExpenseId}`)
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/Expense entry deleted successfully/i);

      const expInDb = await RideExpense.findById(organizerExpenseId);
      expect(expInDb).toBeNull();
    });
  });
});
