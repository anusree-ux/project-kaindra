const express = require("express");
const {
  joinCommunity,
  getCommunityMembers,
  deleteCommunityMember,
} = require("../../controllers/core/communityController");

const router = express.Router();

router.route("/")
  .get(getCommunityMembers)
  .post(joinCommunity);

router.route("/:id")
  .delete(deleteCommunityMember);

module.exports = router;
