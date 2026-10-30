const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/core/User");
const Admin = require("../src/models/core/Admin");

describe("Authentication & Google OAuth API", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Admin.deleteMany({});
  });

  describe("Google OAuth Authentication", () => {
    test("Authenticates and registers a new user with Google OAuth credentials", async () => {
      const res = await request(app)
        .post("/api/v1/auth/google")
        .send({
          email: "rider@google.com",
          name: "Google Rider",
          googleId: "google-uid-12345",
          picture: "https://example.com/avatar.jpg",
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe("success");
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe("rider@google.com");
      expect(res.body.data.user.name).toBe("Google Rider");

      const userInDb = await User.findOne({ email: "rider@google.com" });
      expect(userInDb).not.toBeNull();
      expect(userInDb.googleId).toBe("google-uid-12345");
      expect(userInDb.avatar).toBe("https://example.com/avatar.jpg");
    });

    test("Logs in existing user with Google OAuth credentials without duplicating records", async () => {
      await User.create({
        name: "Existing Rider",
        email: "existing@google.com",
        googleId: "google-uid-existing",
      });

      const res = await request(app)
        .post("/api/v1/auth/google")
        .send({
          email: "existing@google.com",
          name: "Existing Rider",
          googleId: "google-uid-existing",
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe("success");
      expect(res.body.accessToken).toBeDefined();

      const count = await User.countDocuments({ email: "existing@google.com" });
      expect(count).toBe(1);
    });

    test("Rejects Google OAuth request missing email credential", async () => {
      const res = await request(app)
        .post("/api/v1/auth/google")
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toMatch(/valid google account information/i);
    });
  });

  describe("Admin Login via dedicated 'admins' collection", () => {
    beforeEach(async () => {
      await Admin.create({
        name: "Admin",
        email: "admin@kaindra.com",
        password: "admin123",
        role: "admin",
      });
    });

    test("Logs in admin successfully from 'admins' collection", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "admin@kaindra.com",
          password: "admin123",
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe("success");
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.data.user.role).toBe("admin");
      expect(res.body.data.user.email).toBe("admin@kaindra.com");
    });

    test("Rejects admin login with incorrect password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "admin@kaindra.com",
          password: "wrongpassword",
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });
  });

  describe("Protected /me and Token Management", () => {
    test("Returns authenticated user profile via /me", async () => {
      const authRes = await request(app)
        .post("/api/v1/auth/google")
        .send({
          email: "profile.test@google.com",
          name: "Profile Test User",
          googleId: "google-profile-123",
        });

      const token = authRes.body.accessToken;

      const meRes = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(meRes.statusCode).toEqual(200);
      expect(meRes.body.data.user.email).toBe("profile.test@google.com");
    });

    test("Rejects protected route without token", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.statusCode).toEqual(401);
    });
  });

  describe("Decommissioned Endpoints Guards", () => {
    test("Rejects legacy password signup with decommissioned message", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send({
          email: "legacy@test.com",
          password: "password123",
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toMatch(/Google/i);
    });

    test("Rejects legacy OTP verification with decommissioned message", async () => {
      const res = await request(app)
        .post("/api/v1/auth/verify-otp")
        .send({
          otpCode: "123456",
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toMatch(/Google/i);
    });
  });
});
