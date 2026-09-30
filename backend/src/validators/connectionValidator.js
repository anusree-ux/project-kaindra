const { body, param, validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

const sendRequestValidationRules = [
  body("toUserId")
    .notEmpty()
    .withMessage("Target user ID (toUserId) is required.")
    .isMongoId()
    .withMessage("Invalid user ID format."),
];

const respondValidationRules = [
  param("id")
    .isMongoId()
    .withMessage("Invalid connection request ID format."),
  body("action")
    .notEmpty()
    .withMessage("Action is required.")
    .isIn(["accept", "ignore"])
    .withMessage("Action must be either 'accept' or 'ignore'."),
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
  sendRequestValidationRules,
  respondValidationRules,
  validate,
};
