const request = require("supertest");
const app = require("../../src/app");
const UserAchievement = require("../../src/models/mototribe/UserAchievement");
const { checkAndAwardBadges } = require("../../src/services/mototribe/achievementService");

describe("MotoTribe Passport Achievements API & Service", () => {
  let organizerToken;
  let organizerId;

  beforeEach(async () => {
    const orgRes = await request(app).post("/api/v1/auth/signup").send({
      name: "Achievement Rider",
      email: "achievement.rider@example.com",
      password: "password123",
    });
    organizerToken = orgRes.body.accessToken;
    organizerId = orgRes.body.data.user._id;

    await request(app)
      .post("/api/mototribe/rider-profile")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ vehicleNumber: "KA05EF9999", bikeModel: "Interceptor 650" });
  });

  test("A user who completes their first ride earns the 'first_ride' badge", async () => {
    const rideRes = await request(app)
      .post("/api/mototribe/rides")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({
        title: "First Ride Sprint",
        origin: "City X",
        destination: "City Y",
        startDate: new Date(Date.now() + 86400000).toISOString(),
        distanceKm: 50,
      });
    const rideId = rideRes.body.data.ride._id;

    await request(app)
      .patch(`/api/mototribe/rides/${rideId}/start`)
      .set("Authorization", `Bearer ${organizerToken}`);

    await request(app)
      .patch(`/api/mototribe/rides/${rideId}/complete`)
      .set("Authorization", `Bearer ${organizerToken}`);

    const achievement = await UserAchievement.findOne({
      userId: organizerId,
      badgeKey: "first_ride",
    });

    expect(achievement).not.toBeNull();

    const passportRes = await request(app)
      .get("/api/mototribe/rider-profile/me/passport")
      .set("Authorization", `Bearer ${organizerToken}`);

    expect(passportRes.statusCode).toEqual(200);
    const earnedKeys = passportRes.body.data.earnedBadges.map((b) => b.key);
    expect(earnedKeys).toContain("first_ride");
  });

  test("Running the badge check twice does not create duplicate UserAchievement records", async () => {
    const rideRes = await request(app)
      .post("/api/mototribe/rides")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({
        title: "Idempotency Ride Test",
        origin: "City X",
        destination: "City Y",
        startDate: new Date(Date.now() + 86400000).toISOString(),
        distanceKm: 50,
      });
    const rideId = rideRes.body.data.ride._id;

    await request(app)
      .patch(`/api/mototribe/rides/${rideId}/start`)
      .set("Authorization", `Bearer ${organizerToken}`);

    await request(app)
      .patch(`/api/mototribe/rides/${rideId}/complete`)
      .set("Authorization", `Bearer ${organizerToken}`);

    // Call checkAndAwardBadges explicitly second time
    const secondRun = await checkAndAwardBadges(organizerId);
    expect(secondRun.length).toBe(0);

    const achievements = await UserAchievement.find({
      userId: organizerId,
      badgeKey: "first_ride",
    });

    expect(achievements.length).toBe(1);
  });
});
