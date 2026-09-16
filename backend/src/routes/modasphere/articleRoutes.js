const express = require("express");

const {
  protect,
  authorize,
} = require("../../middleware/authMiddleware");

const articleValidator = require("../../validators/modasphere/articleValidator");

const {
  createArticle,
  getAdminArticles,
  getAdminArticleById,
  updateArticle,
  deleteArticle,
  publishArticle,
  unpublishArticle,
  getPublishedArticles,
  getPublishedArticleBySlug,
} = require("../../controllers/modasphere/articleController");

const router = express.Router();

/*
 * Admin routes
 */

router.post(
  "/admin",
  protect,
  authorize("admin"),
  articleValidator,
  createArticle
);

router.get(
  "/admin/all",
  protect,
  authorize("admin"),
  getAdminArticles
);

router.get(
  "/admin/:id",
  protect,
  authorize("admin"),
  getAdminArticleById
);

router.patch(
  "/admin/:id/publish",
  protect,
  authorize("admin"),
  publishArticle
);

router.patch(
  "/admin/:id/unpublish",
  protect,
  authorize("admin"),
  unpublishArticle
);

router.patch(
  "/admin/:id",
  protect,
  authorize("admin"),
  articleValidator,
  updateArticle
);

router.delete(
  "/admin/:id",
  protect,
  authorize("admin"),
  deleteArticle
);


/*
 * Public routes
 */

router.get("/", getPublishedArticles);

router.get("/:slug", getPublishedArticleBySlug);

module.exports = router;