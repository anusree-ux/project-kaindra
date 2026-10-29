const express = require("express");
const {
  joinCommunity,
  getCommunityMembers,
  deleteCommunityMember,
} = require("../../controllers/core/communityController");
const { protect, authorize } = require("../../middleware/authMiddleware");

const router = express.Router();

// Admin only: view member records and delete member records.
router.get("/", protect, authorize("admin"), getCommunityMembers);
router.delete("/:id", protect, authorize("admin"), deleteCommunityMember);

// Public: join the community.
router.post("/", joinCommunity);

module.exports = router;
