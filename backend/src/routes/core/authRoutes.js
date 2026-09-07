const express = require("express");
const {
  signup,
  login,
  refresh,
  logout,
  getMe,
} = require("../../controllers/core/authController");
const { protect } = require("../../middleware/authMiddleware");
const {
  signupValidationRules,
  loginValidationRules,
  validate,
} = require("../../validators/authValidator");

const router = express.Router();

router.post("/signup", signupValidationRules, validate, signup);
router.post("/login", loginValidationRules, validate, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", protect, getMe);

module.exports = router;
