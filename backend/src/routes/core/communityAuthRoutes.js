const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  getMe,
  profileSetup,
  protectCommunity,
} = require("../../controllers/core/communityAuthController");

// Public community auth routes
router.post("/signup", signup);
router.post("/login", login);

// Protected community auth routes
router.get("/me", protectCommunity, getMe);
router.post("/profile-setup", protectCommunity, profileSetup);

module.exports = router;
