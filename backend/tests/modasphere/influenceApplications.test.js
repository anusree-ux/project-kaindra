const request = require("supertest");
const app = require("../../src/app");
const InfluenceBrandProfile = require("../../src/models/modasphere/modainfluence/InfluenceBrandProfile");
const InfluenceCampaign = require("../../src/models/modasphere/modainfluence/InfluenceCampaign");
const InfluenceCampaignApplication = require("../../src/models/modasphere/modainfluence/InfluenceCampaignApplication");
const InfluenceCreatorProfile = require("../../src/models/modasphere/modainfluence/InfluenceCreatorProfile");
const { createTestUser } = require("../helpers/testUser");

describe("ModaInfluence visibility and applications", () => {
  let brandOwner;
  let otherBrandOwner;
  let creator;
  let otherCreator;
  let brand;
  let otherBrand;
  let creatorProfile;
  let campaign;

  beforeAll(async () => {
    await InfluenceCampaignApplication.init();
  });

  beforeEach(async () => {
    [brandOwner, otherBrandOwner, creator, otherCreator] = await Promise.all([
      createTestUser({ name: "Campaign Brand" }),
      createTestUser({ name: "Different Brand" }),
      createTestUser({ name: "Creator One" }),
      createTestUser({ name: "Creator Two" }),
    ]);
    [brand, otherBrand] = await Promise.all([
      InfluenceBrandProfile.create({ owner: brandOwner.userId, brandName: "Brand One", category: "Fashion", contactEmail: "brand1@example.com" }),
      InfluenceBrandProfile.create({ owner: otherBrandOwner.userId, brandName: "Brand Two", category: "Fashion", contactEmail: "brand2@example.com" }),
    ]);
    [creatorProfile] = await Promise.all([
      InfluenceCreatorProfile.create({ owner: creator.userId, displayName: "Creator One", contactEmail: "creator1@example.com", category: "Fashion", bio: "Public creator bio" }),
      InfluenceCreatorProfile.create({ owner: otherCreator.userId, displayName: "Creator Two", contactEmail: "creator2@example.com" }),
    ]);
    campaign = await InfluenceCampaign.create({
      brandProfile: brand._id,
      brand: brand.brandName,
      email: brand.contactEmail,
      campaignType: "Spring Styling",
      message: "Create seasonal fashion content.",
      isPublic: false,
    });
  });

  it("persists brand visibility and lists visible campaigns without a lifecycle status", async () => {
    const hidden = await request(app).get("/api/modasphere/influence/public-campaigns");
    expect(hidden.body.data).toHaveLength(0);
    expect((await request(app).get(`/api/modasphere/influence/public-campaigns/${campaign.publicId}`)).status).toBe(404);

    const hiddenApplication = await request(app)
      .post(`/api/modasphere/influence/campaigns/${campaign.publicId}/applications`)
      .set("Authorization", `Bearer ${creator.token}`)
      .send();
    expect(hiddenApplication.status).toBe(404);

    const unauthorized = await request(app)
      .patch(`/api/modasphere/influence/brand-profile/campaigns/${campaign._id}/visibility`)
      .set("Authorization", `Bearer ${otherBrandOwner.token}`)
      .send({ isPublic: true });
    expect(unauthorized.status).toBe(404);

    const visible = await request(app)
      .patch(`/api/modasphere/influence/brand-profile/campaigns/${campaign._id}/visibility`)
      .set("Authorization", `Bearer ${brandOwner.token}`)
      .send({ isPublic: true });
    expect(visible.status).toBe(200);
    expect((await InfluenceCampaign.findById(campaign._id)).isPublic).toBe(true);

    await InfluenceCampaign.collection.updateOne({ _id: campaign._id }, { $unset: { publicId: "" } });

    const publicList = await request(app).get("/api/modasphere/influence/public-campaigns");
    expect(publicList.status).toBe(200);
    expect(publicList.body.data).toHaveLength(1);
    expect(publicList.body.data[0]).toMatchObject({ brand: "Brand One", campaignType: "Spring Styling" });
    expect(publicList.body.data[0]).not.toHaveProperty("email");
    expect(publicList.body.data[0]).not.toHaveProperty("_id");
    expect(publicList.body.data[0].publicId).toMatch(/^[0-9a-f-]{36}$/i);
    expect((await InfluenceCampaign.findById(campaign._id)).publicId).toBe(publicList.body.data[0].publicId);
    const publicId = publicList.body.data[0].publicId;

    const hiddenByBrand = await request(app)
      .patch(`/api/modasphere/influence/brand-profile/campaigns/${campaign._id}/visibility`)
      .set("Authorization", `Bearer ${brandOwner.token}`)
      .send({ isPublic: false });
    expect(hiddenByBrand.status).toBe(200);
    expect((await request(app).get("/api/modasphere/influence/public-campaigns")).body.data).toHaveLength(0);
    expect((await request(app).get(`/api/modasphere/influence/public-campaigns/${publicId}`)).status).toBe(404);
    const ownerCampaigns = await request(app)
      .get("/api/modasphere/influence/brand-profile/campaigns")
      .set("Authorization", `Bearer ${brandOwner.token}`);
    expect(ownerCampaigns.status).toBe(200);
    expect(ownerCampaigns.body.data.map((item) => item._id)).toContain(campaign._id.toString());

    const visibleAgain = await request(app)
      .patch(`/api/modasphere/influence/brand-profile/campaigns/${campaign._id}/visibility`)
      .set("Authorization", `Bearer ${brandOwner.token}`)
      .send({ isPublic: true });
    expect(visibleAgain.status).toBe(200);
    expect((await InfluenceCampaign.findById(campaign._id)).isPublic).toBe(true);
    expect((await request(app).get("/api/modasphere/influence/public-campaigns")).body.data).toHaveLength(1);
    expect((await request(app).get(`/api/modasphere/influence/public-campaigns/${publicId}`)).status).toBe(200);
    const retiredCampaignStatusRoute = await request(app)
      .patch(`/api/modasphere/influence/campaigns/${campaign._id}/status`)
      .set("Authorization", `Bearer ${brandOwner.token}`)
      .send({ isPublic: true });
    expect(retiredCampaignStatusRoute.status).toBe(404);
  });

  it("accepts one eligible application per influencer and exposes only the owner's history", async () => {
    await InfluenceCampaign.updateOne({ _id: campaign._id }, { isPublic: true });
    const unauthenticated = await request(app)
      .post(`/api/modasphere/influence/campaigns/${campaign.publicId}/applications`)
      .send();
    expect(unauthenticated.status).toBe(401);
    const noProfile = await request(app)
      .post(`/api/modasphere/influence/campaigns/${campaign.publicId}/applications`)
      .set("Authorization", `Bearer ${otherBrandOwner.token}`)
      .send({});
    expect(noProfile.status).toBe(403);

    const attempts = await Promise.all([0, 1].map(() => request(app)
      .post(`/api/modasphere/influence/campaigns/${campaign.publicId}/applications`)
      .set("Authorization", `Bearer ${creator.token}`)
      .send({ influencerProfile: "forged-id" })));
    expect(attempts.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(attempts.find((response) => response.status === 201).body.data.status).toBe("Pending");
    expect(await InfluenceCampaignApplication.countDocuments({ campaign: campaign._id, influencerProfile: creatorProfile._id })).toBe(1);

    const otherCreatorApps = await request(app)
      .get("/api/modasphere/influence/influencer-profile/applications")
      .set("Authorization", `Bearer ${otherCreator.token}`);
    expect(otherCreatorApps.body.data).toHaveLength(0);
    const myApps = await request(app)
      .get("/api/modasphere/influence/influencer-profile/applications")
      .set("Authorization", `Bearer ${creator.token}`);
    expect(myApps.body.data).toHaveLength(1);
    expect(myApps.body.data[0].campaign.publiclyAvailable).toBe(true);

    await request(app)
      .patch(`/api/modasphere/influence/brand-profile/campaigns/${campaign._id}/visibility`)
      .set("Authorization", `Bearer ${brandOwner.token}`)
      .send({ isPublic: false });
    const hiddenHistory = await request(app)
      .get("/api/modasphere/influence/influencer-profile/applications")
      .set("Authorization", `Bearer ${creator.token}`);
    expect(hiddenHistory.body.data).toHaveLength(1);
    expect(hiddenHistory.body.data[0].status).toBe("Pending");
    expect(hiddenHistory.body.data[0].campaign.publiclyAvailable).toBe(false);
  });

  it("lets only the owning influencer withdraw a pending application and preserves the withdrawn record", async () => {
    await InfluenceCampaign.updateOne({ _id: campaign._id }, { isPublic: true });
    const submitted = await request(app)
      .post(`/api/modasphere/influence/campaigns/${campaign.publicId}/applications`)
      .set("Authorization", `Bearer ${creator.token}`)
      .send();
    expect(submitted.status).toBe(201);
    const application = await InfluenceCampaignApplication.findOne({ campaign: campaign._id, influencerProfile: creatorProfile._id });

    const otherInfluencer = await request(app)
      .patch(`/api/modasphere/influence/influencer-profile/applications/${application._id}/withdraw`)
      .set("Authorization", `Bearer ${otherCreator.token}`);
    expect(otherInfluencer.status).toBe(404);
    expect((await InfluenceCampaignApplication.findById(application._id)).status).toBe("Pending");

    const withdrawn = await request(app)
      .patch(`/api/modasphere/influence/influencer-profile/applications/${application._id}/withdraw`)
      .set("Authorization", `Bearer ${creator.token}`);
    expect(withdrawn.status).toBe(200);
    expect(withdrawn.body.data.status).toBe("Withdrawn");
    expect((await InfluenceCampaignApplication.findById(application._id)).status).toBe("Withdrawn");

    const history = await request(app)
      .get("/api/modasphere/influence/influencer-profile/applications")
      .set("Authorization", `Bearer ${creator.token}`);
    expect(history.body.data[0].status).toBe("Withdrawn");
    const brandApplications = await request(app)
      .get(`/api/modasphere/influence/brand-profile/campaigns/${campaign._id}/applications`)
      .set("Authorization", `Bearer ${brandOwner.token}`);
    expect(brandApplications.body.data[0].status).toBe("Withdrawn");

    const brandAccept = await request(app)
      .patch(`/api/modasphere/influence/brand-profile/campaigns/${campaign._id}/applications/${application._id}/status`)
      .set("Authorization", `Bearer ${brandOwner.token}`)
      .send({ status: "Accepted" });
    const repeatWithdraw = await request(app)
      .patch(`/api/modasphere/influence/influencer-profile/applications/${application._id}/withdraw`)
      .set("Authorization", `Bearer ${creator.token}`);
    const resubmit = await request(app)
      .post(`/api/modasphere/influence/campaigns/${campaign.publicId}/applications`)
      .set("Authorization", `Bearer ${creator.token}`)
      .send();
    expect(brandAccept.status).toBe(409);
    expect(repeatWithdraw.status).toBe(409);
    expect(resubmit.status).toBe(409);
    expect(await InfluenceCampaignApplication.countDocuments({ campaign: campaign._id, influencerProfile: creatorProfile._id })).toBe(1);
  });

  it("does not allow accepted or rejected applications to be withdrawn", async () => {
    await InfluenceCampaign.updateOne({ _id: campaign._id }, { isPublic: true });
    const submitted = await request(app)
      .post(`/api/modasphere/influence/campaigns/${campaign.publicId}/applications`)
      .set("Authorization", `Bearer ${creator.token}`)
      .send();
    const application = await InfluenceCampaignApplication.findOne({ campaign: campaign._id, influencerProfile: creatorProfile._id });
    for (const status of ["Accepted", "Rejected"]) {
      await InfluenceCampaignApplication.updateOne({ _id: application._id }, { $set: { status } });
      const withdrawal = await request(app)
        .patch(`/api/modasphere/influence/influencer-profile/applications/${application._id}/withdraw`)
        .set("Authorization", `Bearer ${creator.token}`);
      expect(withdrawal.status).toBe(409);
      expect((await InfluenceCampaignApplication.findById(application._id)).status).toBe(status);
    }
    expect(submitted.status).toBe(201);
  });

  it("allows only the owner to delete a rejected application while retaining the unique pair", async () => {
    await InfluenceCampaign.updateOne({ _id: campaign._id }, { isPublic: true });
    await request(app)
      .post(`/api/modasphere/influence/campaigns/${campaign.publicId}/applications`)
      .set("Authorization", `Bearer ${creator.token}`)
      .send();
    const application = await InfluenceCampaignApplication.findOne({ campaign: campaign._id, influencerProfile: creatorProfile._id });
    const path = `/api/modasphere/influence/influencer-profile/applications/${application._id}`;

    const unauthenticated = await request(app).delete(path);
    const pendingDelete = await request(app).delete(path).set("Authorization", `Bearer ${creator.token}`);
    expect(unauthenticated.status).toBe(401);
    expect(pendingDelete.status).toBe(409);

    await request(app)
      .patch(`/api/modasphere/influence/brand-profile/campaigns/${campaign._id}/applications/${application._id}/status`)
      .set("Authorization", `Bearer ${brandOwner.token}`)
      .send({ status: "Accepted" });
    const acceptedDelete = await request(app).delete(path).set("Authorization", `Bearer ${creator.token}`);
    expect(acceptedDelete.status).toBe(409);

    await request(app)
      .patch(`/api/modasphere/influence/brand-profile/campaigns/${campaign._id}/applications/${application._id}/status`)
      .set("Authorization", `Bearer ${brandOwner.token}`)
      .send({ status: "Rejected" });
    const otherInfluencerDelete = await request(app)
      .delete(path)
      .set("Authorization", `Bearer ${otherCreator.token}`);
    expect(otherInfluencerDelete.status).toBe(404);

    const deleted = await request(app).delete(path).set("Authorization", `Bearer ${creator.token}`);
    expect(deleted.status).toBe(200);
    const retained = await InfluenceCampaignApplication.findById(application._id);
    expect(retained).not.toBeNull();
    expect(retained.status).toBe("Rejected");
    expect(retained.deletedAt).toBeInstanceOf(Date);

    const history = await request(app)
      .get("/api/modasphere/influence/influencer-profile/applications")
      .set("Authorization", `Bearer ${creator.token}`);
    expect(history.body.data).toHaveLength(0);
    const reapplication = await request(app)
      .post(`/api/modasphere/influence/campaigns/${campaign.publicId}/applications`)
      .set("Authorization", `Bearer ${creator.token}`)
      .send();
    expect(reapplication.status).toBe(409);
    expect(await InfluenceCampaignApplication.countDocuments({ campaign: campaign._id, influencerProfile: creatorProfile._id })).toBe(1);
  });

  it("restricts application access and actions to the campaign's owning brand", async () => {
    await InfluenceCampaign.updateOne({ _id: campaign._id }, { isPublic: true });
    await request(app)
      .post(`/api/modasphere/influence/campaigns/${campaign.publicId}/applications`)
      .set("Authorization", `Bearer ${creator.token}`)
      .send();
    const application = await InfluenceCampaignApplication.findOne({ campaign: campaign._id });

    const wrongBrandList = await request(app)
      .get(`/api/modasphere/influence/brand-profile/campaigns/${campaign._id}/applications`)
      .set("Authorization", `Bearer ${otherBrandOwner.token}`);
    expect(wrongBrandList.status).toBe(404);

    const wrongBrandStatus = await request(app)
      .patch(`/api/modasphere/influence/brand-profile/campaigns/${campaign._id}/applications/${application._id}/status`)
      .set("Authorization", `Bearer ${otherBrandOwner.token}`)
      .send({ status: "Accepted" });
    expect(wrongBrandStatus.status).toBe(404);

    const wrongBrandDelete = await request(app)
      .delete(`/api/modasphere/influence/brand-profile/campaigns/${campaign._id}/applications/${application._id}`)
      .set("Authorization", `Bearer ${otherBrandOwner.token}`);
    expect(wrongBrandDelete.status).toBe(404);

    const list = await request(app)
      .get(`/api/modasphere/influence/brand-profile/campaigns/${campaign._id}/applications`)
      .set("Authorization", `Bearer ${brandOwner.token}`);
    expect(list.status).toBe(200);
    expect(list.body.data[0].influencer).toMatchObject({ displayName: "Creator One", bio: "Public creator bio" });
    expect(list.body.data[0].influencer).not.toHaveProperty("contactEmail");

    const accepted = await request(app)
      .patch(`/api/modasphere/influence/brand-profile/campaigns/${campaign._id}/applications/${application._id}/status`)
      .set("Authorization", `Bearer ${brandOwner.token}`)
      .send({ status: "Accepted" });
    expect(accepted.status).toBe(200);
    expect((await InfluenceCampaignApplication.findById(application._id)).status).toBe("Accepted");

    const rejected = await request(app)
      .patch(`/api/modasphere/influence/brand-profile/campaigns/${campaign._id}/applications/${application._id}/status`)
      .set("Authorization", `Bearer ${brandOwner.token}`)
      .send({ status: "Rejected" });
    expect(rejected.status).toBe(200);
    expect((await InfluenceCampaignApplication.findById(application._id)).status).toBe("Rejected");

    const rejectedResubmission = await request(app)
      .post(`/api/modasphere/influence/campaigns/${campaign.publicId}/applications`)
      .set("Authorization", `Bearer ${creator.token}`)
      .send();
    expect(rejectedResubmission.status).toBe(409);
    expect(await InfluenceCampaignApplication.countDocuments({ campaign: campaign._id, influencerProfile: creatorProfile._id })).toBe(1);

    const deletion = await request(app)
      .delete(`/api/modasphere/influence/brand-profile/campaigns/${campaign._id}/applications/${application._id}`)
      .set("Authorization", `Bearer ${brandOwner.token}`);
    expect(deletion.status).toBe(200);
    const retainedApplication = await InfluenceCampaignApplication.findById(application._id);
    expect(retainedApplication).not.toBeNull();
    expect(retainedApplication.deletedAt).toBeInstanceOf(Date);
    const applicationsAfterDelete = await request(app)
      .get(`/api/modasphere/influence/brand-profile/campaigns/${campaign._id}/applications`)
      .set("Authorization", `Bearer ${brandOwner.token}`);
    expect(applicationsAfterDelete.body.data).toHaveLength(0);
    const resubmissionAfterBrandDelete = await request(app)
      .post(`/api/modasphere/influence/campaigns/${campaign.publicId}/applications`)
      .set("Authorization", `Bearer ${creator.token}`)
      .send();
    expect(resubmissionAfterBrandDelete.status).toBe(409);
    expect(await InfluenceCampaignApplication.countDocuments({ campaign: campaign._id, influencerProfile: creatorProfile._id })).toBe(1);
    expect(otherBrand).toBeDefined();
  });
});
