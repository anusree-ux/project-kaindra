const { body, validationResult } = require("express-validator");

const validateNewsPost = [
  body("title")
    .isString()
    .withMessage("Title must be text")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .bail()
    .isLength({ max: 150 })
    .withMessage("Title cannot exceed 150 characters"),
  body("description")
    .isString()
    .withMessage("Description must be text")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .bail()
    .isLength({ max: 300 })
    .withMessage("Description cannot exceed 300 characters"),
  body("content")
    .isString()
    .withMessage("Content must be text")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .bail()
    .isLength({ max: 50000 })
    .withMessage("Content cannot exceed 50000 characters"),
  body("imageUrl")
    .optional({ values: "falsy" })
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Image URL must be a valid HTTP or HTTPS URL"),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "fail",
        message: "News post validation failed",
        errors: errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
        })),
      });
    }

    next();
  },
];

const validateNewsPostStatus = [
  body("status")
    .isIn(["draft", "published"])
    .withMessage("Status must be either 'draft' or 'published'"),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "fail",
        message: "News post status validation failed",
        errors: errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
        })),
      });
    }

    next();
  },
];

module.exports = { validateNewsPost, validateNewsPostStatus };
