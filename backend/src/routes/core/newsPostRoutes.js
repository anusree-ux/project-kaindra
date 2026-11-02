const express = require("express");
const { protect, authorize } = require("../../middleware/authMiddleware");
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

router.get("/admin/stats", ...adminOnly, getNewsPostStats);
router.get("/admin", ...adminOnly, getAdminPosts);
router.post("/admin", ...adminOnly, validateNewsPost, createNewsPost);
router.put("/admin/:id", ...adminOnly, validateNewsPost, updateNewsPost);
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
