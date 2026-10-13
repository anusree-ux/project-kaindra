const express = require("express");
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkInWishlist,
} = require("../../controllers/modasphere/wishlistController");
const { protect } = require("../../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getWishlist);
router.post("/:productId", addToWishlist);
router.delete("/:productId", removeFromWishlist);
router.get("/check/:productId", checkInWishlist);

module.exports = router;
