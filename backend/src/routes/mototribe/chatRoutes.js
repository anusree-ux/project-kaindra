const express = require("express");
const { getChatHistory } = require("../../controllers/mototribe/chatController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/rides/:id/chat/history", getChatHistory);

module.exports = router;
