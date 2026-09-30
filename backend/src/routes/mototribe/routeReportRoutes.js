const express = require("express");
const { protect } = require("../../middleware/authMiddleware");
const {
  createRouteReportValidator,
  getRouteReportsValidator,
  validate,
} = require("../../validators/routeReportValidator");
const {
  createRouteReport,
  getRouteReports,
  markReportHelpful,
  deleteRouteReport,
} = require("../../controllers/mototribe/routeReportController");

const router = express.Router();

router.use(protect);

router.post("/route-reports", createRouteReportValidator, validate, createRouteReport);
router.get("/route-reports", getRouteReportsValidator, validate, getRouteReports);
router.post("/route-reports/:id/helpful", markReportHelpful);
router.delete("/route-reports/:id", deleteRouteReport);

module.exports = router;
