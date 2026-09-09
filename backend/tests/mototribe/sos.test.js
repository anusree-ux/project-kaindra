const request = require("supertest");
const app = require("../../src/app");
const SosAlert = require("../../src/models/mototribe/SosAlert");

describe("MotoTribe SOS Emergency Alerts API & Multiple Emergency Contacts", () => {
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
      .send({
        vehicleNumber: "KA03AA1111",
        emergencyContacts: [
          { name: "Mom", phoneNumber: "9876543210", relationship: "Parent" },
          { name: "Spouse", phoneNumber: "9123456789", relationship: "Spouse" },
        ],
      });

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
      .send({
        vehicleNumber: "KA03BB2222",
        emergencyContacts: [
          { name: "Friend", phoneNumber: "9998887776", relationship: "Friend" },
        ],
      });

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

  test("Rejects rider profile with 4 emergency contacts (exceeding max 3 limit) with clean 400 validation error", async () => {
    const res = await request(app)
      .post("/api/mototribe/rider-profile")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({
        vehicleNumber: "KA03AA1111",
        emergencyContacts: [
          { name: "C1", phoneNumber: "9000000001" },
          { name: "C2", phoneNumber: "9000000002" },
          { name: "C3", phoneNumber: "9000000003" },
          { name: "C4", phoneNumber: "9000000004" },
        ],
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Validation failed/i);
    expect(res.body.errors[0].message).toMatch(/at most 3 contacts/i);
  });

  test("Triggering SOS on an ongoing ride records per-contact smsDeliveryStatus for all emergency contacts", async () => {
    const res = await request(app)
      .post(`/api/mototribe/rides/${ongoingRideId}/sos`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ latitude: 12.9716, longitude: 77.5946 });

    expect(res.statusCode).toEqual(201);
    expect(res.body.data.alert.status).toBe("active");
    expect(res.body.data.alert.smsDeliveryStatus.length).toBe(2);
    expect(res.body.data.alert.smsDeliveryStatus[0].contactName).toBe("Mom");
    expect(res.body.data.alert.smsDeliveryStatus[1].contactName).toBe("Spouse");

    const alertInDb = await SosAlert.findOne({
      rideId: ongoingRideId,
      userId: organizerId,
    });

    expect(alertInDb).not.toBeNull();
    expect(alertInDb.smsDeliveryStatus.length).toBe(2);
    expect(alertInDb.smsDeliveryStatus[0].success).toBe(true);
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
