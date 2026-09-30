const request = require("supertest");
const app = require("../../src/app");
const ConnectionRequest = require("../../src/models/core/ConnectionRequest");
const { createTestUser } = require("../helpers/testUser");

describe("Rider Connection Request System API", () => {
  let user1, user2, user3;

  beforeEach(async () => {
    await ConnectionRequest.deleteMany({});

    user1 = await createTestUser({ name: "Rider One" });
    user2 = await createTestUser({ name: "Rider Two" });
    user3 = await createTestUser({ name: "Rider Three" });
  });

  test("1. Sending a connection request successfully creates a pending request", async () => {
    const res = await request(app)
      .post("/api/core/connections/request")
      .set("Authorization", `Bearer ${user1.token}`)
      .send({ toUserId: user2.userId });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data.autoAccepted).toBe(false);
    expect(res.body.data.connectionRequest.status).toBe("pending");
    expect(res.body.data.connectionRequest.fromUserId).toBe(user1.userId.toString());
    expect(res.body.data.connectionRequest.toUserId).toBe(user2.userId.toString());

    // Verify incoming and outgoing requests
    const incomingRes = await request(app)
      .get("/api/core/connections/requests/incoming")
      .set("Authorization", `Bearer ${user2.token}`);
    expect(incomingRes.statusCode).toBe(200);
    expect(incomingRes.body.results).toBe(1);
    expect(incomingRes.body.data.requests[0].fromUserId.name).toBe("Rider One");

    const outgoingRes = await request(app)
      .get("/api/core/connections/requests/outgoing")
      .set("Authorization", `Bearer ${user1.token}`);
    expect(outgoingRes.statusCode).toBe(200);
    expect(outgoingRes.body.results).toBe(1);
    expect(outgoingRes.body.data.requests[0].toUserId.name).toBe("Rider Two");
  });

  test("2. Rejects sending a connection request to oneself", async () => {
    const res = await request(app)
      .post("/api/core/connections/request")
      .set("Authorization", `Bearer ${user1.token}`)
      .send({ toUserId: user1.userId });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/cannot send a connection request to yourself/i);
  });

  test("3. Duplicate request rejection for pending or accepted connections", async () => {
    // First request
    await request(app)
      .post("/api/core/connections/request")
      .set("Authorization", `Bearer ${user1.token}`)
      .send({ toUserId: user2.userId });

    // Duplicate request from same user
    const dupRes = await request(app)
      .post("/api/core/connections/request")
      .set("Authorization", `Bearer ${user1.token}`)
      .send({ toUserId: user2.userId });

    expect(dupRes.statusCode).toBe(400);
    expect(dupRes.body.message).toMatch(/already pending/i);
  });

  test("4. Recipient can accept a pending request and view connection in getConnections", async () => {
    const sendRes = await request(app)
      .post("/api/core/connections/request")
      .set("Authorization", `Bearer ${user1.token}`)
      .send({ toUserId: user2.userId });

    const requestId = sendRes.body.data.connectionRequest._id;

    // Recipient accepts
    const acceptRes = await request(app)
      .patch(`/api/core/connections/requests/${requestId}/respond`)
      .set("Authorization", `Bearer ${user2.token}`)
      .send({ action: "accept" });

    expect(acceptRes.statusCode).toBe(200);
    expect(acceptRes.body.data.connectionRequest.status).toBe("accepted");

    // Both users can see each other in getConnections
    const conn1Res = await request(app)
      .get("/api/core/connections")
      .set("Authorization", `Bearer ${user1.token}`);
    expect(conn1Res.statusCode).toBe(200);
    expect(conn1Res.body.results).toBe(1);
    expect(conn1Res.body.data.connections[0].user.name).toBe("Rider Two");

    const conn2Res = await request(app)
      .get("/api/core/connections")
      .set("Authorization", `Bearer ${user2.token}`);
    expect(conn2Res.statusCode).toBe(200);
    expect(conn2Res.body.results).toBe(1);
    expect(conn2Res.body.data.connections[0].user.name).toBe("Rider One");
  });

  test("5. Recipient can ignore a pending request", async () => {
    const sendRes = await request(app)
      .post("/api/core/connections/request")
      .set("Authorization", `Bearer ${user1.token}`)
      .send({ toUserId: user2.userId });

    const requestId = sendRes.body.data.connectionRequest._id;

    // Recipient ignores
    const ignoreRes = await request(app)
      .patch(`/api/core/connections/requests/${requestId}/respond`)
      .set("Authorization", `Bearer ${user2.token}`)
      .send({ action: "ignore" });

    expect(ignoreRes.statusCode).toBe(200);
    expect(ignoreRes.body.data.connectionRequest.status).toBe("ignored");

    // Connections list remains empty
    const connRes = await request(app)
      .get("/api/core/connections")
      .set("Authorization", `Bearer ${user1.token}`);
    expect(connRes.body.results).toBe(0);
  });

  test("6. Auto-accepts connection when both users send requests to each other", async () => {
    // User 1 sends request to User 2
    await request(app)
      .post("/api/core/connections/request")
      .set("Authorization", `Bearer ${user1.token}`)
      .send({ toUserId: user2.userId });

    // User 2 sends request to User 1 (opposite direction)
    const autoAcceptRes = await request(app)
      .post("/api/core/connections/request")
      .set("Authorization", `Bearer ${user2.token}`)
      .send({ toUserId: user1.userId });

    expect(autoAcceptRes.statusCode).toBe(201);
    expect(autoAcceptRes.body.data.autoAccepted).toBe(true);
    expect(autoAcceptRes.body.data.connectionRequest.status).toBe("accepted");

    // Verify both are now connected
    const connRes = await request(app)
      .get("/api/core/connections")
      .set("Authorization", `Bearer ${user1.token}`);
    expect(connRes.body.results).toBe(1);
    expect(connRes.body.data.connections[0].user._id).toBe(user2.userId.toString());
  });

  test("7. Non-recipient attempting to respond is rejected with 403 Forbidden", async () => {
    const sendRes = await request(app)
      .post("/api/core/connections/request")
      .set("Authorization", `Bearer ${user1.token}`)
      .send({ toUserId: user2.userId });

    const requestId = sendRes.body.data.connectionRequest._id;

    // User 3 (unrelated third party) tries to accept User 1's request to User 2
    const unauthorizedRes = await request(app)
      .patch(`/api/core/connections/requests/${requestId}/respond`)
      .set("Authorization", `Bearer ${user3.token}`)
      .send({ action: "accept" });

    expect(unauthorizedRes.statusCode).toBe(403);
    expect(unauthorizedRes.body.message).toMatch(/only the recipient/i);

    // Sender (User 1) tries to accept their own outgoing request
    const senderRes = await request(app)
      .patch(`/api/core/connections/requests/${requestId}/respond`)
      .set("Authorization", `Bearer ${user1.token}`)
      .send({ action: "accept" });

    expect(senderRes.statusCode).toBe(403);
    expect(senderRes.body.message).toMatch(/only the recipient/i);
  });
});
