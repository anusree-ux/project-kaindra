const express = require("express");
const {
  handleRazorpayWebhook,
  handleShiprocketWebhook,
} = require("../../controllers/modasphere/webhookController");

const router = express.Router();

router.post("/razorpay", handleRazorpayWebhook);
router.post("/delivery-updates", handleShiprocketWebhook);

module.exports = router;
