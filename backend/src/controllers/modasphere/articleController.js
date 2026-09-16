const ModaArticle = require("../../models/modasphere/ModaArticle");

// Create an article
const createArticle = async (req, res) => {
  try {
    const {
      title,
      slug,
      content,
      coverImage,
      category,
      tags,
    } = req.body;

    const existingArticle = await ModaArticle.findOne({ slug });

    if (existingArticle) {
      return res.status(400).json({
        success: false,
        message: "Article slug already exists",
      });
    }

    const article = await ModaArticle.create({
      title,
      slug,
      content,
      coverImage,
      authorId: req.user._id,
      category,
      tags,
      status: "draft",
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
      error: error.message,
    });
  }
};

// Update an article
const updateArticle = async (req, res) => {
  try {
    const allowedFields = [
      "title",
      "slug",
      "content",
      "coverImage",
      "category",
      "tags",
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.slug) {
      updates.slug = updates.slug.toLowerCase();

      const existingArticle = await ModaArticle.findOne({
        slug: updates.slug,
        _id: { $ne: req.params.id },
      });

      if (existingArticle) {
        return res.status(400).json({
          success: false,
          message: "Article slug already exists",
        });
      }
    }

    const article = await ModaArticle.findOneAndUpdate(
      {
        _id: req.params.id,
        authorId: req.user._id,
      },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found or you are not the author",
      });
    }

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
      error: error.message,
    });
  }
};

// Publish an article
const publishArticle = async (req, res) => {
  try {
    const article = await ModaArticle.findOneAndUpdate(
      {
        _id: req.params.id,
        authorId: req.user._id,
      },
      {
        status: "published",
        publishedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found or you are not the author",
      });
    }

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
      error: error.message,
    });
  }
};

// Delete an article
const deleteArticle = async (req, res) => {
  try {
    const article = await ModaArticle.findOneAndDelete({
      _id: req.params.id,
      authorId: req.user._id,
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found or you are not the author",
      });
    }

    res.status(200).json({
      success: true,
      message: "Article deleted successfully",
    });
  } catch (error) {
    console.error("Delete article error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete article",
      error: error.message,
    });
  }
};

// Get all published articles
const getAllArticles = async (req, res) => {
  try {
    const articles = await ModaArticle.find({
      status: "published",
    })
      .populate("authorId", "name email")
      .sort({ publishedAt: -1 });

    res.status(200).json({
      success: true,
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error("Get articles error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch articles",
      error: error.message,
    });
  }
};

// Get articles by author
const getArticlesByAuthor = async (req, res) => {
  try {
    const articles = await ModaArticle.find({
      authorId: req.params.authorId,
      status: "published",
    })
      .populate("authorId", "name email")
      .sort({ publishedAt: -1 });

    res.status(200).json({
      success: true,
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error("Get author articles error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch author articles",
      error: error.message,
    });
  }
};

// Get a published article by slug
const getArticleBySlug = async (req, res) => {
  try {
    const article = await ModaArticle.findOne({
      slug: req.params.slug.toLowerCase(),
      status: "published",
    }).populate("authorId", "name email");

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
    console.error("Get article error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch article",
      error: error.message,
    });
  }
};

module.exports = {
  createArticle,
  updateArticle,
  publishArticle,
  deleteArticle,
  getAllArticles,
  getArticlesByAuthor,
  getArticleBySlug,
};