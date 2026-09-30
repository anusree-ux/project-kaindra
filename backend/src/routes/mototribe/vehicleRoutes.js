const express = require("express");
const { protect } = require("../../middleware/authMiddleware");
const {
  createVehicle,
  getMeVehicles,
  updateVehicle,
  deleteVehicle,
} = require("../../controllers/mototribe/vehicleController");
const {
  createVehicleValidationRules,
  updateVehicleValidationRules,
  validate,
} = require("../../validators/vehicleValidator");

const router = express.Router();

router.use(protect);

router.post("/vehicles", createVehicleValidationRules, validate, createVehicle);
router.get("/vehicles/me", getMeVehicles);
router.patch("/vehicles/:id", updateVehicleValidationRules, validate, updateVehicle);
router.delete("/vehicles/:id", deleteVehicle);

module.exports = router;
