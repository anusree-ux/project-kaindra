const express = require("express");
const {
  getMyPassport,
} = require("../../controllers/mototribe/passportController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// Protect all passport routes with JWT authentication
router.use(protect);

// GET /api/mototribe/rider-profile/me/passport - Get user's ride passport and achievements
router.get("/rider-profile/me/passport", getMyPassport);

module.exports = router;
