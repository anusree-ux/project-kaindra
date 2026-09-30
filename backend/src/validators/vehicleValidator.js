const { body, param, validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

const createVehicleValidationRules = [
  body("vehicleName")
    .notEmpty()
    .withMessage("Vehicle name is required.")
    .trim(),
  body("registrationNumber")
    .notEmpty()
    .withMessage("Registration number is required.")
    .trim(),
  body("mileageKmpl")
    .notEmpty()
    .withMessage("Mileage (km/L) is required.")
    .isFloat({ min: 0.1 })
    .withMessage("Mileage must be a positive number greater than 0."),
  body("fuelType")
    .optional()
    .isIn(["petrol", "diesel", "electric"])
    .withMessage("Fuel type must be petrol, diesel, or electric."),
];

const updateVehicleValidationRules = [
  param("id")
    .isMongoId()
    .withMessage("Invalid vehicle ID format."),
  body("vehicleName")
    .optional()
    .notEmpty()
    .withMessage("Vehicle name cannot be empty.")
    .trim(),
  body("registrationNumber")
    .optional()
    .notEmpty()
    .withMessage("Registration number cannot be empty.")
    .trim(),
  body("mileageKmpl")
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage("Mileage must be a positive number greater than 0."),
  body("fuelType")
    .optional()
    .isIn(["petrol", "diesel", "electric"])
    .withMessage("Fuel type must be petrol, diesel, or electric."),
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
  createVehicleValidationRules,
  updateVehicleValidationRules,
  validate,
};
