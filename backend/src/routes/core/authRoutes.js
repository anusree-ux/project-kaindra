const express = require("express");
const {
  googleAuth,
  refresh,
  logout,
  getMe,
} = require("../../controllers/core/authController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// Primary authentication endpoint: Passwordless Google OAuth
router.post("/google", googleAuth);

// Explicit guard handlers for deprecated password/phone authentication
router.post("/signup", (req, res) => {
  res.status(400).json({
    status: "fail",
    message: "Email and password signup has been completely removed. Please authenticate with Google.",
  });
});

router.post("/login", (req, res) => {
  res.status(400).json({
    status: "fail",
    message: "Email and password login has been completely removed. Please authenticate with Google.",
  });
});

router.post("/verify-otp", (req, res) => {
  res.status(400).json({
    status: "fail",
    message: "Phone and OTP verification has been removed. Please authenticate with Google.",
  });
});

router.post("/resend-otp", (req, res) => {
  res.status(400).json({
    status: "fail",
    message: "Phone and OTP verification has been removed. Please authenticate with Google.",
  });
});

router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", protect, getMe);

module.exports = router;
