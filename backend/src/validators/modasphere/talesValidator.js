const { body } = require("express-validator");

const talesValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),

  body("storyType")
    .trim()
    .notEmpty()
    .withMessage("Story type is required")
    .isLength({ max: 100 })
    .withMessage("Story type cannot exceed 100 characters"),

  body("message")
    .trim()
    .notEmpty()
    .withMessage("Story message is required"),
];

module.exports = talesValidator;