const express = require("express");
const { protect } = require("../../middleware/authMiddleware");
const {
  sendRequest,
  respond,
  getConnections,
  getIncoming,
  getOutgoing,
} = require("../../controllers/core/connectionController");
const {
  sendRequestValidationRules,
  respondValidationRules,
  validate,
} = require("../../validators/connectionValidator");

const router = express.Router();

router.use(protect);

router.post("/connections/request", sendRequestValidationRules, validate, sendRequest);
router.patch("/connections/requests/:id/respond", respondValidationRules, validate, respond);
router.get("/connections", getConnections);
router.get("/connections/requests/incoming", getIncoming);
router.get("/connections/requests/outgoing", getOutgoing);

module.exports = router;
