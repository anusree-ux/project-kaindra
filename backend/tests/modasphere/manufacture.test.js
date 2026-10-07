const request = require("supertest");
const app = require("../../src/app");
const Design = require("../../src/models/modasphere/Design");
const Manufacturer = require("../../src/models/modasphere/Manufacturer");
const ProductionRequest = require("../../src/models/modasphere/ProductionRequest");
const { createTestUser } = require("../helpers/testUser");

describe("ModaManufacture - Manufacturer Directory & RFQ API", () => {
  let designOwner;
  let mfgUser;
  let otherMfgUser;
  let adminUser;
  let stranger;
  let readyDesign;
  let readyDesignB;
  let draftDesign;
  let mfgProfile;
  let otherMfgProfile;

  beforeEach(async () => {
    await Design.deleteMany({});
    await Manufacturer.deleteMany({});
    await ProductionRequest.deleteMany({});

    designOwner = await createTestUser({ name: "Design Owner", role: "user" });
    mfgUser = await createTestUser({ name: "Manufacturer Owner", role: "user" });
    otherMfgUser = await createTestUser({ name: "Other Manufacturer Owner", role: "user" });
    adminUser = await createTestUser({ name: "System Admin", role: "admin" });
    stranger = await createTestUser({ name: "Stranger User", role: "user" });

    // Primary manufacturer profile
    mfgProfile = await Manufacturer.create({
      userId: mfgUser.userId,
      companyName: "EcoStitch Garments Ltd",
      capabilities: ["cut_and_sew", "knitwear"],
      minOrderQuantity: 100,
      leadTimeDays: 14,
      contactEmail: "orders@ecostitch.com",
      contactPhone: "+91-9876543210",
      verificationStatus: "pending",
    });

    // Secondary manufacturer profile
    otherMfgProfile = await Manufacturer.create({
      userId: otherMfgUser.userId,
      companyName: "Apex Denim Mills",
      capabilities: ["denim"],
      minOrderQuantity: 50,
      leadTimeDays: 10,
      contactEmail: "contact@apexdenim.com",
      contactPhone: "+91-9988776655",
      verificationStatus: "verified",
    });

    // Ready for production designs
    readyDesign = await Design.create({
      ownerId: designOwner.userId,
      title: "Sustainable Linen Dress",
      status: "ready_for_production",
      visibility: "private",
      assets: [
        {
          url: "https://res.cloudinary.com/test/techpack.pdf",
          publicId: "modasphere/designs/techpack_101",
          resourceType: "raw",
          fileName: "techpack.pdf",
          uploadedBy: designOwner.userId,
        },
      ],
    });

    readyDesignB = await Design.create({
      ownerId: designOwner.userId,
      title: "Avant-Garde Wool Trench Coat",
      status: "ready_for_production",
      visibility: "private",
      assets: [
        {
          url: "https://res.cloudinary.com/test/coat.png",
          publicId: "modasphere/designs/coat_202",
          resourceType: "image",
          fileName: "coat.png",
          uploadedBy: designOwner.userId,
        },
      ],
    });

    // Draft design
    draftDesign = await Design.create({
      ownerId: designOwner.userId,
      title: "Draft Denim Jacket",
      status: "draft",
      visibility: "private",
    });
  });

  describe("1. Manufacturer Directory & Verification", () => {
    test("Unverified manufacturers are hidden from public browse list", async () => {
      const res = await request(app)
        .get("/api/modasphere/manufacturers")
        .set("Authorization", `Bearer ${stranger.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.manufacturers.length).toBe(1); // Only otherMfgProfile (verified)
      expect(res.body.data.manufacturers[0].companyName).toBe("Apex Denim Mills");
    });

    test("Admin can verify manufacturer; non-admins get 403", async () => {
      const nonAdminRes = await request(app)
        .patch(`/api/modasphere/manufacturers/${mfgProfile._id}/verify`)
        .set("Authorization", `Bearer ${designOwner.token}`)
        .send({ verificationStatus: "verified" });

      expect(nonAdminRes.statusCode).toBe(403);

      const adminRes = await request(app)
        .patch(`/api/modasphere/manufacturers/${mfgProfile._id}/verify`)
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({ verificationStatus: "verified", note: "Approved ISO documents" });

      expect(adminRes.statusCode).toBe(200);
      expect(adminRes.body.data.manufacturer.verificationStatus).toBe("verified");
    });

    test("Updating companyName or capabilities resets verified status to pending", async () => {
      mfgProfile.verificationStatus = "verified";
      await mfgProfile.save();

      const updateRes = await request(app)
        .put("/api/modasphere/manufacturers/me")
        .set("Authorization", `Bearer ${mfgUser.token}`)
        .send({
          companyName: "EcoStitch Garments Ltd",
          capabilities: ["cut_and_sew", "knitwear", "embroidery"],
        });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.data.manufacturer.verificationStatus).toBe("pending");
    });
  });

  describe("2. Production Request Creation Restrictions & Duplicate Protection", () => {
    beforeEach(async () => {
      mfgProfile.verificationStatus = "verified";
      await mfgProfile.save();
    });

    test("Cannot submit request to unverified manufacturer", async () => {
      mfgProfile.verificationStatus = "pending";
      await mfgProfile.save();

      const res = await request(app)
        .post("/api/modasphere/production-requests")
        .set("Authorization", `Bearer ${designOwner.token}`)
        .send({
          designId: readyDesign._id,
          manufacturerId: mfgProfile._id,
          quantity: 200,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/verified manufacturers/i);
    });

    test("Only design owner can send request, and only for ready_for_production designs", async () => {
      const nonOwnerRes = await request(app)
        .post("/api/modasphere/production-requests")
        .set("Authorization", `Bearer ${stranger.token}`)
        .send({
          designId: readyDesign._id,
          manufacturerId: mfgProfile._id,
          quantity: 200,
        });

      expect(nonOwnerRes.statusCode).toBe(403);

      const draftRes = await request(app)
        .post("/api/modasphere/production-requests")
        .set("Authorization", `Bearer ${designOwner.token}`)
        .send({
          designId: draftDesign._id,
          manufacturerId: mfgProfile._id,
          quantity: 200,
        });

      expect(draftRes.statusCode).toBe(400);
      expect(draftRes.body.message).toMatch(/ready_for_production/i);
    });

    test("Duplicate open request for same design + manufacturer is rejected", async () => {
      // First request
      const firstRes = await request(app)
        .post("/api/modasphere/production-requests")
        .set("Authorization", `Bearer ${designOwner.token}`)
        .send({
          designId: readyDesign._id,
          manufacturerId: mfgProfile._id,
          quantity: 100,
        });

      expect(firstRes.statusCode).toBe(201);

      // Duplicate request attempt -> 400
      const dupRes = await request(app)
        .post("/api/modasphere/production-requests")
        .set("Authorization", `Bearer ${designOwner.token}`)
        .send({
          designId: readyDesign._id,
          manufacturerId: mfgProfile._id,
          quantity: 200,
        });

      expect(dupRes.statusCode).toBe(400);
      expect(dupRes.body.message).toMatch(/active production request already exists/i);
    });
  });

  describe("3. Quote Validation & Wrong-Actor Authorization Tests", () => {
    let rfqId;

    beforeEach(async () => {
      mfgProfile.verificationStatus = "verified";
      await mfgProfile.save();

      const createRes = await request(app)
        .post("/api/modasphere/production-requests")
        .set("Authorization", `Bearer ${designOwner.token}`)
        .send({
          designId: readyDesign._id,
          manufacturerId: mfgProfile._id,
          quantity: 500,
        });

      rfqId = createRes.body.data.productionRequest._id;
    });

    test("Past validUntil is rejected at quote creation time", async () => {
      const res = await request(app)
        .patch(`/api/modasphere/production-requests/${rfqId}/quote`)
        .set("Authorization", `Bearer ${mfgUser.token}`)
        .send({
          pricePerUnit: 350,
          leadTimeDays: 14,
          validUntil: new Date(Date.now() - 7200000).toISOString(), // 2 hours in the past
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/validUntil must be a valid date in the future/i);
    });

    test("Wrong-actor transitions return 403 or 400", async () => {
      // Non-assigned manufacturer attempts to submit quote -> 403
      const wrongMfgQuote = await request(app)
        .patch(`/api/modasphere/production-requests/${rfqId}/quote`)
        .set("Authorization", `Bearer ${otherMfgUser.token}`)
        .send({ pricePerUnit: 300, leadTimeDays: 10 });

      expect(wrongMfgQuote.statusCode).toBe(403);

      // Submit valid quote
      await request(app)
        .patch(`/api/modasphere/production-requests/${rfqId}/quote`)
        .set("Authorization", `Bearer ${mfgUser.token}`)
        .send({ pricePerUnit: 350, leadTimeDays: 14 });

      // Manufacturer tries to accept quote -> 403 (only requester can respond)
      const mfgAcceptRes = await request(app)
        .patch(`/api/modasphere/production-requests/${rfqId}/respond`)
        .set("Authorization", `Bearer ${mfgUser.token}`)
        .send({ action: "accept" });

      expect(mfgAcceptRes.statusCode).toBe(403);

      // Stranger tries to view request details -> 403
      const strangerGet = await request(app)
        .get(`/api/modasphere/production-requests/${rfqId}`)
        .set("Authorization", `Bearer ${stranger.token}`);

      expect(strangerGet.statusCode).toBe(403);
    });
  });

  describe("4. Isolation of Design Access & Contact Information Privacy", () => {
    let rfqId;

    beforeEach(async () => {
      mfgProfile.verificationStatus = "verified";
      await mfgProfile.save();

      const createRes = await request(app)
        .post("/api/modasphere/production-requests")
        .set("Authorization", `Bearer ${designOwner.token}`)
        .send({
          designId: readyDesign._id,
          manufacturerId: mfgProfile._id,
          quantity: 200,
        });

      rfqId = createRes.body.data.productionRequest._id;
    });

    test("Manufacturer with request on design A CANNOT view design B", async () => {
      // Manufacturer can view design A (readyDesign)
      const designARes = await request(app)
        .get(`/api/modasphere/designs/${readyDesign._id}`)
        .set("Authorization", `Bearer ${mfgUser.token}`);

      expect(designARes.statusCode).toBe(200);

      // Manufacturer CANNOT view design B (readyDesignB)
      const designBRes = await request(app)
        .get(`/api/modasphere/designs/${readyDesignB._id}`)
        .set("Authorization", `Bearer ${mfgUser.token}`);

      expect(designBRes.statusCode).toBe(403);
    });

    test("Rejection of quote revokes design access", async () => {
      // Submit quote
      await request(app)
        .patch(`/api/modasphere/production-requests/${rfqId}/quote`)
        .set("Authorization", `Bearer ${mfgUser.token}`)
        .send({ pricePerUnit: 400, leadTimeDays: 7 });

      // Requester rejects quote
      await request(app)
        .patch(`/api/modasphere/production-requests/${rfqId}/respond`)
        .set("Authorization", `Bearer ${designOwner.token}`)
        .send({ action: "reject" });

      // Manufacturer now loses access to design A
      const postRejectView = await request(app)
        .get(`/api/modasphere/designs/${readyDesign._id}`)
        .set("Authorization", `Bearer ${mfgUser.token}`);

      expect(postRejectView.statusCode).toBe(403);
    });

    test("List and request endpoints NEVER expose contact fields before acceptance", async () => {
      // 1. GET /production-requests/sent while status is 'requested'
      const sentRes = await request(app)
        .get("/api/modasphere/production-requests/sent")
        .set("Authorization", `Bearer ${designOwner.token}`);

      expect(sentRes.statusCode).toBe(200);
      const sentReq = sentRes.body.data.productionRequests[0];
      expect(sentReq.manufacturerId.contactEmail).toBeUndefined();
      expect(sentReq.manufacturerId.contactPhone).toBeUndefined();

      // 2. GET /production-requests/:id while status is 'requested'
      const getSingleRes = await request(app)
        .get(`/api/modasphere/production-requests/${rfqId}`)
        .set("Authorization", `Bearer ${designOwner.token}`);

      expect(getSingleRes.statusCode).toBe(200);
      expect(getSingleRes.body.data.productionRequest.manufacturerId.contactEmail).toBeUndefined();
      expect(getSingleRes.body.data.productionRequest.manufacturerId.contactPhone).toBeUndefined();
    });
  });
});
