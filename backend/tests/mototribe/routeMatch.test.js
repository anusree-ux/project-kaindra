const request = require("supertest");
const app = require("../../src/app");
const Ride = require("../../src/models/mototribe/Ride");
const RideParticipant = require("../../src/models/mototribe/RideParticipant");

describe("MotoTribe Live Riders & Connect API", () => {
  let token1, user1Id;
  let token2, user2Id;
  let token3, user3Id;

  beforeEach(async () => {
    // Register 3 users
    const res1 = await request(app).post("/api/v1/auth/signup").send({
      name: "Rider One",
      email: "rider1@example.com",
      password: "password123",
    });
    token1 = res1.body.accessToken;
    user1Id = res1.body.data.user._id;

    const res2 = await request(app).post("/api/v1/auth/signup").send({
      name: "Rider Two",
      email: "rider2@example.com",
      password: "password123",
    });
    token2 = res2.body.accessToken;
    user2Id = res2.body.data.user._id;

    const res3 = await request(app).post("/api/v1/auth/signup").send({
      name: "Rider Three",
      email: "rider3@example.com",
      password: "password123",
    });
    token3 = res3.body.accessToken;
    user3Id = res3.body.data.user._id;
  });

  describe("GET /api/mototribe/rides/route-stats", () => {
    test("Rejects request with 400 if origin or destination is missing", async () => {
      const res = await request(app)
        .get("/api/mototribe/rides/route-stats?origin=Delhi")
        .set("Authorization", `Bearer ${token1}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Both origin and destination/i);
    });

    test("Calculates correct stats for currentlyRiding, planning, lookingForPartners, and totalUniqueRiders", async () => {
      // 1. Create an ongoing ride for Bangalore -> Goa (user1)
      const ride1 = await Ride.create({
        organizerId: user1Id,
        title: "Ongoing Goa Run",
        origin: "Bangalore",
        destination: "Goa",
        startDate: new Date(),
        distanceKm: 560,
        status: "ongoing",
      });
      await RideParticipant.create({
        rideId: ride1._id,
        userId: user1Id,
        status: "confirmed",
      });

      // 2. Create a planning ride for Bangalore -> Goa with 1 participant (user2) -> looking for partners (<3)
      const ride2 = await Ride.create({
        organizerId: user2Id,
        title: "Planning Goa Solo",
        origin: "Bangalore",
        destination: "Goa",
        startDate: new Date(Date.now() + 86400000),
        distanceKm: 560,
        status: "planning",
      });
      await RideParticipant.create({
        rideId: ride2._id,
        userId: user2Id,
        status: "confirmed",
      });

      // 3. Create a planning ride for Bangalore -> Goa with 3 confirmed participants (user1, user2, user3) -> NOT looking for partners (>=3)
      const ride3 = await Ride.create({
        organizerId: user3Id,
        title: "Planning Goa Group",
        origin: "Bangalore",
        destination: "Goa",
        startDate: new Date(Date.now() + 172800000),
        distanceKm: 560,
        status: "planning",
      });
      await RideParticipant.create({
        rideId: ride3._id,
        userId: user1Id,
        status: "confirmed",
      });
      await RideParticipant.create({
        rideId: ride3._id,
        userId: user2Id,
        status: "confirmed",
      });
      await RideParticipant.create({
        rideId: ride3._id,
        userId: user3Id,
        status: "confirmed",
      });

      // Query stats
      const statsRes = await request(app)
        .get("/api/mototribe/rides/route-stats?origin=bangalore&destination=goa")
        .set("Authorization", `Bearer ${token1}`);

      expect(statsRes.statusCode).toBe(200);
      expect(statsRes.body.data.currentlyRiding).toBe(1);
      expect(statsRes.body.data.planning).toBe(2);
      expect(statsRes.body.data.lookingForPartners).toBe(1);
      expect(statsRes.body.data.totalUniqueRiders).toBe(3);
    });

    test("Verifies exact normalization & regex anchoring: 'Delhi ' matches 'delhi', but 'Delhi' does NOT match 'New Delhi'", async () => {
      // Create ride for "Delhi " -> "Jaipur"
      await Ride.create({
        organizerId: user1Id,
        title: "Delhi Jaipur Express",
        origin: "Delhi ",
        destination: "Jaipur",
        startDate: new Date(Date.now() + 86400000),
        distanceKm: 280,
        status: "planning",
      });

      // Create ride for "New Delhi" -> "Jaipur"
      await Ride.create({
        organizerId: user2Id,
        title: "New Delhi Jaipur Express",
        origin: "New Delhi",
        destination: "Jaipur",
        startDate: new Date(Date.now() + 86400000),
        distanceKm: 280,
        status: "planning",
      });

      // Query "delhi" -> "jaipur" (lowercase, trimmed)
      const res1 = await request(app)
        .get("/api/mototribe/rides/route-stats?origin=delhi&destination=jaipur")
        .set("Authorization", `Bearer ${token1}`);

      expect(res1.statusCode).toBe(200);
      expect(res1.body.data.planning).toBe(1); // Only matches "Delhi " -> "Jaipur", NOT "New Delhi"

      // Query "New Delhi" -> "jaipur"
      const res2 = await request(app)
        .get("/api/mototribe/rides/route-stats?origin=New%20Delhi&destination=jaipur")
        .set("Authorization", `Bearer ${token1}`);

      expect(res2.statusCode).toBe(200);
      expect(res2.body.data.planning).toBe(1); // Only matches "New Delhi" -> "Jaipur"
    });
  });

  describe("GET /api/mototribe/rides/route-matches", () => {
    beforeEach(async () => {
      // Setup rides for Pune -> Mumbai
      const r1 = await Ride.create({
        organizerId: user1Id,
        title: "Pune Expressway Riding",
        origin: "Pune",
        destination: "Mumbai",
        startDate: new Date(Date.now() + 10000),
        distanceKm: 150,
        status: "ongoing",
      });
      await RideParticipant.create({ rideId: r1._id, userId: user1Id, status: "confirmed" });

      const r2 = await Ride.create({
        organizerId: user2Id,
        title: "Solo Planning Pune",
        origin: "Pune",
        destination: "Mumbai",
        startDate: new Date(Date.now() + 200000),
        distanceKm: 150,
        status: "planning",
      });
      await RideParticipant.create({ rideId: r2._id, userId: user2Id, status: "confirmed" });

      const r3 = await Ride.create({
        organizerId: user3Id,
        title: "Full Group Planning",
        origin: "Pune",
        destination: "Mumbai",
        startDate: new Date(Date.now() + 300000),
        distanceKm: 150,
        status: "planning",
      });
      await RideParticipant.create({ rideId: r3._id, userId: user1Id, status: "confirmed" });
      await RideParticipant.create({ rideId: r3._id, userId: user2Id, status: "confirmed" });
      await RideParticipant.create({ rideId: r3._id, userId: user3Id, status: "confirmed" });
    });

    test("Returns all matching rides when no filter is provided", async () => {
      const res = await request(app)
        .get("/api/mototribe/rides/route-matches?origin=pune&destination=mumbai")
        .set("Authorization", `Bearer ${token1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.rides.length).toBe(3);
      expect(res.body.data.pagination.total).toBe(3);
    });

    test("Filters by filter=riding", async () => {
      const res = await request(app)
        .get("/api/mototribe/rides/route-matches?origin=pune&destination=mumbai&filter=riding")
        .set("Authorization", `Bearer ${token1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.rides.length).toBe(1);
      expect(res.body.data.rides[0].status).toBe("ongoing");
    });

    test("Filters by filter=looking_for_partners", async () => {
      const res = await request(app)
        .get("/api/mototribe/rides/route-matches?origin=pune&destination=mumbai&filter=looking_for_partners")
        .set("Authorization", `Bearer ${token1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.rides.length).toBe(1);
      expect(res.body.data.rides[0].title).toBe("Solo Planning Pune");
    });

    test("Paginates results properly with page and limit", async () => {
      const res = await request(app)
        .get("/api/mototribe/rides/route-matches?origin=pune&destination=mumbai&page=1&limit=2")
        .set("Authorization", `Bearer ${token1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.rides.length).toBe(2);
      expect(res.body.data.pagination.total).toBe(3);
      expect(res.body.data.pagination.totalPages).toBe(2);
    });
  });
});
