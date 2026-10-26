const { body, validationResult } = require("express-validator");

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

  body("title")
    .trim()
    .notEmpty()
    .withMessage("Campaign title is required")
    .isLength({ max: 150 })
    .withMessage("Campaign title cannot exceed 150 characters"),

  body("message")
    .trim()
    .notEmpty()
    .withMessage("Campaign description is required")
    .isLength({ max: 3000 })
    .withMessage("Campaign description cannot exceed 3000 characters"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }
    return next();
  },
];

module.exports = influenceCampaignValidator;
