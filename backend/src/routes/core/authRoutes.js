const express = require("express");
const {
  adminLogin,
  googleAuth,
  refresh,
  logout,
  getMe,
} = require("../../controllers/core/authController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// Primary authentication endpoint: Passwordless Google OAuth
router.post("/google", googleAuth);

// Admin login endpoint using dedicated 'admins' table
router.post("/login", adminLogin);
router.post("/admin/login", adminLogin);

// Decommissioned password signup guard
router.post("/signup", (req, res) => {
  res.status(400).json({
    status: "fail",
    message: "Email and password signup has been completely removed. Please authenticate with Google.",
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
