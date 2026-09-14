const request = require("supertest");
const app = require("../../src/app");
const RouteReport = require("../../src/models/mototribe/RouteReport");
const { createTestUser } = require("../helpers/testUser");

describe("MotoTribe Community Route Intelligence API", () => {
  let user1Token, user1Id;
  let user2Token, user2Id;

  beforeEach(async () => {
    const u1 = await createTestUser({ name: "Route Reporter 1" });
    user1Token = u1.token;
    user1Id = u1.userId;

    const u2 = await createTestUser({ name: "Route Reporter 2" });
    user2Token = u2.token;
    user2Id = u2.userId;
  });

  describe("POST /api/mototribe/route-reports", () => {
    test("User can submit a new route report successfully", async () => {
      const res = await request(app)
        .post("/api/mototribe/route-reports")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          origin: "Bangalore",
          destination: "Goa",
          reportType: "road_condition",
          content: "Ghat section between Hubli and Karwar has major potholes. Exercise caution.",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.report.origin).toBe("bangalore");
      expect(res.body.data.report.destination).toBe("goa");
      expect(res.body.data.report.reportType).toBe("road_condition");
      expect(res.body.data.report.content).toMatch(/Ghat section/i);
      expect(res.body.data.report.helpfulCount).toBe(0);
    });

    test("Rejects report with invalid reportType or missing fields with 400 validation error", async () => {
      const res = await request(app)
        .post("/api/mototribe/route-reports")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          origin: "Bangalore",
          destination: "Goa",
          reportType: "invalid_type",
          content: "Test note",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Validation failed/i);
    });
  });

  describe("GET /api/mototribe/route-reports", () => {
    beforeEach(async () => {
      // 1. Report with 5 helpful votes
      await RouteReport.create({
        userId: user1Id,
        origin: "bangalore",
        destination: "goa",
        reportType: "warning",
        content: "Police checkpoint active at Karnataka border",
        helpfulCount: 5,
      });

      // 2. Report with 10 helpful votes
      await RouteReport.create({
        userId: user2Id,
        origin: "bangalore",
        destination: "goa",
        reportType: "road_condition",
        content: "Smooth tarmac via NH48",
        helpfulCount: 10,
      });

      // 3. Report for a different route
      await RouteReport.create({
        userId: user1Id,
        origin: "bangalore",
        destination: "coorg",
        reportType: "scenic_spot",
        content: "Great view near Madikeri",
        helpfulCount: 2,
      });
    });

    test("Rejects request with 400 if origin or destination is missing", async () => {
      const res = await request(app)
        .get("/api/mototribe/route-reports?origin=Bangalore")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(400);
    });

    test("Lists route reports matching route, sorted by helpfulCount descending", async () => {
      const res = await request(app)
        .get("/api/mototribe/route-reports?origin=Bangalore%20&destination=GOA")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.reports.length).toBe(2);
      expect(res.body.data.reports[0].helpfulCount).toBe(10);
      expect(res.body.data.reports[1].helpfulCount).toBe(5);
    });

    test("Filters reports by reportType when specified", async () => {
      const res = await request(app)
        .get("/api/mototribe/route-reports?origin=bangalore&destination=goa&reportType=warning")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.reports.length).toBe(1);
      expect(res.body.data.reports[0].reportType).toBe("warning");
    });
  });

  describe("POST /api/mototribe/route-reports/:id/helpful", () => {
    let reportId;

    beforeEach(async () => {
      const r = await RouteReport.create({
        userId: user1Id,
        origin: "bangalore",
        destination: "ooty",
        reportType: "fuel_availability",
        content: "24/7 HP fuel station open near Bandipur forest gate",
      });
      reportId = r._id.toString();
    });

    test("User can mark a report as helpful, incrementing helpfulCount and recording userId", async () => {
      const res = await request(app)
        .post(`/api/mototribe/route-reports/${reportId}/helpful`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.report.helpfulCount).toBe(1);

      const rInDb = await RouteReport.findById(reportId);
      expect(rInDb.helpfulCount).toBe(1);
      expect(rInDb.helpfulUserIds.map((id) => id.toString())).toContain(user2Id.toString());
    });

    test("Prevents double-marking by the same user (returns 400 Bad Request)", async () => {
      // First upvote
      await request(app)
        .post(`/api/mototribe/route-reports/${reportId}/helpful`)
        .set("Authorization", `Bearer ${user2Token}`);

      // Second upvote from same user
      const res = await request(app)
        .post(`/api/mototribe/route-reports/${reportId}/helpful`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already marked this report as helpful/i);
    });
  });

  describe("DELETE /api/mototribe/route-reports/:id", () => {
    let reportId;

    beforeEach(async () => {
      const r = await RouteReport.create({
        userId: user1Id,
        origin: "bangalore",
        destination: "wayanad",
        reportType: "hotel_tip",
        content: "Rider-friendly homestay near Vythiri with secure parking",
      });
      reportId = r._id.toString();
    });

    test("Non-owner attempting to delete report is rejected with 403 Forbidden", async () => {
      const res = await request(app)
        .delete(`/api/mototribe/route-reports/${reportId}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/only delete your own route reports/i);

      const rInDb = await RouteReport.findById(reportId);
      expect(rInDb).not.toBeNull();
    });

    test("Owner can delete their own route report", async () => {
      const res = await request(app)
        .delete(`/api/mototribe/route-reports/${reportId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/deleted successfully/i);

      const rInDb = await RouteReport.findById(reportId);
      expect(rInDb).toBeNull();
    });
  });
});
