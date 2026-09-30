const { body } = require("express-validator");

const brandValidator = [
  body("brandName")
    .trim()
    .notEmpty()
    .withMessage("Brand name is required")
    .isLength({ max: 150 })
    .withMessage("Brand name cannot exceed 150 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),

  body("logo")
    .optional()
    .trim()
    .isURL()
    .withMessage("Logo must be a valid URL"),

  body("website")
    .optional()
    .trim()
    .isURL()
    .withMessage("Website must be a valid URL"),

  body("industry")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Industry cannot exceed 100 characters"),

  body("location")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Location cannot exceed 100 characters"),
];

module.exports = brandValidator;