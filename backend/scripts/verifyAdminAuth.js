const request = require("supertest");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const app = require("../src/app");

async function runSupertest() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Connected to DB in test runner.");

    // Test Admin Login with correct credentials
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@kaindra.com",
        password: "admin123",
      });

    console.log("Admin Login Status:", res.status);
    console.log("Admin Login Data:", {
      status: res.body.status,
      hasAccessToken: !!res.body.accessToken,
      user: res.body.data?.user,
    });

    if (res.status === 200 && res.body.data?.user?.role === "admin") {
      console.log("SUCCESS: Admin login using 'admins' table is fully operational!");

      // Test protected /api/v1/auth/me with access token
      const meRes = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${res.body.accessToken}`);

      console.log("Protected /me Status:", meRes.status);
      console.log("Protected /me User:", meRes.body.data?.user?.email);
    } else {
      console.error("FAIL:", res.body);
    }

    // Test with wrong password
    const wrongRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@kaindra.com",
        password: "wrongpassword",
      });

    console.log("Wrong Password Status (should be 401):", wrongRes.status);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
  }
}

runSupertest();
