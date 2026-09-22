const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/core/User");
const OtpVerification = require("../src/models/core/OtpVerification");

describe("Authentication & OTP Verification API", () => {
  const userData = {
    name: "John Rider",
    email: "john.rider@example.com",
    phoneNumber: "+919876543210",
    password: "password123",
  };

  beforeEach(async () => {
    await User.deleteMany({});
    await OtpVerification.deleteMany({});
  });

  test("Successful signup creates an unverified user, generates OTP, and returns userId without access token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send(userData);

    expect(res.statusCode).toEqual(201);
    expect(res.body.status).toBe("success");
    expect(res.body.accessToken).toBeUndefined(); // Token is NOT issued until OTP is verified
    expect(res.body.data.userId).toBeDefined();
    expect(res.body.data.phoneNumber).toBe("919876543210");

    const userInDb = await User.findOne({ email: userData.email });
    expect(userInDb).not.toBeNull();
    expect(userInDb.isPhoneVerified).toBe(false);

    const otpInDb = await OtpVerification.findOne({ userId: userInDb._id });
    expect(otpInDb).not.toBeNull();
  });

  test("Signup with duplicate email or verified phone number is rejected", async () => {
    await User.create({ ...userData, isPhoneVerified: true });

    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send(userData);

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test("Successful OTP verification sets isPhoneVerified: true and issues JWT tokens", async () => {
    const signupRes = await request(app)
      .post("/api/v1/auth/signup")
      .send(userData);

    const userId = signupRes.body.data.userId;
    const otpRecord = await OtpVerification.findOne({ userId });

    // Extract OTP code directly or verify via OTP record
    // In our implementation sendOtpToUser generates the OTP.
    // To test verifyOtp, we get the hashed OTP or simulate valid code via OtpVerification.
    // Let's create an OTP record with known hashed code for exact testing
    const { hashOtp } = require("../src/services/core/otpService");
    const testCode = "123456";
    const hashedCode = await hashOtp(testCode);
    otpRecord.otpCode = hashedCode;
    await otpRecord.save();

    const verifyRes = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ userId, otpCode: testCode });

    expect(verifyRes.statusCode).toEqual(200);
    expect(verifyRes.body.status).toBe("success");
    expect(verifyRes.body.accessToken).toBeDefined();

    const userInDb = await User.findById(userId);
    expect(userInDb.isPhoneVerified).toBe(true);

    const remainingOtp = await OtpVerification.findOne({ userId });
    expect(remainingOtp).toBeNull(); // Cleaned up after successful verification
  });

  test("Incorrect OTP code increments attempt counter and returns remaining attempts", async () => {
    const signupRes = await request(app)
      .post("/api/v1/auth/signup")
      .send(userData);

    const userId = signupRes.body.data.userId;

    const verifyRes = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ userId, otpCode: "000000" });

    expect(verifyRes.statusCode).toEqual(400);
    expect(verifyRes.body.message).toMatch(/Invalid OTP code/i);

    const otpInDb = await OtpVerification.findOne({ userId });
    expect(otpInDb.attempts).toBe(1);
  });

  test("Exceeding 5 attempts locks out verification until new OTP is requested", async () => {
    const signupRes = await request(app)
      .post("/api/v1/auth/signup")
      .send(userData);

    const userId = signupRes.body.data.userId;
    await OtpVerification.updateOne({ userId }, { $set: { attempts: 5 } });

    const verifyRes = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ userId, otpCode: "123456" });

    expect(verifyRes.statusCode).toEqual(400);
    expect(verifyRes.body.message).toMatch(/Maximum OTP verification attempts exceeded/i);
  });

  test("Expired OTP is rejected", async () => {
    const signupRes = await request(app)
      .post("/api/v1/auth/signup")
      .send(userData);

    const userId = signupRes.body.data.userId;
    // Set expiry in the past
    await OtpVerification.updateOne(
      { userId },
      { $set: { expiresAt: new Date(Date.now() - 1000) } }
    );

    const verifyRes = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ userId, otpCode: "123456" });

    expect(verifyRes.statusCode).toEqual(400);
    expect(verifyRes.body.message).toMatch(/expired/i);
  });

  test("Resend OTP sends a new OTP and rate limits max 3 resends per 15 minutes", async () => {
    const signupRes = await request(app)
      .post("/api/v1/auth/signup")
      .send(userData);

    const userId = signupRes.body.data.userId;

    // Resend 1
    const res1 = await request(app)
      .post("/api/v1/auth/resend-otp")
      .send({ userId });
    expect(res1.statusCode).toEqual(200);

    // Resend 2
    const res2 = await request(app)
      .post("/api/v1/auth/resend-otp")
      .send({ userId });
    expect(res2.statusCode).toEqual(200);

    // Resend 3
    const res3 = await request(app)
      .post("/api/v1/auth/resend-otp")
      .send({ userId });
    expect(res3.statusCode).toEqual(200);

    // Resend 4 (Exceeds max 3 resends per 15 minutes)
    const res4 = await request(app)
      .post("/api/v1/auth/resend-otp")
      .send({ userId });
    expect(res4.statusCode).toEqual(429);
    expect(res4.body.message).toMatch(/Maximum 3 OTP resend requests allowed/i);
  });

  test("Login with correct credentials for verified user returns a valid JWT", async () => {
    await User.create({ ...userData, isPhoneVerified: true });

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

  test("Unverified user attempting to access protected route gets 403 Forbidden", async () => {
    const signupRes = await request(app)
      .post("/api/v1/auth/signup")
      .send(userData);

    // Manually issue JWT for testing unverified user on protected route
    const { signAccessToken } = require("../src/utils/jwt");
    const unverifiedToken = signAccessToken({ id: signupRes.body.data.userId, role: "user" });

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${unverifiedToken}`);

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toMatch(/phone number is not verified/i);
  });

  test("Abandoned unverified account allows signup retry after OTP expires or is missing", async () => {
    // 1. Initial signup
    const signup1 = await request(app)
      .post("/api/v1/auth/signup")
      .send(userData);
    expect(signup1.statusCode).toEqual(201);
    const oldUserId = signup1.body.data.userId;

    // 2. Artificially expire the OTP
    await OtpVerification.updateOne(
      { userId: oldUserId },
      { $set: { expiresAt: new Date(Date.now() - 1000) } }
    );

    // 3. Retry signup with same phone number & email
    const signup2 = await request(app)
      .post("/api/v1/auth/signup")
      .send(userData);

    expect(signup2.statusCode).toEqual(201);
    expect(signup2.body.data.userId).not.toEqual(oldUserId);

    // Verify old unverified user document was cleaned up and replaced
    const oldUserInDb = await User.findById(oldUserId);
    expect(oldUserInDb).toBeNull();
  });
});
