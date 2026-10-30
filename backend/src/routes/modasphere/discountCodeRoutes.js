const express = require("express");

const {
  createDiscountCode,
  getDiscountCodes,
  getDiscountCodeById,
  updateDiscountCode,
  deleteDiscountCode,
  updateDiscountCodeStatus,
  validateDiscountCode,
  getSuggestedDiscounts,
} = require("../../controllers/modasphere/discountCodeController");

const { protect, authorize } = require("../../middleware/authMiddleware");
const { verifyAccessToken } = require("../../utils/jwt");
const User = require("../../models/core/User");
const Admin = require("../../models/core/Admin");

const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        let currentUser = await Admin.findById(decoded.id);
        if (!currentUser) {
          currentUser = await User.findById(decoded.id);
        }
        if (currentUser) {
          req.user = currentUser;
        }
      } catch (_) {
        // Continue even if token is invalid
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

const router = express.Router();

// Buyer routes
router.get("/suggest", optionalAuth, getSuggestedDiscounts);
router.post("/validate", optionalAuth, validateDiscountCode);

// Seller & Admin management routes
router.use(protect);
router.use(authorize("admin", "user", "moderator"));

router.post("/", createDiscountCode);
router.get("/", getDiscountCodes);
router.get("/:id", getDiscountCodeById);
router.patch("/:id", updateDiscountCode);
router.patch("/:id/status", updateDiscountCodeStatus);
router.delete("/:id", deleteDiscountCode);

module.exports = router;