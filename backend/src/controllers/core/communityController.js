const CommunityMember = require("../../models/core/CommunityMember");

// @desc    Register a new community member
// @route   POST /api/community or /api/v1/community
// @access  Public
exports.joinCommunity = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        status: "fail",
        message: "Name, email, and phone number are required.",
      });
    }

    // Check if email already exists
    const existing = await CommunityMember.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(200).json({
        status: "success",
        message: "You are already registered in the community!",
        data: { member: existing },
      });
    }

    const member = await CommunityMember.create({
      name,
      email,
      phone,
      joinedAt: new Date(),
    });

    res.status(201).json({
      status: "success",
      message: "Successfully joined the Kaindra community!",
      data: {
        member,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all community members
// @route   GET /api/community or /api/v1/community
// @access  Admin
exports.getCommunityMembers = async (req, res, next) => {
  try {
    const members = await CommunityMember.find().sort({ joinedAt: -1 });

    res.status(200).json({
      status: "success",
      results: members.length,
      data: {
        members,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a community member
// @route   DELETE /api/community/:id or /api/v1/community/:id
// @access  Admin
exports.deleteCommunityMember = async (req, res, next) => {
  try {
    const member = await CommunityMember.findByIdAndDelete(req.params.id);

    if (!member) {
      return res.status(404).json({
        status: "fail",
        message: "Community member not found.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Community member deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
