const mongoose = require("mongoose");
const NewsPost = require("../../models/core/NewsPost");
const { uploadNewsCoverImage } = require("../../services/core/newsImageUploadService");

const postFields = "title description content imageUrl publishedAt createdAt updatedAt";
const isValidPostId = (id) => mongoose.Types.ObjectId.isValid(id);

const getPublicPosts = async (req, res, next) => {
  try {
    const posts = await NewsPost.find({ status: "published" })
      .select(postFields)
      .sort({ publishedAt: -1, _id: -1 });

    res.status(200).json({
      status: "success",
      results: posts.length,
      data: { posts },
    });
  } catch (error) {
    next(error);
  }
};

const getPublicPostById = async (req, res, next) => {
  try {
    if (!isValidPostId(req.params.id)) {
      return res.status(404).json({
        status: "fail",
        message: "News post not found.",
      });
    }

    const post = await NewsPost.findOne({
      _id: req.params.id,
      status: "published",
    }).select(postFields);

    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "News post not found.",
      });
    }

    res.status(200).json({
      status: "success",
      data: { post },
    });
  } catch (error) {
    next(error);
  }
};

const getAdminPosts = async (req, res, next) => {
  try {
    const posts = await NewsPost.find()
      .sort({ updatedAt: -1, _id: -1 });

    res.status(200).json({
      status: "success",
      results: posts.length,
      data: { posts },
    });
  } catch (error) {
    next(error);
  }
};

const getNewsPostStats = async (req, res, next) => {
  try {
    const recentCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [totalPosts, publishedPosts, drafts, recentlyPublished] =
      await Promise.all([
        NewsPost.countDocuments(),
        NewsPost.countDocuments({ status: "published" }),
        NewsPost.countDocuments({ status: "draft" }),
        NewsPost.countDocuments({
          status: "published",
          publishedAt: { $gte: recentCutoff },
        }),
      ]);

    res.status(200).json({
      status: "success",
      data: { totalPosts, publishedPosts, drafts, recentlyPublished },
    });
  } catch (error) {
    next(error);
  }
};

const createNewsPost = async (req, res, next) => {
  try {
    const imageUrl = req.file
      ? await uploadNewsCoverImage(req.file.buffer)
      : req.body.imageUrl || "";
    const post = await NewsPost.create({
      title: req.body.title,
      description: req.body.description,
      content: req.body.content,
      imageUrl,
      status: "draft",
      createdBy: req.user._id,
    });

    res.status(201).json({
      status: "success",
      message: "News post created as a draft.",
      data: { post },
    });
  } catch (error) {
    next(error);
  }
};

const updateNewsPost = async (req, res, next) => {
  try {
    if (!isValidPostId(req.params.id)) {
      return res.status(404).json({
        status: "fail",
        message: "News post not found.",
      });
    }

    const imageUrl = req.file
      ? await uploadNewsCoverImage(req.file.buffer)
      : req.body.imageUrl || "";
    const post = await NewsPost.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          title: req.body.title,
          description: req.body.description,
          content: req.body.content,
          imageUrl,
        },
      },
      { new: true, runValidators: true }
    );

    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "News post not found.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "News post updated successfully.",
      data: { post },
    });
  } catch (error) {
    next(error);
  }
};

const updateNewsPostStatus = async (req, res, next) => {
  try {
    if (!isValidPostId(req.params.id)) {
      return res.status(404).json({
        status: "fail",
        message: "News post not found.",
      });
    }

    const post = await NewsPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "News post not found.",
      });
    }

    if (post.status !== req.body.status) {
      post.status = req.body.status;
      post.publishedAt =
        req.body.status === "published" ? new Date() : null;
      await post.save();
    }

    res.status(200).json({
      status: "success",
      message: req.body.status === "published"
        ? "News post published successfully."
        : "News post moved to drafts.",
      data: { post },
    });
  } catch (error) {
    next(error);
  }
};

const deleteNewsPost = async (req, res, next) => {
  try {
    if (!isValidPostId(req.params.id)) {
      return res.status(404).json({
        status: "fail",
        message: "News post not found.",
      });
    }

    const post = await NewsPost.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({
        status: "fail",
        message: "News post not found.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "News post deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicPosts,
  getPublicPostById,
  getAdminPosts,
  getNewsPostStats,
  createNewsPost,
  updateNewsPost,
  updateNewsPostStatus,
  deleteNewsPost,
};
