const { body } = require("express-validator");

const articleValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Article title is required")
    .isLength({ max: 200 })
    .withMessage("Article title cannot exceed 200 characters"),

  body("excerpt")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Article excerpt cannot exceed 500 characters"),

  body("content")
    .trim()
    .notEmpty()
    .withMessage("Article content is required"),

  body("coverImage")
    .optional()
    .trim(),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Article category is required"),

  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array"),

  body("status")
    .optional()
    .isIn(["draft", "published"])
    .withMessage("Status must be either draft or published"),
];

module.exports = articleValidator;