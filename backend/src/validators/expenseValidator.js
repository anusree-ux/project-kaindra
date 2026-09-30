const { body, validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

const allowedCategories = ["fuel", "accommodation", "food", "toll", "maintenance", "other"];

const createExpenseValidator = [
  body("category")
    .notEmpty()
    .withMessage("Expense category is required")
    .isIn(allowedCategories)
    .withMessage(`Category must be one of: ${allowedCategories.join(", ")}`),
  body("amount")
    .notEmpty()
    .withMessage("Expense amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a number greater than 0"),
  body("note")
    .optional()
    .isString()
    .withMessage("Note must be a string")
    .isLength({ max: 200 })
    .withMessage("Note cannot exceed 200 characters"),
];

const updateExpenseValidator = [
  body("category")
    .optional()
    .isIn(allowedCategories)
    .withMessage(`Category must be one of: ${allowedCategories.join(", ")}`),
  body("amount")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a number greater than 0"),
  body("note")
    .optional()
    .isString()
    .withMessage("Note must be a string")
    .isLength({ max: 200 })
    .withMessage("Note cannot exceed 200 characters"),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = errors.array().map((err) => ({
    field: err.param || err.path,
    message: err.msg,
  }));

  return next(new AppError("Validation failed", 400, extractedErrors));
};

module.exports = {
  createExpenseValidator,
  updateExpenseValidator,
  validate,
};
