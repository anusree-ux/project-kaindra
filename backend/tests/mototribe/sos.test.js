const request = require("supertest");
const app = require("../../src/app");
const SosAlert = require("../../src/models/mototribe/SosAlert");

describe("MotoTribe SOS Emergency Alerts API", () => {
  let organizerToken;
  let organizerId;
  let participantToken;
  let participantId;
  let ongoingRideId;

  beforeEach(async () => {
    const orgRes = await request(app).post("/api/v1/auth/signup").send({
      name: "SOS Organizer",
      email: "sos.org@example.com",
      password: "password123",
    });
    organizerToken = orgRes.body.accessToken;
    organizerId = orgRes.body.data.user._id;

    await request(app)
      .post("/api/mototribe/rider-profile")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ vehicleNumber: "KA03AA1111", emergencyContactNumber: "9876543210" });

    const partRes = await request(app).post("/api/v1/auth/signup").send({
      name: "SOS Participant",
      email: "sos.part@example.com",
      password: "password123",
    });
    participantToken = partRes.body.accessToken;
    participantId = partRes.body.data.user._id;

    await request(app)
      .post("/api/mototribe/rider-profile")
      .set("Authorization", `Bearer ${participantToken}`)
      .send({ vehicleNumber: "KA03BB2222", emergencyContactNumber: "9123456789" });

    // Create & start ride
    const rideRes = await request(app)
      .post("/api/mototribe/rides")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({
        title: "SOS Highway Tour",
        origin: "Bangalore",
        destination: "Ooty",
        startDate: new Date(Date.now() + 86400000).toISOString(),
        distanceKm: 270,
      });
    ongoingRideId = rideRes.body.data.ride._id;

    // Join and confirm participant
    await request(app)
      .post(`/api/mototribe/rides/${ongoingRideId}/join`)
      .set("Authorization", `Bearer ${participantToken}`);

    await request(app)
      .patch(`/api/mototribe/rides/${ongoingRideId}/participants/${participantId}/confirm`)
      .set("Authorization", `Bearer ${organizerToken}`);

    // Start ride to ongoing
    await request(app)
      .patch(`/api/mototribe/rides/${ongoingRideId}/start`)
      .set("Authorization", `Bearer ${organizerToken}`);
  });

  test("Triggering SOS on an ongoing ride as a confirmed participant creates an SosAlert", async () => {
    const res = await request(app)
      .post(`/api/mototribe/rides/${ongoingRideId}/sos`)
      .set("Authorization", `Bearer ${participantToken}`)
      .send({ latitude: 12.9716, longitude: 77.5946 });

    expect(res.statusCode).toEqual(201);
    expect(res.body.data.alert.status).toBe("active");
    expect(res.body.data.alert.latitude).toBe(12.9716);

    const alertInDb = await SosAlert.findOne({
      rideId: ongoingRideId,
      userId: participantId,
    });

    expect(alertInDb).not.toBeNull();
    expect(alertInDb.status).toBe("active");
  });

  test("Triggering SOS again while one is already active returns the existing alert", async () => {
    const firstRes = await request(app)
      .post(`/api/mototribe/rides/${ongoingRideId}/sos`)
      .set("Authorization", `Bearer ${participantToken}`)
      .send({ latitude: 12.9716, longitude: 77.5946 });

    const firstAlertId = firstRes.body.data.alert._id;

    const secondRes = await request(app)
      .post(`/api/mototribe/rides/${ongoingRideId}/sos`)
      .set("Authorization", `Bearer ${participantToken}`)
      .send({ latitude: 12.9716, longitude: 77.5946 });

    expect(secondRes.statusCode).toEqual(200);
    expect(secondRes.body.data.alert._id).toBe(firstAlertId);

    const count = await SosAlert.countDocuments({
      rideId: ongoingRideId,
      userId: participantId,
    });

    expect(count).toBe(1);
  });

  test("Resolving an SOS alert as a non-organizer/non-creator is rejected (403)", async () => {
    const triggerRes = await request(app)
      .post(`/api/mototribe/rides/${ongoingRideId}/sos`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ latitude: 12.9716, longitude: 77.5946 });

    const alertId = triggerRes.body.data.alert._id;

    // Participant attempting to resolve organizer's alert
    const res = await request(app)
      .patch(`/api/mototribe/rides/${ongoingRideId}/sos/${alertId}/resolve`)
      .set("Authorization", `Bearer ${participantToken}`);

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toMatch(/only the ride organizer or the rider/i);
  });
});
