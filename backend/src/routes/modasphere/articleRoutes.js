const express = require("express");

const {
  createArticle,
  updateArticle,
  publishArticle,
  deleteArticle,
  getAllArticles,
  getArticlesByAuthor,
  getArticleBySlug,
} = require("../../controllers/modasphere/articleController");

const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.get("/", getAllArticles);
router.get("/author/:authorId", getArticlesByAuthor);
router.get("/:slug", getArticleBySlug);

// Author routes
router.post("/", protect, createArticle);
router.patch("/:id", protect, updateArticle);
router.patch("/:id/publish", protect, publishArticle);
router.delete("/:id", protect, deleteArticle);

module.exports = router;