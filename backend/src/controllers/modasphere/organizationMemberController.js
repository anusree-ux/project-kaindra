const ModaOrganizationMember = require("../../models/modasphere/ModaOrganizationMember");
const ModaOrganization = require("../../models/modasphere/ModaOrganization");
const User = require("../../models/core/User");

// Add a member to an organization
const addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;

    const organization = await ModaOrganization.findOne({
      _id: req.params.organizationId,
      ownerId: req.user._id,
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found or you are not the owner",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (role === "owner") {
      return res.status(400).json({
        success: false,
        message: "Owner role cannot be assigned through this endpoint",
      });
    }

    const existingMember = await ModaOrganizationMember.findOne({
      organizationId: organization._id,
      userId,
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of this organization",
      });
    }

    const member = await ModaOrganizationMember.create({
      organizationId: organization._id,
      userId,
      role: role || "member",
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Member added successfully",
      member,
    });
  } catch (error) {
    console.error("Add organization member error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add organization member",
      error: error.message,
    });
  }
};

// Get all members of an organization
const getOrganizationMembers = async (req, res) => {
  try {
    const organization = await ModaOrganization.findById(
      req.params.organizationId
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    const members = await ModaOrganizationMember.find({
      organizationId: organization._id,
    })
      .populate("userId", "name email")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: members.length,
      members,
    });
  } catch (error) {
    console.error("Get organization members error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch organization members",
      error: error.message,
    });
  }
};

// Update a member's role/status
const updateMember = async (req, res) => {
  try {
    const { role, status } = req.body;

    const organization = await ModaOrganization.findOne({
      _id: req.params.organizationId,
      ownerId: req.user._id,
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found or you are not the owner",
      });
    }

    const updates = {};

    if (role !== undefined) {
      if (role === "owner") {
        return res.status(400).json({
          success: false,
          message: "Owner role cannot be assigned through this endpoint",
        });
      }

      updates.role = role;
    }

    if (status !== undefined) {
      updates.status = status;
    }

    const member = await ModaOrganizationMember.findOneAndUpdate(
      {
        _id: req.params.memberId,
        organizationId: organization._id,
      },
      updates,
      {
        new: true,
        runValidators: true,
      }
    ).populate("userId", "name email");

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Organization member not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Member updated successfully",
      member,
    });
  } catch (error) {
    console.error("Update organization member error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update organization member",
      error: error.message,
    });
  }
};

// Remove a member from an organization
const removeMember = async (req, res) => {
  try {
    const organization = await ModaOrganization.findOne({
      _id: req.params.organizationId,
      ownerId: req.user._id,
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found or you are not the owner",
      });
    }

    const member = await ModaOrganizationMember.findOneAndDelete({
      _id: req.params.memberId,
      organizationId: organization._id,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Organization member not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Remove organization member error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to remove organization member",
      error: error.message,
    });
  }
};

module.exports = {
  addMember,
  getOrganizationMembers,
  updateMember,
  removeMember,
};