
const { body, validationResult } = require("express-validator");

const talesValidator = [
  body("title")
    .isString()
    .withMessage("Story title must be text")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Story title is required")
    .bail()
    .isLength({ max: 150 })
    .withMessage("Title cannot exceed 150 characters"),

  body("storyType")
    .isString()
    .withMessage("Story type must be text")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Story type is required")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Story type cannot exceed 100 characters"),

  body("message")
    .isString()
    .withMessage("Story message must be text")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Story message is required")
    .bail()
    .isLength({ min: 10, max: 5000 })
    .withMessage("Story message must be between 10 and 5000 characters")
    .bail()

    .custom((message) => {
      // Reject HTML markup
      if (/<\/?[a-z][^>]*>/i.test(message)) {
        throw new Error("HTML tags are not allowed in stories");
      }

      // Reject invalid control characters
      if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(message)) {
        throw new Error("Story contains invalid characters");
      }

      // Reject excessively repeated characters
      if (/(.)\1{14,}/i.test(message)) {
        throw new Error("Story contains excessive repeated characters");
      }

      // Detect URLs
      const urls =
        message.match(/https?:\/\/\S+|www\.\S+/gi) || [];

      // Detect common promotional spam phrases
      const spamPatterns = [
        /\bbuy now\b/gi,
        /\bbest offer\b/gi,
        /\bclick here\b/gi,
        /\bclaim your free reward\b/gi,
        /\bget your free reward\b/gi,
        /\bfree money\b/gi,
        /\bact now\b/gi,
        /\blimited time offer\b/gi,
        /\bguaranteed income\b/gi,
        /\bmake money fast\b/gi,
      ];

      const spamPhraseCount = spamPatterns.reduce(
        (count, pattern) =>
          count + (message.match(pattern) || []).length,
        0
      );

      // Reject repeated promotional phrases
      if (spamPhraseCount >= 2) {
        throw new Error(
          "Story appears to contain promotional spam"
        );
      }

      // Reject excessive links
      if (urls.length >= 2) {
        throw new Error(
          "Stories cannot contain multiple promotional links"
        );
      }

      // Reject a promotional link combined with spam language
      if (urls.length >= 1 && spamPhraseCount >= 1) {
        throw new Error(
          "Promotional links and spam content are not allowed"
        );
      }

      return true;
    }),


  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Story validation failed",
        errors: errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
        })),
      });
    }

    next();
  },
];

module.exports = talesValidator;