const express = require("express");
const { signup, login, getMe } = require("../../controllers/core/authController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", protect, getMe);

module.exports = router;
