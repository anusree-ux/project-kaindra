const express = require("express");

const {
  createOrganization,
  getMyOrganizations,
  getOrganizationBySlug,
  updateOrganization,
} = require("../../controllers/modasphere/organizationController");

const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// Create organization
router.post("/", protect, createOrganization);

// Get organizations owned by logged-in user
router.get("/me", protect, getMyOrganizations);

// Get organization by slug
router.get("/:slug", getOrganizationBySlug);

// Update organization
router.patch("/:id", protect, updateOrganization);

module.exports = router;