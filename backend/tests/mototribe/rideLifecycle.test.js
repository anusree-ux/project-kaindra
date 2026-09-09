const request = require("supertest");
const app = require("../../src/app");
const RiderProfile = require("../../src/models/mototribe/RiderProfile");
const RideParticipant = require("../../src/models/mototribe/RideParticipant");

describe("MotoTribe Ride Lifecycle API", () => {
  let organizerToken;
  let organizerId;
  let riderToken;
  let riderId;

  beforeEach(async () => {
    // Signup organizer
    const orgRes = await request(app).post("/api/v1/auth/signup").send({
      name: "Organizer Rider",
      email: "organizer@example.com",
      password: "password123",
    });
    organizerToken = orgRes.body.accessToken;
    organizerId = orgRes.body.data.user._id;

    // Create RiderProfile for organizer
    await request(app)
      .post("/api/mototribe/rider-profile")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ vehicleNumber: "KA01AB1234", bikeModel: "Duke 390" });

    // Signup rider
    const riderRes = await request(app).post("/api/v1/auth/signup").send({
      name: "Participant Rider",
      email: "participant@example.com",
      password: "password123",
    });
    riderToken = riderRes.body.accessToken;
    riderId = riderRes.body.data.user._id;

    // Create RiderProfile for participant
    await request(app)
      .post("/api/mototribe/rider-profile")
      .set("Authorization", `Bearer ${riderToken}`)
      .send({ vehicleNumber: "KA02CD5678", bikeModel: "Himalayan 450" });
  });

  test("Creating a ride succeeds and increments organizer's routesContributed", async () => {
    const res = await request(app)
      .post("/api/mototribe/rides")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({
        title: "Bangalore to Coorg Weekend Ride",
        origin: "Bangalore",
        destination: "Coorg",
        startDate: new Date(Date.now() + 86400000).toISOString(),
        distanceKm: 250,
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.data.ride.title).toBe("Bangalore to Coorg Weekend Ride");

    const profile = await RiderProfile.findOne({ userId: organizerId });
    expect(profile.routesContributed).toBe(1);
  });

  test("Joining a ride creates a RideParticipant with status 'planning'", async () => {
    const rideRes = await request(app)
      .post("/api/mototribe/rides")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({
        title: "Coastal Ride",
        origin: "Mangalore",
        destination: "Udupi",
        startDate: new Date(Date.now() + 86400000).toISOString(),
        distanceKm: 60,
      });

    const rideId = rideRes.body.data.ride._id;

    const joinRes = await request(app)
      .post(`/api/mototribe/rides/${rideId}/join`)
      .set("Authorization", `Bearer ${riderToken}`);

    expect(joinRes.statusCode).toEqual(201);
    expect(joinRes.body.data.participant.status).toBe("planning");

    const participant = await RideParticipant.findOne({ rideId, userId: riderId });
    expect(participant).not.toBeNull();
    expect(participant.status).toBe("planning");
  });

  test("Confirming a participant increments their rideGroupsJoined", async () => {
    const rideRes = await request(app)
      .post("/api/mototribe/rides")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({
        title: "Wayanad Escape",
        origin: "Mysore",
        destination: "Wayanad",
        startDate: new Date(Date.now() + 86400000).toISOString(),
        distanceKm: 120,
      });
    const rideId = rideRes.body.data.ride._id;

    await request(app)
      .post(`/api/mototribe/rides/${rideId}/join`)
      .set("Authorization", `Bearer ${riderToken}`);

    const confirmRes = await request(app)
      .patch(`/api/mototribe/rides/${rideId}/participants/${riderId}/confirm`)
      .set("Authorization", `Bearer ${organizerToken}`);

    expect(confirmRes.statusCode).toEqual(200);

    const profile = await RiderProfile.findOne({ userId: riderId });
    expect(profile.rideGroupsJoined).toBe(1);
  });

  test("Completing a ride increments totalRidesCompleted, totalDistanceKm, and regionsExplored", async () => {
    const rideRes = await request(app)
      .post("/api/mototribe/rides")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({
        title: "Goa Highway Run",
        origin: "Bangalore",
        destination: "Goa",
        startDate: new Date(Date.now() + 86400000).toISOString(),
        distanceKm: 560,
      });
    const rideId = rideRes.body.data.ride._id;

    await request(app)
      .post(`/api/mototribe/rides/${rideId}/join`)
      .set("Authorization", `Bearer ${riderToken}`);

    await request(app)
      .patch(`/api/mototribe/rides/${rideId}/participants/${riderId}/confirm`)
      .set("Authorization", `Bearer ${organizerToken}`);

    await request(app)
      .patch(`/api/mototribe/rides/${rideId}/start`)
      .set("Authorization", `Bearer ${organizerToken}`);

    const completeRes = await request(app)
      .patch(`/api/mototribe/rides/${rideId}/complete`)
      .set("Authorization", `Bearer ${organizerToken}`);

    expect(completeRes.statusCode).toEqual(200);

    const riderProfile = await RiderProfile.findOne({ userId: riderId });
    expect(riderProfile.totalRidesCompleted).toBe(1);
    expect(riderProfile.totalDistanceKm).toBe(560);
    expect(riderProfile.regionsExplored).toContain("Goa");
  });

  test("Completing a ride that is still in 'planning' status is rejected (400)", async () => {
    const rideRes = await request(app)
      .post("/api/mototribe/rides")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({
        title: "Test Planning Ride",
        origin: "City A",
        destination: "City B",
        startDate: new Date(Date.now() + 86400000).toISOString(),
        distanceKm: 100,
      });
    const rideId = rideRes.body.data.ride._id;

    const res = await request(app)
      .patch(`/api/mototribe/rides/${rideId}/complete`)
      .set("Authorization", `Bearer ${organizerToken}`);

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/expected 'ongoing'/i);
  });

  test("A non-organizer attempting to complete a ride is rejected (403)", async () => {
    const rideRes = await request(app)
      .post("/api/mototribe/rides")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({
        title: "Unauthorized Completion Test",
        origin: "City A",
        destination: "City B",
        startDate: new Date(Date.now() + 86400000).toISOString(),
        distanceKm: 100,
      });
    const rideId = rideRes.body.data.ride._id;

    await request(app)
      .patch(`/api/mototribe/rides/${rideId}/start`)
      .set("Authorization", `Bearer ${organizerToken}`);

    const res = await request(app)
      .patch(`/api/mototribe/rides/${rideId}/complete`)
      .set("Authorization", `Bearer ${riderToken}`);

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toMatch(/only the organizer/i);
  });
});
