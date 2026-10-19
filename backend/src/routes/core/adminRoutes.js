const express = require("express");
const { getAdminStats } = require("../../controllers/core/adminStatsController");
const { adminLogin } = require("../../controllers/core/authController");

const router = express.Router();

router.post("/login", adminLogin);
router.get("/stats", getAdminStats);

module.exports = router;
