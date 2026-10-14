const express = require("express");
const { handleRazorpayWebhook } = require("../../controllers/modasphere/webhookController");

const router = express.Router();

router.post("/razorpay", handleRazorpayWebhook);

module.exports = router;
