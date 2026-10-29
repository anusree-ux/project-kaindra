const express = require("express");
const { getAdminStats } = require("../../controllers/core/adminStatsController");
const { adminLogin } = require("../../controllers/core/authController");
const { protect, authorize } = require("../../middleware/authMiddleware");

const router = express.Router();

// Public: authenticate an administrator.
router.post("/login", adminLogin);

// Admin only: access administrative statistics.
router.get("/stats", protect, authorize("admin"), getAdminStats);

module.exports = router;
