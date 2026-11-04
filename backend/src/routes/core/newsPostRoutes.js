const express = require("express");
const multer = require("multer");
const { protect, authorize } = require("../../middleware/authMiddleware");
const AppError = require("../../utils/AppError");
const {
  validateNewsPost,
  validateNewsPostStatus,
} = require("../../validators/newsPostValidator");
const {
  getPublicPosts,
  getPublicPostById,
  getAdminPosts,
  getNewsPostStats,
  createNewsPost,
  updateNewsPost,
  updateNewsPostStatus,
  deleteNewsPost,
} = require("../../controllers/core/newsPostController");

const router = express.Router();
const adminOnly = [protect, authorize("admin")];
const coverImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const extension = file.originalname.split(".").pop().toLowerCase();
    const allowedTypes = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
    };

    if (allowedTypes[extension] !== file.mimetype) {
      callback(new AppError("Cover image must be JPG, JPEG, PNG, or WebP.", 400));
      return;
    }

    callback(null, true);
  },
});
const uploadCoverImage = (req, res, next) => {
  coverImageUpload.single("image")(req, res, (error) => {
    if (!error) return next();
    if (
      error instanceof multer.MulterError &&
      error.code === "LIMIT_FILE_SIZE"
    ) {
      return next(new AppError("Cover images must be 5 MB or smaller.", 413));
    }
    return next(error);
  });
};

router.get("/admin/stats", ...adminOnly, getNewsPostStats);
router.get("/admin", ...adminOnly, getAdminPosts);
router.post(
  "/admin",
  ...adminOnly,
  uploadCoverImage,
  validateNewsPost,
  createNewsPost
);
router.put(
  "/admin/:id",
  ...adminOnly,
  uploadCoverImage,
  validateNewsPost,
  updateNewsPost
);
router.patch(
  "/admin/:id/status",
  ...adminOnly,
  validateNewsPostStatus,
  updateNewsPostStatus
);
router.delete("/admin/:id", ...adminOnly, deleteNewsPost);

router.get("/", getPublicPosts);
router.get("/:id", getPublicPostById);

module.exports = router;
