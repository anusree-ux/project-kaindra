const express = require("express");
const {
  getCareers,
  createCareer,
  updateCareer,
  deleteCareer,
} = require("../../controllers/core/careerController");

const router = express.Router();

router.route("/")
  .get(getCareers)
  .post(createCareer);

router.route("/:id")
  .put(updateCareer)
  .delete(deleteCareer);

module.exports = router;
