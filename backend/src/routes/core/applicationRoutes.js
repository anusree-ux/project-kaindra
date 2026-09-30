const express = require("express");
const {
  uploadResumeMiddleware,
  submitApplication,
  getApplications,
  deleteApplication,
} = require("../../controllers/core/applicationController");

const router = express.Router();

router.route("/")
  .get(getApplications)
  .post(uploadResumeMiddleware, submitApplication);

router.route("/:id")
  .delete(deleteApplication);

module.exports = router;
