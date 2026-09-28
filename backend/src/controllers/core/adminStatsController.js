const Career = require("../../models/core/Career");
const JobApplication = require("../../models/core/JobApplication");
const CommunityMember = require("../../models/core/CommunityMember");
const { seedInitialCareers } = require("../../scripts/seedCareers");

// @desc    Get dashboard metrics for Admin dashboard
// @route   GET /api/admin/stats or /api/v1/admin/stats
// @access  Admin / Public
exports.getAdminStats = async (req, res, next) => {
  try {
    let openPositionsCount = await Career.countDocuments();
    if (openPositionsCount === 0) {
      await seedInitialCareers();
      openPositionsCount = await Career.countDocuments();
    }

    const applicationsCount = await JobApplication.countDocuments();
    const communityMembersCount = await CommunityMember.countDocuments();

    res.status(200).json({
      status: "success",
      data: {
        openPositions: openPositionsCount,
        applications: applicationsCount,
        communityMembers: communityMembersCount,
        growth: "12%",
      },
    });
  } catch (error) {
    next(error);
  }
};
