const express = require("express");

const {
  createDiscountCode,
  getDiscountCodes,
  getDiscountCodeById,
  updateDiscountCode,
  deleteDiscountCode,
  updateDiscountCodeStatus,
  validateDiscountCode,
} = require("../../controllers/modasphere/discountCodeController");

const { protect, authorize } = require("../../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/validate", validateDiscountCode);

router.use(authorize("admin"));

router.post("/", createDiscountCode);

router.get("/", getDiscountCodes);

router.get("/:id", getDiscountCodeById);

router.patch("/:id", updateDiscountCode);

router.patch("/:id/status", updateDiscountCodeStatus);

router.delete("/:id", deleteDiscountCode);

module.exports = router;