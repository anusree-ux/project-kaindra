const { body, validationResult } = require("express-validator");
const AppError = require("../../utils/AppError");

const riderProfileValidationRules = [
  body("vehicleNumber")
    .trim()
    .notEmpty()
    .withMessage("Vehicle number is required"),
  body("emergencyContacts")
    .optional()
    .isArray({ max: 3 })
    .withMessage("Emergency contacts must be an array of at most 3 contacts"),
  body("emergencyContacts.*.name")
    .trim()
    .notEmpty()
    .withMessage("Emergency contact name is required"),
  body("emergencyContacts.*.phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("Emergency contact phone number is required"),
];

const createRideValidationRules = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Ride title is required")
    .isLength({ min: 3, max: 250 })
    .withMessage("Title must be between 3 and 250 characters"),
  body("origin")
    .trim()
    .notEmpty()
    .withMessage("Origin is required"),
  body("destination")
    .trim()
    .notEmpty()
    .withMessage("Destination is required"),
  body("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Start date must be a valid ISO8601 date string")
    .custom((value) => {
      const rideTime = new Date(value).getTime();
      if (isNaN(rideTime)) {
        throw new Error("Invalid start date format");
      }
      // 10-minute buffer for local clock differences
      if (rideTime < Date.now() - 10 * 60 * 1000) {
        throw new Error("Start date and time must be in the future");
      }
      return true;
    }),
  body("distanceKm")
    .notEmpty()
    .withMessage("Distance in Km is required")
    .isFloat({ gt: 0 })
    .withMessage("Distance must be a positive number"),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = errors.array().map((err) => ({
    field: err.path,
    message: err.msg,
  }));

  return next(new AppError("Validation failed", 400, extractedErrors));
};

module.exports = {
  riderProfileValidationRules,
  createRideValidationRules,
  validate,
};
