const express = require("express");
const {
  triggerSosAlert,
  resolveSosAlert,
  getRideSosAlerts,
} = require("../../controllers/mototribe/sosController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// Protect all SOS routes with JWT authentication
router.use(protect);

// POST /api/mototribe/rides/:id/sos - Trigger SOS alert
router.post("/rides/:id/sos", triggerSosAlert);

// GET /api/mototribe/rides/:id/sos - List all SOS alerts for a ride
router.get("/rides/:id/sos", getRideSosAlerts);

// PATCH /api/mototribe/rides/:id/sos/:alertId/resolve - Resolve an SOS alert
router.patch("/rides/:id/sos/:alertId/resolve", resolveSosAlert);

module.exports = router;
