const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/core/User");

describe("Authentication API", () => {
  const userData = {
    name: "John Rider",
    email: "john.rider@example.com",
    password: "password123",
  };

  test("Successful signup creates a user and returns access token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send(userData);

    expect(res.statusCode).toEqual(201);
    expect(res.body.status).toBe("success");
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(userData.email);

    const userInDb = await User.findOne({ email: userData.email });
    expect(userInDb).not.toBeNull();
  });

  test("Signup with duplicate email is rejected", async () => {
    await User.create(userData);

    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send(userData);

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test("Login with correct credentials returns a valid JWT", async () => {
    await User.create(userData);

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: userData.email,
        password: userData.password,
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe("success");
    expect(res.body.accessToken).toBeDefined();
  });

  test("Login with wrong password is rejected", async () => {
    await User.create(userData);

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: userData.email,
        password: "wrongpassword",
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  test("Accessing a protected route without a token returns 401", async () => {
    const res = await request(app).get("/api/v1/auth/me");

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toMatch(/not logged in/i);
  });

  test("Accessing a protected route with a valid token succeeds", async () => {
    const signupRes = await request(app)
      .post("/api/v1/auth/signup")
      .send(userData);

    const token = signupRes.body.accessToken;

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.user.email).toBe(userData.email);
  });
});
