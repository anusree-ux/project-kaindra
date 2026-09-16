const ModaArticle = require("../../models/modasphere/ModaArticle");

// Create article
const createArticle = async (req, res) => {
  try {
    const { title, excerpt, content, coverImage, category, tags, status } =
      req.body;

    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existingArticle = await ModaArticle.findOne({ slug });

    if (existingArticle) {
      return res.status(409).json({
        success: false,
        message: "An article with this title already exists",
      });
    }

    const article = await ModaArticle.create({
      title,
      slug,
      excerpt,
      content,
      coverImage,
      category,
      tags,
      status: status || "draft",
      createdBy: req.user._id,
      publishedAt: status === "published" ? new Date() : null,
    });

    res.status(201).json({
      success: true,
      message: "Article created successfully",
      article,
    });
  } catch (error) {
    console.error("Create article error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create article",
    });
  }
};

// Get all articles for admin
const getAdminArticles = async (req, res) => {
  try {
    const articles = await ModaArticle.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error("Get admin articles error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch articles",
    });
  }
};

// Get single article for admin
const getAdminArticleById = async (req, res) => {
  try {
    const article = await ModaArticle.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    res.status(200).json({
      success: true,
      article,
    });
  } catch (error) {
    console.error("Get admin article error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch article",
    });
  }
};

// Update article
const updateArticle = async (req, res) => {
  try {
    const { title, excerpt, content, coverImage, category, tags, status } =
      req.body;

    const article = await ModaArticle.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    if (title && title !== article.title) {
      const newSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const existingArticle = await ModaArticle.findOne({
        slug: newSlug,
        _id: { $ne: article._id },
      });

      if (existingArticle) {
        return res.status(409).json({
          success: false,
          message: "An article with this title already exists",
        });
      }

      article.title = title;
      article.slug = newSlug;
    }

    if (excerpt !== undefined) article.excerpt = excerpt;
    if (content !== undefined) article.content = content;
    if (coverImage !== undefined) article.coverImage = coverImage;
    if (category !== undefined) article.category = category;
    if (tags !== undefined) article.tags = tags;

    if (status !== undefined) {
      article.status = status;

      if (status === "published" && !article.publishedAt) {
        article.publishedAt = new Date();
      }

      if (status === "draft") {
        article.publishedAt = null;
      }
    }

    await article.save();

    res.status(200).json({
      success: true,
      message: "Article updated successfully",
      article,
    });
  } catch (error) {
    console.error("Update article error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update article",
    });
  }
};

// Delete article
const deleteArticle = async (req, res) => {
  try {
    const article = await ModaArticle.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    await article.deleteOne();

    res.status(200).json({
      success: true,
      message: "Article deleted successfully",
    });
  } catch (error) {
    console.error("Delete article error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete article",
    });
  }
};

// Publish article
const publishArticle = async (req, res) => {
  try {
    const article = await ModaArticle.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    article.status = "published";
    article.publishedAt = new Date();

    await article.save();

    res.status(200).json({
      success: true,
      message: "Article published successfully",
      article,
    });
  } catch (error) {
    console.error("Publish article error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to publish article",
    });
  }
};

// Unpublish article
const unpublishArticle = async (req, res) => {
  try {
    const article = await ModaArticle.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    article.status = "draft";
    article.publishedAt = null;

    await article.save();

    res.status(200).json({
      success: true,
      message: "Article unpublished successfully",
      article,
    });
  } catch (error) {
    console.error("Unpublish article error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to unpublish article",
    });
  }
};

// Get published articles for public
const getPublishedArticles = async (req, res) => {
  try {
    const articles = await ModaArticle.find({ status: "published" })
      .select("-createdBy")
      .sort({ publishedAt: -1 });

    res.status(200).json({
      success: true,
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error("Get published articles error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch published articles",
    });
  }
};

// Get published article by slug
const getPublishedArticleBySlug = async (req, res) => {
  try {
    const article = await ModaArticle.findOne({
      slug: req.params.slug,
      status: "published",
    }).select("-createdBy");

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    res.status(200).json({
      success: true,
      article,
    });
  } catch (error) {
    console.error("Get published article error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch article",
    });
  }
};

module.exports = {
  createArticle,
  getAdminArticles,
  getAdminArticleById,
  updateArticle,
  deleteArticle,
  publishArticle,
  unpublishArticle,
  getPublishedArticles,
  getPublishedArticleBySlug,
};