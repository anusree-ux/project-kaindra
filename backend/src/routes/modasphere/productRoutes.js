const express = require("express");
const multer = require("multer");
const {
  createProduct,
  updateProduct,
  publishProduct,
  deleteProduct,
  getProducts,
  getProductById,
  getMySellerProducts,
} = require("../../controllers/modasphere/productController");
const { protect } = require("../../middleware/authMiddleware");
const { verifyAccessToken } = require("../../utils/jwt");
const User = require("../../models/core/User");
const AppError = require("../../utils/AppError");

// Multer memory storage configuration (up to 5 image uploads, 5MB max each)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new AppError("Only image files are allowed!", 400), false);
    }
  },
});

/**
 * Optional authentication middleware for public endpoints where owner-specific data is permitted
 */
const optionalProtect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        const currentUser = await User.findById(decoded.id);
        if (currentUser) {
          req.user = currentUser;
        }
      } catch (_) {
        // Ignore invalid tokens for optional auth
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

const router = express.Router();

// Public routes
router.get("/", getProducts);
router.get("/seller/me", protect, getMySellerProducts);
router.get("/:id", optionalProtect, getProductById);

// Protected seller routes
router.post("/", protect, upload.array("images", 5), createProduct);
router.patch("/:id", protect, upload.array("images", 5), updateProduct);
router.patch("/:id/publish", protect, publishProduct);
router.delete("/:id", protect, deleteProduct);

module.exports = router;
