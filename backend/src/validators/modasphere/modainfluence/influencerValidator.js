const { body } = require("express-validator");

const influencerValidator = [
  body("displayName")
    .trim()
    .notEmpty()
    .withMessage("Display name is required")
    .isLength({ max: 100 })
    .withMessage("Display name cannot exceed 100 characters"),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Bio cannot exceed 1000 characters"),

  body("profileImage")
    .optional()
    .trim()
    .isURL()
    .withMessage("Profile image must be a valid URL"),

  body("location")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Location cannot exceed 100 characters"),

  body("categories")
    .optional()
    .isArray()
    .withMessage("Categories must be an array"),

  body("followers")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Followers must be a non-negative number"),

  body("socialLinks.instagram")
    .optional()
    .trim()
    .isURL()
    .withMessage("Instagram link must be a valid URL"),

  body("socialLinks.youtube")
    .optional()
    .trim()
    .isURL()
    .withMessage("YouTube link must be a valid URL"),

  body("socialLinks.tiktok")
    .optional()
    .trim()
    .isURL()
    .withMessage("TikTok link must be a valid URL"),

  body("socialLinks.website")
    .optional()
    .trim()
    .isURL()
    .withMessage("Website must be a valid URL"),
];

module.exports = influencerValidator;