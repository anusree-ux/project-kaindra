const express = require("express");
const {
  getAgoraToken,
  getCallStatus,
} = require("../../controllers/mototribe/agoraController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// Protect all Agora routes with JWT authentication
router.use(protect);

// GET /api/mototribe/rides/:id/call-status - Get active call status
router.get("/rides/:id/call-status", getCallStatus);

// POST /api/mototribe/agora/token - Generate Agora RTC token (pass rideId in request body)
router.post("/agora/token", getAgoraToken);

// POST /api/mototribe/rides/:id/agora-token - Generate Agora RTC token (pass rideId in URL parameter)
router.post("/rides/:id/agora-token", getAgoraToken);

module.exports = router;
