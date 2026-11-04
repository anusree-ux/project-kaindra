const request = require("supertest");
const app = require("../../src/app");
const Admin = require("../../src/models/core/Admin");
const Career = require("../../src/models/core/Career");
const JobApplication = require("../../src/models/core/JobApplication");
const { signAccessToken } = require("../../src/utils/jwt");
const { createTestUser } = require("../helpers/testUser");

describe("Careers applications API", () => {
  let adminToken;

  beforeEach(async () => {
    const admin = await Admin.create({
      email: `applications-admin-${Date.now()}-${Math.random()}@example.com`,
      password: "test-password-123",
    });
    adminToken = signAccessToken({ id: admin._id, role: "admin" });
  });

  test("public submission is persisted and an authenticated admin can list and delete it", async () => {
    const career = await Career.create({
      title: "Product Designer",
      experience: "3+ years",
    });
    const submission = {
      jobId: career.id,
      jobTitle: "Product Designer",
      jobLocation: "Remote",
      jobType: "Full Time",
      name: "Test Candidate",
      email: "candidate@example.com",
      phone: "+1 555 0100",
      resumeUrl: "https://example.com/resume.pdf",
    };

    const submitResponse = await request(app)
      .post("/api/applications")
      .send(submission);

    expect(submitResponse.statusCode).toBe(201);
    const applicationId = submitResponse.body.data.application._id;
    const savedApplication = await JobApplication.findById(applicationId);
    expect(savedApplication.name).toBe(submission.name);
    expect(savedApplication.email).toBe(submission.email);
    expect(savedApplication.jobTitle).toBe(submission.jobTitle);
    expect(savedApplication.jobId.toString()).toBe(career.id);

    const unauthenticatedResponse = await request(app).get("/api/applications");
    expect(unauthenticatedResponse.statusCode).toBe(401);

    const { token: userToken } = await createTestUser();
    const forbiddenResponse = await request(app)
      .get("/api/applications")
      .set("Authorization", `Bearer ${userToken}`);
    expect(forbiddenResponse.statusCode).toBe(403);

    const listResponse = await request(app)
      .get("/api/applications")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.body.data.applications.map((application) => application._id))
      .toContain(applicationId);
    expect(
      listResponse.body.data.applications.find(
        (application) => application._id === applicationId
      ).jobId
    ).toBe(career.id);

    const deleteResponse = await request(app)
      .delete(`/api/applications/${applicationId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(deleteResponse.statusCode).toBe(200);
    expect(await JobApplication.findById(applicationId)).toBeNull();
  });

  test("only an authenticated admin can delete applications", async () => {
    const application = await JobApplication.create({
      jobTitle: "Engineer",
      name: "Another Candidate",
      email: "another@example.com",
      phone: "+1 555 0101",
      resumeUrl: "https://example.com/another-resume.pdf",
    });

    const unauthenticatedResponse = await request(app)
      .delete(`/api/applications/${application.id}`);
    expect(unauthenticatedResponse.statusCode).toBe(401);

    const { token: userToken } = await createTestUser();
    const forbiddenResponse = await request(app)
      .delete(`/api/applications/${application.id}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(forbiddenResponse.statusCode).toBe(403);
    expect(await JobApplication.findById(application.id)).not.toBeNull();
  });
});
