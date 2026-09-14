const express = require("express");

const {
  createProfile,
  getMyProfile,
  updateMyProfile,
  getProfileByHandle,
} = require("../../controllers/modasphere/profileController");

const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// Create ModaSphere profile
router.post("/", protect, createProfile);

// Get logged-in user's profile
router.get("/me", protect, getMyProfile);

// Update logged-in user's profile
router.patch("/me", protect, updateMyProfile);

// Get public profile
router.get("/:handle", getProfileByHandle);

module.exports = router;