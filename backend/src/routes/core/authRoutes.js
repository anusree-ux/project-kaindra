const express = require("express");
const {
  signup,
  login,
  refresh,
  logout,
  getMe,
  verifyOtp,
  resendOtp,
} = require("../../controllers/core/authController");
const { protect } = require("../../middleware/authMiddleware");
const {
  signupValidationRules,
  loginValidationRules,
  verifyOtpValidationRules,
  resendOtpValidationRules,
  validate,
} = require("../../validators/authValidator");

const router = express.Router();

router.post("/signup", signupValidationRules, validate, signup);
router.post("/login", loginValidationRules, validate, login);
router.post("/verify-otp", verifyOtpValidationRules, validate, verifyOtp);
router.post("/resend-otp", resendOtpValidationRules, validate, resendOtp);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", protect, getMe);

module.exports = router;
