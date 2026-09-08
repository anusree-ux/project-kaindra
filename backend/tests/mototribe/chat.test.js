const request = require("supertest");
const http = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const app = require("../../src/app");
const Ride = require("../../src/models/mototribe/Ride");
const RideParticipant = require("../../src/models/mototribe/RideParticipant");
const ChatMessage = require("../../src/models/mototribe/ChatMessage");
const { initLocationSocketService } = require("../../src/services/mototribe/locationSocketService");

describe("MotoTribe Ride Group Chat & Socket Service", () => {
  let server, io, port;
  let organizerToken, organizerId;
  let riderToken, riderId;
  let nonParticipantToken;
  let ongoingRideId;

  beforeAll((done) => {
    server = http.createServer(app);
    io = new Server(server);
    initLocationSocketService(io);
    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    io.close();
    server.close(done);
  });

  beforeEach(async () => {
    // 1. Create organizer
    const orgRes = await request(app).post("/api/v1/auth/signup").send({
      name: "Chat Organizer",
      email: "chat.org@example.com",
      password: "password123",
    });
    organizerToken = orgRes.body.accessToken;
    organizerId = orgRes.body.data.user._id;

    // 2. Create rider
    const riderRes = await request(app).post("/api/v1/auth/signup").send({
      name: "Chat Rider",
      email: "chat.rider@example.com",
      password: "password123",
    });
    riderToken = riderRes.body.accessToken;
    riderId = riderRes.body.data.user._id;

    // 3. Create non-participant
    const nonRes = await request(app).post("/api/v1/auth/signup").send({
      name: "Non Participant",
      email: "nonpart@example.com",
      password: "password123",
    });
    nonParticipantToken = nonRes.body.accessToken;

    // 4. Create an ongoing ride
    const rideRes = await request(app)
      .post("/api/mototribe/rides")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({
        title: "Chat Test Highway Run",
        origin: "City C",
        destination: "City D",
        startDate: new Date(Date.now() + 86400000).toISOString(),
        distanceKm: 120,
      });
    ongoingRideId = rideRes.body.data.ride._id;

    // Confirm rider on the ride
    await request(app)
      .post(`/api/mototribe/rides/${ongoingRideId}/join`)
      .set("Authorization", `Bearer ${riderToken}`);
    await request(app)
      .patch(`/api/mototribe/rides/${ongoingRideId}/participants/${riderId}/confirm`)
      .set("Authorization", `Bearer ${organizerToken}`);
    await request(app)
      .patch(`/api/mototribe/rides/${ongoingRideId}/start`)
      .set("Authorization", `Bearer ${organizerToken}`);
  });

  describe("REST Endpoint: GET /api/mototribe/rides/:id/chat/history", () => {
    test("Rejects non-participant with 403 Forbidden", async () => {
      const res = await request(app)
        .get(`/api/mototribe/rides/${ongoingRideId}/chat/history`)
        .set("Authorization", `Bearer ${nonParticipantToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/Only confirmed participants or organizer/i);
    });

    test("Returns chat history sorted oldest to newest for confirmed participant", async () => {
      // Seed 3 messages
      const msg1 = await ChatMessage.create({
        rideId: ongoingRideId,
        userId: organizerId,
        message: "First message",
        createdAt: new Date(Date.now() - 3000),
      });
      const msg2 = await ChatMessage.create({
        rideId: ongoingRideId,
        userId: riderId,
        message: "Second message",
        createdAt: new Date(Date.now() - 2000),
      });
      const msg3 = await ChatMessage.create({
        rideId: ongoingRideId,
        userId: organizerId,
        message: "Third message",
        createdAt: new Date(Date.now() - 1000),
      });

      const res = await request(app)
        .get(`/api/mototribe/rides/${ongoingRideId}/chat/history`)
        .set("Authorization", `Bearer ${riderToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.messages.length).toBe(3);
      expect(res.body.data.messages[0].message).toBe("First message");
      expect(res.body.data.messages[2].message).toBe("Third message");
    });

    test("Supports pagination using the 'before' query parameter", async () => {
      const msg1 = await ChatMessage.create({
        rideId: ongoingRideId,
        userId: organizerId,
        message: "Msg 1",
        createdAt: new Date(Date.now() - 5000),
      });
      const msg2 = await ChatMessage.create({
        rideId: ongoingRideId,
        userId: riderId,
        message: "Msg 2",
        createdAt: new Date(Date.now() - 4000),
      });
      const msg3 = await ChatMessage.create({
        rideId: ongoingRideId,
        userId: organizerId,
        message: "Msg 3",
        createdAt: new Date(Date.now() - 3000),
      });

      // Query before msg3 ID
      const res = await request(app)
        .get(`/api/mototribe/rides/${ongoingRideId}/chat/history?before=${msg3._id}`)
        .set("Authorization", `Bearer ${riderToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.messages.length).toBe(2);
      expect(res.body.data.messages[0].message).toBe("Msg 1");
      expect(res.body.data.messages[1].message).toBe("Msg 2");
    });
  });

  describe("Socket.io Real-time Chat Events", () => {
    let clientSocket;

    afterEach((done) => {
      if (clientSocket && clientSocket.connected) {
        clientSocket.disconnect();
      }
      done();
    });

    test("Rejects chat_message with error if user hasn't called join_ride first", (done) => {
      clientSocket = Client(`http://localhost:${port}`, {
        auth: { token: `Bearer ${riderToken}` },
        reconnection: false,
      });

      clientSocket.on("connect", () => {
        // Emit chat_message WITHOUT calling join_ride first
        clientSocket.emit("chat_message", {
          rideId: ongoingRideId,
          message: "Hello prematurely",
        });
      });

      clientSocket.on("error", (err) => {
        expect(err.message).toMatch(/must join the ride room first/i);
        done();
      });
    });

    test("Joins room and successfully broadcasts chat_message_received to sender and room", (done) => {
      clientSocket = Client(`http://localhost:${port}`, {
        auth: { token: `Bearer ${riderToken}` },
        reconnection: false,
      });

      clientSocket.on("connect", () => {
        clientSocket.emit("join_ride", { rideId: ongoingRideId });
      });

      clientSocket.on("joined_ride", () => {
        clientSocket.emit("chat_message", {
          rideId: ongoingRideId,
          message: "Live chat test message!",
        });
      });

      clientSocket.on("chat_message_received", (data) => {
        expect(data.message).toBe("Live chat test message!");
        expect(data.userName).toBe("Chat Rider");
        expect(data.rideId).toBe(ongoingRideId);
        done();
      });
    });

    test("Enforces 1 second rate limit on chat_message", (done) => {
      clientSocket = Client(`http://localhost:${port}`, {
        auth: { token: `Bearer ${riderToken}` },
        reconnection: false,
      });

      clientSocket.on("connect", () => {
        clientSocket.emit("join_ride", { rideId: ongoingRideId });
      });

      clientSocket.on("joined_ride", () => {
        // Emit 1st message
        clientSocket.emit("chat_message", {
          rideId: ongoingRideId,
          message: "Message 1",
        });
        // Immediately emit 2nd message (violates 1s limit)
        clientSocket.emit("chat_message", {
          rideId: ongoingRideId,
          message: "Message 2 rapid fire",
        });
      });

      clientSocket.on("rate_limit_exceeded", (data) => {
        expect(data.message).toMatch(/rate-limited to 1 message per second/i);
        done();
      });
    });
  });
});
