const express = require("express");

const {
  addMember,
  getOrganizationMembers,
  updateMember,
  removeMember,
} = require("../../controllers/modasphere/organizationMemberController");

const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// Add a member
router.post("/:organizationId/members", protect, addMember);

// Get organization members
router.get("/:organizationId/members", protect, getOrganizationMembers);

// Update a member
router.patch(
  "/:organizationId/members/:memberId",
  protect,
  updateMember
);

// Remove a member
router.delete(
  "/:organizationId/members/:memberId",
  protect,
  removeMember
);

module.exports = router;