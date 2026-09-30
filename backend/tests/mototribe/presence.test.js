const request = require("supertest");
const app = require("../../src/app");
const RiderPresence = require("../../src/models/mototribe/RiderPresence");
const RiderProfile = require("../../src/models/mototribe/RiderProfile");
const ConnectionRequest = require("../../src/models/core/ConnectionRequest");
const UserAchievement = require("../../src/models/mototribe/UserAchievement");
const { createTestUser } = require("../helpers/testUser");
const { calculateTrustScore } = require("../../src/services/mototribe/trustScoreService");

describe("MotoTribe Riders Nearby Discovery & Presence API", () => {
  let user1Token, user1Id; // Requester
  let user2Token, user2Id; // Connected friend (community / connections)
  let user3Token, user3Id; // Stranger (private / community / adventure)
  let user4Token, user4Id; // Touring rider

  beforeEach(async () => {
    // 1. Create Requester (User 1)
    const u1 = await createTestUser({ name: "Searcher Rider" });
    user1Token = u1.token;
    user1Id = u1.userId;

    // 2. Create Friend (User 2)
    const u2 = await createTestUser({ name: "Connected Friend" });
    user2Token = u2.token;
    user2Id = u2.userId;

    // Establish accepted connection between User 1 & User 2
    await ConnectionRequest.create({
      fromUserId: user1Id,
      toUserId: user2Id,
      status: "accepted",
      respondedAt: new Date(),
    });

    // 3. Create Stranger (User 3)
    const u3 = await createTestUser({ name: "Stranger Adventure Rider" });
    user3Token = u3.token;
    user3Id = u3.userId;

    // Set RiderProfile preferredRideType for User 3 to "adventure"
    await RiderProfile.create({
      userId: user3Id,
      preferredRideType: "adventure",
      totalRidesCompleted: 8,
      totalDistanceKm: 1500,
    });

    // 4. Create Touring Rider (User 4)
    const u4 = await createTestUser({ name: "Touring Specialist" });
    user4Token = u4.token;
    user4Id = u4.userId;

    await RiderProfile.create({
      userId: user4Id,
      preferredRideType: "touring",
      totalRidesCompleted: 15,
      totalDistanceKm: 4200,
    });
  });

  describe("1. Presence Upsert & Opt-Out Deletion", () => {
    it("should upsert rider presence with location coordinates, status, and visibility", async () => {
      const res = await request(app)
        .post("/api/mototribe/presence")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          latitude: 12.9716,
          longitude: 77.5946,
          status: "riding",
          visibility: "community",
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.presence.status).toBe("riding");
      expect(res.body.data.presence.visibility).toBe("community");
      expect(res.body.data.presence.location.coordinates).toEqual([77.5946, 12.9716]);

      // Re-query MongoDB to verify document
      const presenceDoc = await RiderPresence.findOne({ userId: user1Id });
      expect(presenceDoc).not.toBeNull();
      expect(presenceDoc.status).toBe("riding");
    });

    it("should remove presence when opting out / going offline", async () => {
      // First create presence
      await RiderPresence.create({
        userId: user1Id,
        location: { type: "Point", coordinates: [77.5946, 12.9716] },
        status: "idle",
        visibility: "community",
      });

      // Now delete presence
      const res = await request(app)
        .delete("/api/mototribe/presence")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");

      const presenceDoc = await RiderPresence.findOne({ userId: user1Id });
      expect(presenceDoc).toBeNull();
    });
  });

  describe("2. Trust Score Service Calculation", () => {
    it("should calculate trust score accurately based on weighted metrics", async () => {
      // Setup test user metrics
      // Base: 10
      // 4 completed rides * 5 = 20
      // 1200 km distance / 100 = 12
      // 2 badges * 5 = 10
      // 0 days age = 0
      // Total expected = 10 + 20 + 12 + 10 + 0 = 52

      const testUser = await createTestUser({ name: "Trust Score Tester" });
      await RiderProfile.create({
        userId: testUser.userId,
        totalRidesCompleted: 4,
        totalDistanceKm: 1200,
      });

      await UserAchievement.create({ userId: testUser.userId, badgeKey: "first_ride" });
      await UserAchievement.create({ userId: testUser.userId, badgeKey: "century_rider" });

      const score = await calculateTrustScore(testUser.userId);
      expect(score).toBe(52);
    });
  });

  describe("3. Nearby Query & Visibility Access Control", () => {
    beforeEach(async () => {
      // User 2 (Connected Friend) -> connections visibility, riding
      await RiderPresence.create({
        userId: user2Id,
        location: { type: "Point", coordinates: [77.5950, 12.9720] }, // ~100m away
        status: "riding",
        visibility: "connections",
      });

      // User 3 (Stranger Adventure) -> community visibility, riding
      await RiderPresence.create({
        userId: user3Id,
        location: { type: "Point", coordinates: [77.6000, 12.9750] }, // ~700m away
        status: "riding",
        visibility: "community",
      });

      // User 4 (Touring Rider) -> private visibility, idle
      await RiderPresence.create({
        userId: user4Id,
        location: { type: "Point", coordinates: [77.5940, 12.9710] }, // ~100m away
        status: "idle",
        visibility: "private",
      });
    });

    it("should exclude private users and include community & permitted connection users", async () => {
      const res = await request(app)
        .get("/api/mototribe/riders-nearby?lat=12.9716&lng=77.5946&radius=5000")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      
      const returnedUserIds = res.body.data.riders.map((r) => r.userId.toString());

      // User 2 (Friend, connections) should appear to User 1
      expect(returnedUserIds).toContain(user2Id.toString());
      // User 3 (Stranger, community) should appear to User 1
      expect(returnedUserIds).toContain(user3Id.toString());
      // User 4 (Private) MUST NOT appear even though very close
      expect(returnedUserIds).not.toContain(user4Id.toString());
    });

    it("should hide connections-only users from unconnected strangers", async () => {
      // Query as User 3 (Stranger to User 2)
      const res = await request(app)
        .get("/api/mototribe/riders-nearby?lat=12.9716&lng=77.5946&radius=5000")
        .set("Authorization", `Bearer ${user3Token}`);

      expect(res.status).toBe(200);
      const returnedUserIds = res.body.data.riders.map((r) => r.userId.toString());

      // User 2 (connections visibility) MUST NOT appear to User 3
      expect(returnedUserIds).not.toContain(user2Id.toString());
    });

    it("should filter by riding_now status", async () => {
      // User 3 set to idle
      await RiderPresence.updateOne({ userId: user3Id }, { status: "idle" });

      const res = await request(app)
        .get("/api/mototribe/riders-nearby?lat=12.9716&lng=77.5946&radius=5000&filter=riding_now")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      const returnedUserIds = res.body.data.riders.map((r) => r.userId.toString());

      // Only User 2 is riding_now
      expect(returnedUserIds).toContain(user2Id.toString());
      expect(returnedUserIds).not.toContain(user3Id.toString());
    });

    it("should filter by preferredRideType (adventure / touring)", async () => {
      const res = await request(app)
        .get("/api/mototribe/riders-nearby?lat=12.9716&lng=77.5946&radius=5000&filter=adventure")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      const returnedUserIds = res.body.data.riders.map((r) => r.userId.toString());

      // Only User 3 has preferredRideType === "adventure"
      expect(returnedUserIds).toContain(user3Id.toString());
      expect(returnedUserIds).not.toContain(user2Id.toString());
    });
  });

  describe("4. Rider Profile Card Visibility Permissions", () => {
    beforeEach(async () => {
      // User 3 (Community visibility)
      await RiderPresence.create({
        userId: user3Id,
        location: { type: "Point", coordinates: [77.5946, 12.9716] },
        status: "idle",
        visibility: "community",
      });

      // User 4 (Private visibility)
      await RiderPresence.create({
        userId: user4Id,
        location: { type: "Point", coordinates: [77.5946, 12.9716] },
        status: "idle",
        visibility: "private",
      });
    });

    it("should return public profile card for community-visible rider", async () => {
      const res = await request(app)
        .get(`/api/mototribe/riders/${user3Id}/profile-card`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.profileCard.userId.toString()).toBe(user3Id.toString());
      expect(res.body.data.profileCard.preferredRideType).toBe("adventure");
    });

    it("should reject profile card request with 403 Forbidden for private rider", async () => {
      const res = await request(app)
        .get(`/api/mototribe/riders/${user4Id}/profile-card`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe("fail");
      expect(res.body.message).toMatch(/not permitted to view/i);
    });
  });
});
