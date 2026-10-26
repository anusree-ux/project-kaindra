const { body, validationResult } = require("express-validator");

const validateResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  return next();
};

const createCreatorProfileValidator = [
  body("displayName")
    .trim()
    .notEmpty()
    .withMessage("Creator name is required")
    .isLength({ max: 100 })
    .withMessage("Creator name cannot exceed 100 characters"),
  body("contactEmail")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid contact email"),
  body("category").optional().trim().isLength({ max: 100 }),
  body("bio").optional().trim().isLength({ max: 2000 }),
  body("website").optional({ checkFalsy: true }).trim().isURL(),
  body("socialLinks.instagram").optional().trim().isLength({ max: 500 }),
  body("socialLinks.tiktok").optional().trim().isLength({ max: 500 }),
  body("socialLinks.youtube").optional().trim().isLength({ max: 500 }),
  validateResults,
];

const updateCreatorProfileValidator = [
  body("displayName").optional().trim().notEmpty().isLength({ max: 100 }),
  body("contactEmail").optional().trim().isEmail(),
  body("category").optional().trim().isLength({ max: 100 }),
  body("bio").optional().trim().isLength({ max: 2000 }),
  body("website").optional({ checkFalsy: true }).trim().isURL(),
  body("socialLinks.instagram").optional().trim().isLength({ max: 500 }),
  body("socialLinks.tiktok").optional().trim().isLength({ max: 500 }),
  body("socialLinks.youtube").optional().trim().isLength({ max: 500 }),
  validateResults,
];

module.exports = {
  createCreatorProfileValidator,
  updateCreatorProfileValidator,
};
