const express = require("express");
const multer = require("multer");
const {
  upsertJournalEntry,
  getRideJournals,
  getMyJournals,
  deleteJournalPhoto,
} = require("../../controllers/mototribe/journalController");
const { protect } = require("../../middleware/authMiddleware");
const AppError = require("../../utils/AppError");

// Multer memory storage configuration (5MB limit, images only)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new AppError("Only image files are allowed!", 400), false);
    }
  },
});

const router = express.Router();

// All journal routes require authentication
router.use(protect);

// GET logged-in user's own journals across all rides
router.get("/rider-profile/me/journal", getMyJournals);

// POST create/update journal entry for a ride (up to 5 photos)
router.post("/rides/:id/journal", upload.array("photos", 5), upsertJournalEntry);

// GET all journal entries for a ride
router.get("/rides/:id/journal", getRideJournals);

// DELETE specific photo from a journal entry (Express 5 wildcard parameter syntax: {*publicId})
router.delete("/rides/:id/journal/photos/{*publicId}", deleteJournalPhoto);

module.exports = router;
