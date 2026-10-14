const express = require("express");

const {
  protect,
  authorize,
} = require("../../middleware/authMiddleware");

const talesValidator = require("../../validators/modasphere/talesValidator");

const {
  createTale,
  getApprovedTales,
  getMyTales,
  updateMyTale,
  updateMyTalePublication,
  deleteMyTale,
  removeTaleByAdmin,
  getAdminTales,
  getAdminTaleById,
  updateTaleStatus,
  deleteTaleByAdmin,
} = require("../../controllers/modasphere/talesController");

const router = express.Router();

/*
 * Public routes
 */

// Submit a story
router.post(
  "/",
  protect,
  talesValidator,
  createTale
);

// Get approved stories for public display
router.get(
  "/approved",
  getApprovedTales
);

// Get stories submitted by the logged-in user
router.get(
  "/my",
  protect,
  getMyTales
);

// Edit your own story
router.patch(
  "/:id",
  protect,
  talesValidator,
  updateMyTale
);

// Publish or move your own story to drafts
router.patch(
  "/:id/publication",
  protect,
  updateMyTalePublication
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


router.patch(
  "/admin/:id/remove",
  protect,
  authorize("admin"),
  removeTaleByAdmin
);


// Update story status
router.patch(
  "/admin/:id/status",
  protect,
  authorize("admin"),
  updateTaleStatus
);

router.delete("/admin/:id", protect, authorize("admin"), deleteTaleByAdmin);

router.delete("/:id", protect, deleteMyTale);

module.exports = router;