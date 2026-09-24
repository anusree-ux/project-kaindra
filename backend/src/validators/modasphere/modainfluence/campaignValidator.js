const { body } = require("express-validator");

const campaignValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Campaign title is required")
    .isLength({ max: 200 })
    .withMessage("Campaign title cannot exceed 200 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Campaign description is required")
    .isLength({ max: 3000 })
    .withMessage("Campaign description cannot exceed 3000 characters"),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Campaign category is required")
    .isLength({ max: 100 })
    .withMessage("Campaign category cannot exceed 100 characters"),

  body("platforms")
    .optional()
    .isArray()
    .withMessage("Platforms must be an array"),

  body("deliverables")
    .optional()
    .isArray()
    .withMessage("Deliverables must be an array"),

  body("budget")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Budget must be a non-negative number"),

  body("requirements")
    .optional()
    .isArray()
    .withMessage("Requirements must be an array"),

  body("applicationDeadline")
    .optional()
    .isISO8601()
    .withMessage("Application deadline must be a valid date"),

  body("campaignStartDate")
    .optional()
    .isISO8601()
    .withMessage("Campaign start date must be a valid date"),

  body("campaignEndDate")
    .optional()
    .isISO8601()
    .withMessage("Campaign end date must be a valid date"),

  body("status")
    .optional()
    .isIn(["draft", "published", "closed"])
    .withMessage("Status must be draft, published, or closed"),
];

module.exports = campaignValidator;