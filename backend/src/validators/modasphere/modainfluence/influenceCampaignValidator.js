const { body } = require("express-validator");

const influenceCampaignValidator = [
  body("brand")
    .trim()
    .notEmpty()
    .withMessage("Brand / Company is required")
    .isLength({ max: 150 })
    .withMessage("Brand / Company cannot exceed 150 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email address is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),

  body("campaignType")
    .trim()
    .notEmpty()
    .withMessage("Campaign type is required")
    .isLength({ max: 100 })
    .withMessage("Campaign type cannot exceed 100 characters"),

  body("message")
    .trim()
    .notEmpty()
    .withMessage("Campaign description is required")
    .isLength({ max: 3000 })
    .withMessage("Campaign description cannot exceed 3000 characters"),
];

module.exports = influenceCampaignValidator;