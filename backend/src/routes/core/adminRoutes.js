const express = require("express");
const { getAdminStats } = require("../../controllers/core/adminStatsController");

const router = express.Router();

router.get("/stats", getAdminStats);

module.exports = router;
