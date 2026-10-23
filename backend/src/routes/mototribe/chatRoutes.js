const express = require("express");
const {
  getChatHistory,
  sendChatMessage,
} = require("../../controllers/mototribe/chatController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/rides/:id/chat/history", getChatHistory);
router.post("/rides/:id/chat", sendChatMessage);

module.exports = router;
