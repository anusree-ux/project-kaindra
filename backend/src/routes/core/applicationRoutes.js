const express = require("express");
const {
  uploadResumeMiddleware,
  submitApplication,
  getApplications,
  deleteApplication,
} = require("../../controllers/core/applicationController");
const { protect, authorize } = require("../../middleware/authMiddleware");

const router = express.Router();

// Public: submit an application.
// Admin only: view applications and delete application records.
router.route("/")
  .get(protect, authorize("admin"), getApplications)
  .post(uploadResumeMiddleware, submitApplication);

router.route("/:id")
  .delete(protect, authorize("admin"), deleteApplication);

module.exports = router;
