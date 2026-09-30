const express = require("express");

const {
  protect,
  authorize,
} = require("../../middleware/authMiddleware");

const talesValidator = require("../../validators/modasphere/talesValidator");

const {
  createTale,
  getAdminTales,
  getAdminTaleById,
  updateTaleStatus,
  deleteTale,
} = require("../../controllers/modasphere/talesController");

const router = express.Router();

/*
 * Public routes
 */

// Submit a story
router.post(
  "/",
  talesValidator,
  createTale
);

/*
 * Admin routes
 */

// Get all story submissions
router.get(
  "/admin",
  protect,
  authorize("admin"),
  getAdminTales
);

// Get a single story submission
router.get(
  "/admin/:id",
  protect,
  authorize("admin"),
  getAdminTaleById
);

// Update story status
router.patch(
  "/admin/:id/status",
  protect,
  authorize("admin"),
  updateTaleStatus
);

// Delete story submission
router.delete(
  "/admin/:id",
  protect,
  authorize("admin"),
  deleteTale
);

module.exports = router;