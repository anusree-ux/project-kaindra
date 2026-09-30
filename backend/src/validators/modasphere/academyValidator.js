const { body } = require("express-validator");

const academyValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Course title is required")
    .isLength({ max: 200 })
    .withMessage("Course title cannot exceed 200 characters"),

  body("subtitle")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Course subtitle cannot exceed 300 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Course description is required"),

  body("shortDescription")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage(
      "Course short description cannot exceed 500 characters"
    ),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Course category is required"),

  body("level")
    .optional()
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage(
      "Course level must be beginner, intermediate, or advanced"
    ),

  body("coverImage")
    .optional()
    .trim(),

  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array"),

  body("status")
    .optional()
    .isIn(["draft", "published"])
    .withMessage("Status must be either draft or published"),

  body("modules")
    .isArray()
    .withMessage("Modules must be an array"),

  body("modules.*.title")
    .trim()
    .notEmpty()
    .withMessage("Module title is required"),

  body("modules.*.description")
    .optional()
    .trim(),

  body("modules.*.content")
    .trim()
    .notEmpty()
    .withMessage("Module content is required"),

  body("modules.*.type")
    .optional()
    .isIn(["video", "article", "quiz", "task"])
    .withMessage(
      "Module type must be video, article, quiz, or task"
    ),

  body("modules.*.durationMinutes")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Module duration must be at least 1 minute"),

  body("modules.*.order")
    .isInt({ min: 1 })
    .withMessage("Module order must be at least 1"),

  body("modules.*.isRequired")
    .optional()
    .isBoolean()
    .withMessage("Module isRequired must be a boolean"),
];

const academyUpdateValidator = [
  body("title")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Course title cannot exceed 200 characters"),

  body("subtitle")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Course subtitle cannot exceed 300 characters"),

  body("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Course description cannot be empty"),

  body("shortDescription")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage(
      "Course short description cannot exceed 500 characters"
    ),

  body("category")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Course category cannot be empty"),

  body("level")
    .optional()
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage(
      "Course level must be beginner, intermediate, or advanced"
    ),

  body("coverImage")
    .optional()
    .trim(),

  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array"),

  body("modules")
    .optional()
    .isArray()
    .withMessage("Modules must be an array"),

  body("modules.*.title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Module title cannot be empty"),

  body("modules.*.description")
    .optional()
    .trim(),

  body("modules.*.content")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Module content cannot be empty"),

  body("modules.*.type")
    .optional()
    .isIn(["video", "article", "quiz", "task"])
    .withMessage(
      "Module type must be video, article, quiz, or task"
    ),

  body("modules.*.durationMinutes")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Module duration must be at least 1 minute"),

  body("modules.*.order")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Module order must be at least 1"),

  body("modules.*.isRequired")
    .optional()
    .isBoolean()
    .withMessage("Module isRequired must be a boolean"),

  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be a boolean"),
];

module.exports = {
  academyValidator,
  academyUpdateValidator
};