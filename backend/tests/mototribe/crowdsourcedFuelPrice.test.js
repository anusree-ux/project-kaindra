const request = require("supertest");
const app = require("../../src/app");
const FuelPriceSubmission = require("../../src/models/mototribe/FuelPriceSubmission");
const Ride = require("../../src/models/mototribe/Ride");
const RideParticipant = require("../../src/models/mototribe/RideParticipant");

describe("MotoTribe Crowdsourced Fuel Price Tracking API", () => {
  let organizerToken;
  let participantToken;
  let nonMemberToken;
  let ride;

  beforeEach(async () => {
    // Clean fuel submissions
    await FuelPriceSubmission.deleteMany({});

    // 1. Create Organizer User & Ride
    const orgRes = await request(app).post("/api/v1/auth/signup").send({
      name: "Ride Organizer",
      email: "org.crowdfuel@example.com",
      password: "Password123!",
    });
    organizerToken = orgRes.body.accessToken;
    const organizerId = orgRes.body.data.user._id;

    ride = await Ride.create({
      organizerId,
      title: "Western Ghats Tour",
      origin: "Mumbai",
      destination: "Goa",
      startDate: new Date(Date.now() + 86400000),
      distanceKm: 600,
    });

    // 2. Create Participant User & confirm participation
    const partRes = await request(app).post("/api/v1/auth/signup").send({
      name: "Confirmed Participant",
      email: "part.crowdfuel@example.com",
      password: "Password123!",
    });
    participantToken = partRes.body.accessToken;
    const participantId = partRes.body.data.user._id;

    await RideParticipant.create({
      rideId: ride._id,
      userId: participantId,
      status: "confirmed",
    });

    // 3. Create Non-member User
    const nonRes = await request(app).post("/api/v1/auth/signup").send({
      name: "Outsider User",
      email: "outsider.crowdfuel@example.com",
      password: "Password123!",
    });
    nonMemberToken = nonRes.body.accessToken;
  });

  describe("POST /api/mototribe/fuel-prices (Crowdsourced Submission & Outlier Rejection)", () => {
    test("Bootstrap case (<3 submissions): accepts first 2 submissions unconditionally", async () => {
      const res1 = await request(app)
        .post("/api/mototribe/fuel-prices")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({ state: "Maharashtra", fuelType: "petrol", pricePerLiter: 100 });

      expect(res1.statusCode).toBe(201);
      expect(res1.body.status).toBe("success");
      expect(res1.body.data.updatedMedian).toBe(100);
      expect(res1.body.data.count).toBe(1);

      const res2 = await request(app)
        .post("/api/mototribe/fuel-prices")
        .set("Authorization", `Bearer ${participantToken}`)
        .send({ state: "Maharashtra", fuelType: "petrol", pricePerLiter: 110 });

      expect(res2.statusCode).toBe(201);
      // Median of [100, 110] = 105
      expect(res2.body.data.updatedMedian).toBe(105);
      expect(res2.body.data.count).toBe(2);
    });

    test("Rejects submissions that deviate by more than 20% once >= 3 submissions exist", async () => {
      // Create 3 initial submissions (bootstrap phase)
      await FuelPriceSubmission.create([
        { userId: ride.organizerId, state: "Maharashtra", fuelType: "petrol", pricePerLiter: 100 },
        { userId: ride.organizerId, state: "Maharashtra", fuelType: "petrol", pricePerLiter: 104 },
        { userId: ride.organizerId, state: "Maharashtra", fuelType: "petrol", pricePerLiter: 108 },
      ]);
      // Current median of [100, 104, 108] is 104. 20% of 104 is 20.8 -> Valid range [83.2, 124.8]

      // 1. Submit price 135 (> 20% deviation from 104)
      const rejectedRes = await request(app)
        .post("/api/mototribe/fuel-prices")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({ state: "Maharashtra", fuelType: "petrol", pricePerLiter: 135 });

      expect(rejectedRes.statusCode).toBe(400);
      expect(rejectedRes.body.message).toMatch(/deviates more than 20%/i);

      // 2. Submit price 106 (within 20% deviation)
      const validRes = await request(app)
        .post("/api/mototribe/fuel-prices")
        .set("Authorization", `Bearer ${organizerToken}`)
        .send({ state: "Maharashtra", fuelType: "petrol", pricePerLiter: 106 });

      expect(validRes.statusCode).toBe(201);
      expect(validRes.body.data.count).toBe(4);
    });
  });

  describe("GET /api/mototribe/fuel-prices (Current Median & Fallback)", () => {
    test("Returns community median when submissions exist in the last 7 days", async () => {
      await FuelPriceSubmission.create([
        { userId: ride.organizerId, state: "Karnataka", fuelType: "diesel", pricePerLiter: 94 },
        { userId: ride.organizerId, state: "Karnataka", fuelType: "diesel", pricePerLiter: 96 },
        { userId: ride.organizerId, state: "Karnataka", fuelType: "diesel", pricePerLiter: 98 },
      ]);

      const res = await request(app)
        .get("/api/mototribe/fuel-prices?state=Karnataka&fuelType=diesel")
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.median).toBe(96);
      expect(res.body.data.count).toBe(3);
      expect(res.body.data.isFallback).toBe(false);
    });

    test("Returns national default fallback when no submissions exist for state", async () => {
      const res = await request(app)
        .get("/api/mototribe/fuel-prices?state=Goa&fuelType=petrol")
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.median).toBe(105); // National default petrol fallback
      expect(res.body.data.count).toBe(0);
      expect(res.body.data.isFallback).toBe(true);
      expect(res.body.data.note).toMatch(/national default fallback/i);
    });
  });

  describe("GET /api/mototribe/rides/:id/fuel-estimate", () => {
    test("Organizer / Confirmed participant can retrieve fuel estimate", async () => {
      // Seed submission for Gujarat petrol = 100
      await FuelPriceSubmission.create({
        userId: ride.organizerId,
        state: "Gujarat",
        fuelType: "petrol",
        pricePerLiter: 100,
      });

      // Distance = 600km, default mileage = 40 km/L -> 15L required -> 15 * 100 = 1500 INR
      const res = await request(app)
        .get(`/api/mototribe/rides/${ride._id}/fuel-estimate?state=Gujarat&mileage=40&fuelType=petrol`)
        .set("Authorization", `Bearer ${participantToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.fuelRequired).toBe(15);
      expect(res.body.data.estimatedFuelCost).toBe(1500);
      expect(res.body.data.isFallback).toBe(false);
    });

    test("Non-participant request is rejected with 403 Forbidden", async () => {
      const res = await request(app)
        .get(`/api/mototribe/rides/${ride._id}/fuel-estimate`)
        .set("Authorization", `Bearer ${nonMemberToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/must be an organizer or confirmed participant/i);
    });
  });
});
