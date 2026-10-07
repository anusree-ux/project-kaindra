const express = require("express");
const {
  createProductionRequest,
  getSentProductionRequests,
  getReceivedProductionRequests,
  getProductionRequestById,
  submitQuote,
  respondToQuote,
  startProduction,
  completeProduction,
  cancelProductionRequest,
} = require("../../controllers/modasphere/productionRequestController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// Static / collection routes defined BEFORE parameterized ones
router.post("/production-requests", createProductionRequest);
router.get("/production-requests/sent", getSentProductionRequests);
router.get("/production-requests/received", getReceivedProductionRequests);

// Parameterized routes
router.get("/production-requests/:id", getProductionRequestById);
router.patch("/production-requests/:id/quote", submitQuote);
router.patch("/production-requests/:id/respond", respondToQuote);
router.patch("/production-requests/:id/start", startProduction);
router.patch("/production-requests/:id/complete", completeProduction);
router.patch("/production-requests/:id/cancel", cancelProductionRequest);

module.exports = router;
