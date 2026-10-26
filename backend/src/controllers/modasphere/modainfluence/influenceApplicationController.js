const mongoose = require("mongoose");
const InfluenceCampaign = require("../../../models/modasphere/modainfluence/InfluenceCampaign");
const InfluenceCampaignApplication = require("../../../models/modasphere/modainfluence/InfluenceCampaignApplication");
const InfluenceBrandProfile = require("../../../models/modasphere/modainfluence/InfluenceBrandProfile");
const InfluenceCreatorProfile = require("../../../models/modasphere/modainfluence/InfluenceCreatorProfile");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const publicCampaignFilter = () => ({
  brandProfile: { $ne: null },
  isPublic: true,
});

const createApplication = async (req, res) => {
  try {
    if (!/^[0-9a-f-]{36}$/i.test(req.params.campaignId)) {
      return res.status(400).json({ success: false, message: "Invalid campaign reference." });
    }
    const influencerProfile = await InfluenceCreatorProfile.findOne({ owner: req.user._id }).select("_id");
    if (!influencerProfile) {
      return res.status(403).json({ success: false, message: "Create an influencer profile before applying." });
    }
    const campaign = await InfluenceCampaign.findOne({
      ...publicCampaignFilter(),
      publicId: req.params.campaignId,
    }).select("_id");
    if (!campaign) {
      return res.status(404).json({ success: false, message: "This campaign is not accepting applications." });
    }

    const existingApplication = await InfluenceCampaignApplication.findOne({
      campaign: campaign._id,
      influencerProfile: influencerProfile._id,
    }).select("_id");
    if (existingApplication) {
      return res.status(409).json({ success: false, message: "You have already applied to this campaign." });
    }

    try {
      const application = await InfluenceCampaignApplication.create({
        campaign: campaign._id,
        influencerProfile: influencerProfile._id,
      });
      return res.status(201).json({
        success: true,
        message: "Your application was submitted.",
        data: { status: application.status, createdAt: application.createdAt },
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ success: false, message: "You have already applied to this campaign." });
      }
      throw error;
    }
  } catch (error) {
    console.error("Create influence campaign application error:", error);
    return res.status(500).json({ success: false, message: "Failed to submit application." });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const profile = await InfluenceCreatorProfile.findOne({ owner: req.user._id }).select("_id");
    if (!profile) return res.status(200).json({ success: true, count: 0, data: [] });
    const applications = await InfluenceCampaignApplication.find({
      influencerProfile: profile._id,
      deletedAt: { $exists: false },
    })
      .sort({ createdAt: -1 })
      .populate({ path: "campaign", select: "publicId brand title campaignType createdAt isPublic brandProfile" })
      .lean();
    const data = applications.map((application) => ({
      _id: application._id,
      status: application.status,
      createdAt: application.createdAt,
      campaign: application.campaign ? {
        publicId: application.campaign.publicId,
        brand: application.campaign.brand,
        title: application.campaign.title || application.campaign.campaignType,
        campaignType: application.campaign.campaignType,
        createdAt: application.campaign.createdAt,
        publiclyAvailable: Boolean(application.campaign.brandProfile) &&
          application.campaign.isPublic === true,
      } : null,
    }));
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Get influencer campaign applications error:", error);
    return res.status(500).json({ success: false, message: "Failed to load applications." });
  }
};

const withdrawApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    if (!isValidId(applicationId)) {
      return res.status(400).json({ success: false, message: "Invalid application ID." });
    }
    const profile = await InfluenceCreatorProfile.findOne({ owner: req.user._id }).select("_id");
    if (!profile) {
      return res.status(403).json({ success: false, message: "Create an influencer profile before withdrawing an application." });
    }
    const ownedApplication = await InfluenceCampaignApplication.findOne({
      _id: applicationId,
      influencerProfile: profile._id,
    }).select("_id status");
    if (!ownedApplication) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }
    if (ownedApplication.status !== "Pending") {
      return res.status(409).json({ success: false, message: `A ${ownedApplication.status.toLowerCase()} application cannot be withdrawn.` });
    }

    const application = await InfluenceCampaignApplication.findOneAndUpdate(
      { _id: applicationId, influencerProfile: profile._id, status: "Pending" },
      { $set: { status: "Withdrawn" } },
      { new: true, runValidators: true }
    ).select("_id status createdAt");
    if (!application) {
      return res.status(409).json({ success: false, message: "This application can no longer be withdrawn." });
    }
    return res.status(200).json({
      success: true,
      message: "Application withdrawn successfully.",
      data: application,
    });
  } catch (error) {
    console.error("Withdraw influence campaign application error:", error);
    return res.status(500).json({ success: false, message: "Failed to withdraw application." });
  }
};

const deleteRejectedApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    if (!isValidId(applicationId)) {
      return res.status(400).json({ success: false, message: "Invalid application ID." });
    }
    const profile = await InfluenceCreatorProfile.findOne({ owner: req.user._id }).select("_id");
    if (!profile) {
      return res.status(403).json({ success: false, message: "Create an influencer profile before deleting an application." });
    }
    const application = await InfluenceCampaignApplication.findOne({
      _id: applicationId,
      influencerProfile: profile._id,
      deletedAt: { $exists: false },
    }).select("_id status");
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }
    if (application.status !== "Rejected") {
      return res.status(409).json({ success: false, message: "Only rejected applications can be deleted." });
    }
    const deleted = await InfluenceCampaignApplication.findOneAndUpdate(
      {
        _id: applicationId,
        influencerProfile: profile._id,
        status: "Rejected",
        deletedAt: { $exists: false },
      },
      { $set: { deletedAt: new Date() } },
      { new: true }
    ).select("_id deletedAt");
    if (!deleted) {
      return res.status(409).json({ success: false, message: "This application can no longer be deleted." });
    }
    return res.status(200).json({ success: true, message: "Rejected application deleted." });
  } catch (error) {
    console.error("Delete rejected influence application error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete application." });
  }
};

const getCampaignApplications = async (req, res) => {
  try {
    if (!isValidId(req.params.campaignId)) {
      return res.status(400).json({ success: false, message: "Invalid campaign ID." });
    }
    const brandProfile = await InfluenceBrandProfile.findOne({ owner: req.user._id }).select("_id");
    if (!brandProfile) return res.status(404).json({ success: false, message: "Brand profile not found." });
    const campaign = await InfluenceCampaign.findOne({ _id: req.params.campaignId, brandProfile: brandProfile._id }).select("_id");
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found for this brand." });

    const applications = await InfluenceCampaignApplication.find({
      campaign: campaign._id,
      deletedAt: { $exists: false },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "influencerProfile",
        select: "displayName category bio website socialLinks -_id",
      })
      .lean();
    const data = applications.map((application) => ({
      _id: application._id,
      status: application.status,
      createdAt: application.createdAt,
      influencer: application.influencerProfile,
    }));
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Get brand campaign applications error:", error);
    return res.status(500).json({ success: false, message: "Failed to load campaign applications." });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { campaignId, applicationId } = req.params;
    if (!isValidId(campaignId) || !isValidId(applicationId)) {
      return res.status(400).json({ success: false, message: "Invalid campaign or application ID." });
    }
    if (!["Accepted", "Rejected"].includes(req.body.status)) {
      return res.status(400).json({ success: false, message: "Status must be Accepted or Rejected." });
    }
    const brandProfile = await InfluenceBrandProfile.findOne({ owner: req.user._id }).select("_id");
    if (!brandProfile) return res.status(404).json({ success: false, message: "Brand profile not found." });
    const campaign = await InfluenceCampaign.findOne({ _id: campaignId, brandProfile: brandProfile._id }).select("_id");
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found for this brand." });
    const existingApplication = await InfluenceCampaignApplication.findOne({
      _id: applicationId,
      campaign: campaign._id,
      deletedAt: { $exists: false },
    }).select("status");
    if (!existingApplication) return res.status(404).json({ success: false, message: "Application not found for this campaign." });
    if (existingApplication.status === "Withdrawn") {
      return res.status(409).json({ success: false, message: "A withdrawn application cannot be accepted or rejected." });
    }
    const application = await InfluenceCampaignApplication.findOneAndUpdate(
      { _id: applicationId, campaign: campaign._id, deletedAt: { $exists: false }, status: { $ne: "Withdrawn" } },
      { $set: { status: req.body.status } },
      { new: true, runValidators: true }
    ).select("_id status createdAt");
    if (!application) return res.status(409).json({ success: false, message: "This application can no longer be changed." });
    return res.status(200).json({ success: true, message: "Application status updated.", data: application });
  } catch (error) {
    console.error("Update campaign application status error:", error);
    return res.status(500).json({ success: false, message: "Failed to update application." });
  }
};

const deleteApplication = async (req, res) => {
  try {
    const { campaignId, applicationId } = req.params;
    if (!isValidId(campaignId) || !isValidId(applicationId)) {
      return res.status(400).json({ success: false, message: "Invalid campaign or application ID." });
    }
    const brandProfile = await InfluenceBrandProfile.findOne({ owner: req.user._id }).select("_id");
    if (!brandProfile) return res.status(404).json({ success: false, message: "Brand profile not found." });
    const campaign = await InfluenceCampaign.findOne({ _id: campaignId, brandProfile: brandProfile._id }).select("_id");
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found for this brand." });
    const application = await InfluenceCampaignApplication.findOneAndUpdate(
      { _id: applicationId, campaign: campaign._id, deletedAt: { $exists: false } },
      { $set: { deletedAt: new Date() } },
      { new: true }
    ).select("_id deletedAt");
    if (!application) return res.status(404).json({ success: false, message: "Application not found for this campaign." });
    return res.status(200).json({ success: true, message: "Application deleted." });
  } catch (error) {
    console.error("Delete campaign application error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete application." });
  }
};

module.exports = {
  createApplication,
  getMyApplications,
  withdrawApplication,
  deleteRejectedApplication,
  getCampaignApplications,
  updateApplicationStatus,
  deleteApplication,
};
