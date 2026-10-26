const request = require("supertest");
const app = require("../../src/app");
const InfluenceBrandProfile = require("../../src/models/modasphere/modainfluence/InfluenceBrandProfile");
const InfluenceCampaign = require("../../src/models/modasphere/modainfluence/InfluenceCampaign");
const InfluenceCreatorProfile = require("../../src/models/modasphere/modainfluence/InfluenceCreatorProfile");
const { createTestUser } = require("../helpers/testUser");

describe("ModaInfluence brand campaign management", () => {
  let owner;
  let otherUser;
  let brandProfile;
  let campaign;

  beforeEach(async () => {
    owner = await createTestUser({ name: "Influence Brand Owner" });
    otherUser = await createTestUser({ name: "Other Brand Owner" });

    brandProfile = await InfluenceBrandProfile.create({
      owner: owner.userId,
      brandName: "Moda Test Brand",
      category: "Fashion",
      contactEmail: "brand@example.com",
    });

    campaign = await InfluenceCampaign.create({
      brandProfile: brandProfile._id,
      brand: brandProfile.brandName,
      email: brandProfile.contactEmail,
      campaignType: "Fashion Promotion",
      message: "Original campaign description",
      isPublic: true,
    });
  });

  it("publicly lists visible brand campaigns and omits private fields", async () => {
    await InfluenceCampaign.create([
      {
        brandProfile: brandProfile._id,
        brand: "Draft Brand",
        email: "draft@example.com",
        campaignType: "Unreviewed",
        message: "Not public yet",
        isPublic: false,
      },
      {
        brandProfile: brandProfile._id,
        brand: "Rejected Brand",
        email: "rejected@example.com",
        campaignType: "Rejected",
        message: "Should stay private",
        isPublic: false,
      },
      {
        brand: "Anonymous Brand",
        email: "private@example.com",
        campaignType: "Unlinked request",
        message: "Not an approved brand campaign",
        isPublic: true,
      },
    ]);

    const response = await request(app).get("/api/modasphere/influence/public-campaigns");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      brand: brandProfile.brandName,
      title: "Fashion Promotion",
      campaignType: "Fashion Promotion",
      message: "Original campaign description",
    });
    expect(response.body.data[0]).not.toHaveProperty("email");
    expect(response.body.data[0]).not.toHaveProperty("status");
    expect(response.body.data[0]).not.toHaveProperty("brandProfile");
    expect(response.body.data[0]).not.toHaveProperty("_id");
    expect(response.body.data[0].publicId).toBe(campaign.publicId);

    const details = await request(app).get(`/api/modasphere/influence/public-campaigns/${campaign.publicId}`);
    expect(details.status).toBe(200);
    expect(details.body.data.publicId).toBe(campaign.publicId);
    expect(details.body.data).not.toHaveProperty("_id");
    expect(details.body.data).not.toHaveProperty("email");
  });

  it("creates authenticated campaigns on the user's brand and lists only those campaigns", async () => {
    const created = await request(app)
      .post("/api/modasphere/influence/brand-profile/campaigns")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        brand: "Untrusted submitted brand",
        email: "someone-else@example.com",
        title: "Spring Wardrobe Refresh",
        campaignType: "Creator Partnership",
        message: "A new campaign",
      });

    expect(created.status).toBe(201);
    expect(created.body.data.brandProfile.toString()).toBe(brandProfile._id.toString());
    expect(created.body.data.brand).toBe(brandProfile.brandName);
    expect(created.body.data.email).toBe(brandProfile.contactEmail);
    expect(created.body.data.title).toBe("Spring Wardrobe Refresh");

    const listed = await request(app)
      .get("/api/modasphere/influence/brand-profile/campaigns")
      .set("Authorization", `Bearer ${owner.token}`);

    expect(listed.status).toBe(200);
    expect(listed.body.data.map((item) => item._id)).toEqual(
      expect.arrayContaining([campaign._id.toString(), created.body.data._id])
    );

    const otherList = await request(app)
      .get("/api/modasphere/influence/brand-profile/campaigns")
      .set("Authorization", `Bearer ${otherUser.token}`);

    expect(otherList.status).toBe(404);
  });

  it("updates the existing campaign while preserving brand and email without a campaign status", async () => {
    const response = await request(app)
      .patch(`/api/modasphere/influence/brand-profile/campaigns/${campaign._id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        title: "Denim, Reimagined",
        campaignType: "Updated Promotion",
        message: "Updated description",
      });

    expect(response.status).toBe(200);
    expect(response.body.data._id).toBe(campaign._id.toString());
    expect(response.body.data.title).toBe("Denim, Reimagined");
    expect(response.body.data.campaignType).toBe("Updated Promotion");
    expect(response.body.data.message).toBe("Updated description");
    expect(response.body.data.brand).toBe(brandProfile.brandName);
    expect(response.body.data.email).toBe(brandProfile.contactEmail);
    expect(response.body.data).not.toHaveProperty("status");

    const saved = await InfluenceCampaign.findById(campaign._id);
    expect(saved.campaignType).toBe("Updated Promotion");
    expect(saved.title).toBe("Denim, Reimagined");
    expect(saved.toObject()).not.toHaveProperty("status");
    expect(await InfluenceCampaign.countDocuments({ brandProfile: brandProfile._id })).toBe(1);
  });

  it("rejects an empty or invalid campaign update", async () => {
    const empty = await request(app)
      .patch(`/api/modasphere/influence/brand-profile/campaigns/${campaign._id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({});

    const invalid = await request(app)
      .patch(`/api/modasphere/influence/brand-profile/campaigns/${campaign._id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ campaignType: "  " });

    expect(empty.status).toBe(400);
    expect(invalid.status).toBe(400);

    const whitespaceTitle = await request(app)
      .patch(`/api/modasphere/influence/brand-profile/campaigns/${campaign._id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ title: "   " });
    expect(whitespaceTitle.status).toBe(400);
  });

  it("falls back to campaign type for older campaigns without a title", async () => {
    const oldCampaign = await InfluenceCampaign.create({
      brandProfile: brandProfile._id,
      brand: brandProfile.brandName,
      email: brandProfile.contactEmail,
      campaignType: "Legacy Fashion Promotion",
      message: "Existing content stays intact",
      isPublic: true,
    });
    await InfluenceCampaign.collection.updateOne({ _id: oldCampaign._id }, { $unset: { title: "" } });

    const publicList = await request(app).get("/api/modasphere/influence/public-campaigns");
    const legacyItem = publicList.body.data.find((item) => item.publicId === oldCampaign.publicId);
    expect(legacyItem.title).toBe("Legacy Fashion Promotion");
    expect(legacyItem.message).toBe("Existing content stays intact");

    const listed = await request(app)
      .get("/api/modasphere/influence/brand-profile/campaigns")
      .set("Authorization", `Bearer ${owner.token}`);
    const legacyDashboardItem = listed.body.data.find((item) => item._id === oldCampaign._id.toString());
    expect(legacyDashboardItem.title).toBe("Legacy Fashion Promotion");

    const update = await request(app)
      .patch(`/api/modasphere/influence/brand-profile/campaigns/${oldCampaign._id}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ title: "Legacy campaign title updated" });
    expect(update.status).toBe(200);
    expect(update.body.data.title).toBe("Legacy campaign title updated");
    expect(update.body.data.message).toBe("Existing content stays intact");
  });

  it("requires a non-whitespace title when creating a campaign", async () => {
    const missing = await request(app)
      .post("/api/modasphere/influence/brand-profile/campaigns")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ campaignType: "Fashion Promotion", message: "Description" });
    const whitespace = await request(app)
      .post("/api/modasphere/influence/brand-profile/campaigns")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ title: "   ", campaignType: "Fashion Promotion", message: "Description" });
    expect(missing.status).toBe(400);
    expect(whitespace.status).toBe(400);
  });

  it("does not allow another user to update or delete the campaign", async () => {
    const update = await request(app)
      .patch(`/api/modasphere/influence/brand-profile/campaigns/${campaign._id}`)
      .set("Authorization", `Bearer ${otherUser.token}`)
      .send({ message: "Unauthorized change" });

    const deletion = await request(app)
      .delete(`/api/modasphere/influence/brand-profile/campaigns/${campaign._id}`)
      .set("Authorization", `Bearer ${otherUser.token}`);

    expect(update.status).toBe(404);
    expect(deletion.status).toBe(404);
    expect((await InfluenceCampaign.findById(campaign._id)).message).toBe(
      "Original campaign description"
    );
  });

  it("deletes the campaign for its owner and persists the deletion", async () => {
    const response = await request(app)
      .delete(`/api/modasphere/influence/brand-profile/campaigns/${campaign._id}`)
      .set("Authorization", `Bearer ${owner.token}`);

    expect(response.status).toBe(200);
    expect(response.body.data._id).toBe(campaign._id.toString());
    expect(await InfluenceCampaign.findById(campaign._id)).toBeNull();
  });

  it("creates and updates an influencer profile independently of the brand profile", async () => {
    const created = await request(app)
      .post("/api/modasphere/influence/influencer-profile")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        displayName: "Fashion Creator",
        contactEmail: "creator@example.com",
        category: "Fashion",
        bio: "Style and design content",
      });

    expect(created.status).toBe(201);
    const profileId = created.body.data._id;

    const duplicate = await request(app)
      .post("/api/modasphere/influence/influencer-profile")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({
        displayName: "Duplicate Creator",
        contactEmail: "duplicate@example.com",
      });
    expect(duplicate.status).toBe(409);

    const updated = await request(app)
      .patch("/api/modasphere/influence/influencer-profile")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ bio: "Updated creator biography" });

    expect(updated.status).toBe(200);
    expect(updated.body.data._id).toBe(profileId);
    expect(updated.body.data.bio).toBe("Updated creator biography");
    expect((await InfluenceCreatorProfile.findById(profileId)).owner.toString()).toBe(
      owner.userId.toString()
    );
    expect(await InfluenceBrandProfile.findById(brandProfile._id)).not.toBeNull();

    const otherUserProfile = await request(app)
      .get("/api/modasphere/influence/influencer-profile")
      .set("Authorization", `Bearer ${otherUser.token}`);
    expect(otherUserProfile.status).toBe(200);
    expect(otherUserProfile.body.data).toBeNull();
  });
});
