const express = require("express");
const {
  getShipmentByOrderId,
} = require("../../controllers/modasphere/shipmentController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/:orderId", getShipmentByOrderId);

module.exports = router;
