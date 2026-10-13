const express = require("express");
const {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../../controllers/modasphere/cartController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

// All cart endpoints require user authentication
router.use(protect);

router.get("/", getCart);
router.delete("/", clearCart);
router.post("/items", addItemToCart);
router.patch("/items/:productId", updateCartItem);
router.delete("/items/:productId", removeCartItem);

module.exports = router;
