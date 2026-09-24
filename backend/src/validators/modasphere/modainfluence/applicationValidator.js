const { body } = require("express-validator");

const applicationValidator = [
  body("message")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Application message cannot exceed 2000 characters"),
];

module.exports = applicationValidator;