const { body, validationResult } = require("express-validator");

const campaignUpdateFields = ["brand", "email", "title", "campaignType", "message"];

const validateCampaignUpdate = [
  body("brand")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Brand / Company is required")
    .isLength({ max: 150 })
    .withMessage("Brand / Company cannot exceed 150 characters"),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address"),
  body("campaignType")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Campaign type is required")
    .isLength({ max: 100 })
    .withMessage("Campaign type cannot exceed 100 characters"),
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Campaign title cannot be empty")
    .isLength({ max: 150 })
    .withMessage("Campaign title cannot exceed 150 characters"),
  body("message")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Campaign description is required")
    .isLength({ max: 3000 })
    .withMessage("Campaign description cannot exceed 3000 characters"),
  (req, res, next) => {
    const errors = validationResult(req);
    const hasEditableField = campaignUpdateFields.some((field) =>
      Object.prototype.hasOwnProperty.call(req.body, field)
    );

    if (!hasEditableField) {
      return res.status(400).json({
        success: false,
        message: "Provide a campaign title, type, or description to update.",
      });
    }

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

module.exports = validateCampaignUpdate;
