const { body, query, validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

const allowedReportTypes = [
  "road_condition",
  "warning",
  "fuel_availability",
  "hotel_tip",
  "restaurant_tip",
  "scenic_spot",
  "general_tip",
];

const createRouteReportValidator = [
  body("origin")
    .notEmpty()
    .withMessage("Origin is required")
    .trim(),
  body("destination")
    .notEmpty()
    .withMessage("Destination is required")
    .trim(),
  body("reportType")
    .notEmpty()
    .withMessage("Report type is required")
    .isIn(allowedReportTypes)
    .withMessage(`Report type must be one of: ${allowedReportTypes.join(", ")}`),
  body("content")
    .notEmpty()
    .withMessage("Content is required")
    .isString()
    .withMessage("Content must be a string")
    .isLength({ max: 500 })
    .withMessage("Content cannot exceed 500 characters")
    .trim(),
];

const getRouteReportsValidator = [
  query("origin")
    .notEmpty()
    .withMessage("Origin query parameter is required")
    .trim(),
  query("destination")
    .notEmpty()
    .withMessage("Destination query parameter is required")
    .trim(),
  query("reportType")
    .optional()
    .isIn(allowedReportTypes)
    .withMessage(`Report type must be one of: ${allowedReportTypes.join(", ")}`),
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
  createRouteReportValidator,
  getRouteReportsValidator,
  validate,
};
