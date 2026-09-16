const express = require("express");
const {
  postPresence,
  deletePresence,
  getRidersNearby,
  getRiderProfileCard,
} = require("../../controllers/mototribe/presenceController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// Protect all presence routes with JWT authentication
router.use(protect);

// POST /api/mototribe/presence — Upsert presence (location, status, visibility)
router.post("/presence", postPresence);

// DELETE /api/mototribe/presence — Remove presence (opt-out / offline)
router.delete("/presence", deletePresence);

// GET /api/mototribe/riders-nearby — Geospatial discovery query for nearby riders
router.get("/riders-nearby", getRidersNearby);

// GET /api/mototribe/riders/:userId/profile-card — Single rider's public profile card
router.get("/riders/:userId/profile-card", getRiderProfileCard);

module.exports = router;
