const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../src/app");
const Ride = require("../../src/models/mototribe/Ride");
const RideParticipant = require("../../src/models/mototribe/RideParticipant");

describe("MotoTribe Agora Group Voice/Video Calling Token API", () => {
  let organizerToken;
  let participantToken;
  let nonMemberToken;
  let ride;

  beforeEach(async () => {
    process.env.AGORA_APP_ID = "970cf4205578458d64701f66c4e3b430";
    process.env.AGORA_APP_CERTIFICATE = "5cfd2daf35d24e1aab060f6513e444b9";

    // 1. Create Organizer User
    const orgRes = await request(app).post("/api/v1/auth/signup").send({
      name: "Ride Organizer",
      email: "organizer.agora@example.com",
      password: "Password123!",
    });
    organizerToken = orgRes.body.accessToken;
    const organizerId = orgRes.body.data.user._id;

    // 2. Create Ride
    ride = await Ride.create({
      organizerId,
      title: "Himalayan Group Ride",
      origin: "Delhi",
      destination: "Manali",
      startDate: new Date(Date.now() + 86400000),
      distanceKm: 540,
    });

    // 3. Create Participant User and join ride
    const partRes = await request(app).post("/api/v1/auth/signup").send({
      name: "Confirmed Rider",
      email: "participant.agora@example.com",
      password: "Password123!",
    });
    participantToken = partRes.body.accessToken;
    const participantId = partRes.body.data.user._id;

    await RideParticipant.create({
      rideId: ride._id,
      userId: participantId,
      status: "confirmed",
    });

    // 4. Create Non-member User
    const nonRes = await request(app).post("/api/v1/auth/signup").send({
      name: "Outsider Rider",
      email: "outsider.agora@example.com",
      password: "Password123!",
    });
    nonMemberToken = nonRes.body.accessToken;
  });

  test("1 & 5: Authenticated ride member / organizer receives a valid Agora RTC token", async () => {
    const res = await request(app)
      .post("/api/mototribe/agora/token")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ rideId: ride._id.toString() });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.token).toBeDefined();
    expect(typeof res.body.data.token).toBe("string");
    expect(res.body.data.token.length).toBeGreaterThan(20);
    expect(res.body.data.appId).toBeDefined();
  });

  test("2: Unauthenticated request is rejected with 401 Unauthorized", async () => {
    const res = await request(app)
      .post("/api/mototribe/agora/token")
      .send({ rideId: ride._id.toString() });

    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe("fail");
  });

  test("3: Invalid ride ID format returns 400 Bad Request", async () => {
    const res = await request(app)
      .post("/api/mototribe/agora/token")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ rideId: "invalid-id-format" });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Invalid ride ID format/i);
  });

  test("4: User not belonging to ride/group is rejected with 403 Forbidden", async () => {
    const res = await request(app)
      .post("/api/mototribe/agora/token")
      .set("Authorization", `Bearer ${nonMemberToken}`)
      .send({ rideId: ride._id.toString() });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/must be an organizer or confirmed participant/i);
  });

  test("5: Confirmed participant can successfully request token via URL parameter endpoint", async () => {
    const res = await request(app)
      .post(`/api/mototribe/rides/${ride._id}/agora-token`)
      .set("Authorization", `Bearer ${participantToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  test("6: Channel name is correctly generated as ride-{rideId}", async () => {
    const res = await request(app)
      .post("/api/mototribe/agora/token")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ rideId: ride._id.toString() });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.channelName).toBe(`ride-${ride._id}`);
  });

  test("7: Correct numeric UID is returned or used", async () => {
    const res = await request(app)
      .post("/api/mototribe/agora/token")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ rideId: ride._id.toString(), uid: 998877 });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.uid).toBe(998877);
  });

  test("8: Token expiration fields are calculated and returned correctly", async () => {
    const res = await request(app)
      .post("/api/mototribe/agora/token")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ rideId: ride._id.toString(), expireSeconds: 7200 });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.expiresInSeconds).toBe(7200);
    expect(res.body.data.expiresAt).toBeDefined();
    expect(new Date(res.body.data.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  test("9: Missing Agora configuration triggers 500 error", async () => {
    const originalAppId = process.env.AGORA_APP_ID;
    delete process.env.AGORA_APP_ID;

    const res = await request(app)
      .post("/api/mototribe/agora/token")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ rideId: ride._id.toString() });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toMatch(/Agora credentials are not configured/i);

    process.env.AGORA_APP_ID = originalAppId;
  });

  test("10: Invalid request data (missing rideId) returns 400 Bad Request", async () => {
    const res = await request(app)
      .post("/api/mototribe/agora/token")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/rideId is required/i);
  });
});
