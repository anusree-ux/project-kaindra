const express = require("express");
const {
  updateShipmentStatus,
  getShipmentByOrderId,
} = require("../../controllers/modasphere/shipmentController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.patch("/:orderId/status", updateShipmentStatus);
router.get("/:orderId", getShipmentByOrderId);

module.exports = router;
