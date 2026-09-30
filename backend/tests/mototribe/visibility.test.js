const request = require("supertest");
const app = require("../../src/app");
const Ride = require("../../src/models/mototribe/Ride");
const RideParticipant = require("../../src/models/mototribe/RideParticipant");
const ConnectionRequest = require("../../src/models/core/ConnectionRequest");
const RideJournal = require("../../src/models/mototribe/RideJournal");
const { createTestUser } = require("../helpers/testUser");

describe("MotoTribe Ride Journal Privacy & Visibility Levels API", () => {
  let user1Token, user1Id, user1VehicleId;
  let user2Token, user2Id;
  let strangerToken, strangerId;
  let rideId;

  beforeEach(async () => {
    // 1. User 1 (Ride Organizer & Journal Owner)
    const u1 = await createTestUser({ name: "Journal Owner" });
    user1Token = u1.token;
    user1Id = u1.userId;
    user1VehicleId = u1.vehicleId;

    // 2. User 2 (Connected Participant)
    const u2 = await createTestUser({ name: "Connected Participant" });
    user2Token = u2.token;
    user2Id = u2.userId;

    // 3. Stranger (Unconnected Outsider)
    const st = await createTestUser({ name: "Stranger Rider" });
    strangerToken = st.token;
    strangerId = st.userId;

    // Create ride organized by user1
    const ride = await Ride.create({
      organizerId: user1Id,
      vehicleId: user1VehicleId,
      title: "Coastal Explorer Tour",
      origin: "Bangalore",
      destination: "Gokarna",
      startDate: new Date(Date.now() + 86400000),
      distanceKm: 480,
      status: "planning",
    });
    rideId = ride._id.toString();

    // Confirm user2 as ride participant
    await RideParticipant.create({
      rideId: ride._id,
      userId: user2Id,
      status: "confirmed",
    });

    // Accept connection request between user1 and user2
    await ConnectionRequest.create({
      fromUserId: user1Id,
      toUserId: user2Id,
      status: "accepted",
      respondedAt: new Date(),
    });
  });

  describe("Visibility level filtering in GET /api/mototribe/rides/:id/journal", () => {
    test("'private' entries are ONLY visible to the entry owner", async () => {
      // Owner (user1) creates private journal entry
      await RideJournal.create({
        rideId,
        userId: user1Id,
        note: "Owner's private secret note",
        visibility: "private",
      });

      // Owner fetches journals -> sees entry
      const ownerRes = await request(app)
        .get(`/api/mototribe/rides/${rideId}/journal`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(ownerRes.statusCode).toBe(200);
      expect(ownerRes.body.data.journals.length).toBe(1);
      expect(ownerRes.body.data.journals[0].note).toBe("Owner's private secret note");

      // Participant (user2) fetches journals -> entry is filtered out
      const partRes = await request(app)
        .get(`/api/mototribe/rides/${rideId}/journal`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(partRes.statusCode).toBe(200);
      expect(partRes.body.data.journals.length).toBe(0);
    });

    test("'connections'-level entries are visible to accepted connections, hidden from strangers", async () => {
      // Owner (user1) creates connections-level journal entry
      await RideJournal.create({
        rideId,
        userId: user1Id,
        note: "Shared with my connected buddies",
        visibility: "connections",
      });

      // User2 (accepted connection) fetches journals -> sees entry
      const connRes = await request(app)
        .get(`/api/mototribe/rides/${rideId}/journal`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(connRes.statusCode).toBe(200);
      expect(connRes.body.data.journals.length).toBe(1);
      expect(connRes.body.data.journals[0].note).toBe("Shared with my connected buddies");

      // Stranger creates a confirmed ride participant entry for themselves on the ride
      await RideParticipant.create({
        rideId,
        userId: strangerId,
        status: "confirmed",
      });

      // Stranger (confirmed participant, but NOT an accepted connection) fetches -> filtered out
      const strangerRes = await request(app)
        .get(`/api/mototribe/rides/${rideId}/journal`)
        .set("Authorization", `Bearer ${strangerToken}`);

      expect(strangerRes.statusCode).toBe(200);
      expect(strangerRes.body.data.journals.length).toBe(0);
    });

    test("'ride_group'-level entries are visible to confirmed ride participants, hidden from outsiders", async () => {
      // Owner (user1) creates ride_group-level journal entry
      await RideJournal.create({
        rideId,
        userId: user1Id,
        note: "Notes for the ride group",
        visibility: "ride_group",
      });

      // User2 (confirmed ride participant) fetches -> sees entry
      const partRes = await request(app)
        .get(`/api/mototribe/rides/${rideId}/journal`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(partRes.statusCode).toBe(200);
      expect(partRes.body.data.journals.length).toBe(1);

      // Stranger (unconfirmed / non-participant) attempting to fetch -> 403 Forbidden on the ride endpoint
      const strangerRes = await request(app)
        .get(`/api/mototribe/rides/${rideId}/journal`)
        .set("Authorization", `Bearer ${strangerToken}`);

      expect(strangerRes.statusCode).toBe(403);
    });

    test("'community'-level entries are visible to any authenticated user", async () => {
      // Owner (user1) creates community-level journal entry
      await RideJournal.create({
        rideId,
        userId: user1Id,
        note: "Public community travelogue",
        visibility: "community",
      });

      // Participant fetches -> sees entry
      const res1 = await request(app)
        .get(`/api/mototribe/rides/${rideId}/journal`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res1.statusCode).toBe(200);
      expect(res1.body.data.journals.length).toBe(1);
    });
    test("Organizer can view 'ride_group'-level entries created by participants on their ride", async () => {
      // User2 (confirmed participant) creates a ride_group entry
      await RideJournal.create({
        rideId,
        userId: user2Id,
        note: "Participant's group note",
        visibility: "ride_group",
      });

      // User1 (organizer) fetches journals for the ride -> sees participant's entry
      const orgRes = await request(app)
        .get(`/api/mototribe/rides/${rideId}/journal`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(orgRes.statusCode).toBe(200);
      expect(orgRes.body.data.journals.length).toBe(1);
      expect(orgRes.body.data.journals[0].note).toBe("Participant's group note");
    });
  });

  describe("GET /api/mototribe/journal/community (Public Explore Feed)", () => {
    beforeEach(async () => {
      const r2 = await Ride.create({
        organizerId: user1Id,
        vehicleId: user1VehicleId,
        title: "Ride 2",
        origin: "Bangalore",
        destination: "Goa",
        startDate: new Date(),
        distanceKm: 500,
      });

      const r3 = await Ride.create({
        organizerId: user1Id,
        vehicleId: user1VehicleId,
        title: "Ride 3",
        origin: "Bangalore",
        destination: "Mysore",
        startDate: new Date(),
        distanceKm: 150,
      });

      // 1. Private entry on rideId
      await RideJournal.create({
        rideId,
        userId: user1Id,
        note: "Private note",
        visibility: "private",
      });

      // 2. Connections entry on r2
      await RideJournal.create({
        rideId: r2._id,
        userId: user1Id,
        note: "Connections note",
        visibility: "connections",
      });

      // 3. Community entry on r3 by user1
      await RideJournal.create({
        rideId: r3._id,
        userId: user1Id,
        note: "Public community story 1",
        visibility: "community",
      });

      // 4. Community entry on rideId by user2
      await RideJournal.create({
        rideId,
        userId: user2Id,
        note: "Public community story 2",
        visibility: "community",
      });
    });

    test("Returns ONLY community-visibility entries across all rides for any authenticated user", async () => {
      const res = await request(app)
        .get("/api/mototribe/journal/community")
        .set("Authorization", `Bearer ${strangerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.journals.length).toBe(2);

      const notes = res.body.data.journals.map((j) => j.note);
      expect(notes).toContain("Public community story 1");
      expect(notes).toContain("Public community story 2");
      expect(notes).not.toContain("Private note");
      expect(notes).not.toContain("Connections note");
    });

    test("Community explore feed populates only user name without leaking email", async () => {
      const res = await request(app)
        .get("/api/mototribe/journal/community")
        .set("Authorization", `Bearer ${strangerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.journals[0].userId.name).toBeDefined();
      expect(res.body.data.journals[0].userId.email).toBeUndefined();
    });
  });
});
