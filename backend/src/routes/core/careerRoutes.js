const express = require("express");
const {
  getCareers,
  createCareer,
  updateCareer,
  deleteCareer,
} = require("../../controllers/core/careerController");
const { protect, authorize } = require("../../middleware/authMiddleware");

const router = express.Router();

// Public: browse career listings.
router.get("/", getCareers);

// Admin only: create, update, and delete career listings.
router.post("/", protect, authorize("admin"), createCareer);
router.put("/:id", protect, authorize("admin"), updateCareer);
router.delete("/:id", protect, authorize("admin"), deleteCareer);

module.exports = router;
