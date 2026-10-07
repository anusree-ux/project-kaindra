const express = require("express");
const multer = require("multer");
const {
  putDesignerProfile,
  getMyDesignerProfile,
  getDesignerProfileByUserId,
  createDesign,
  getMyDesigns,
  getPublicDesigns,
  getDesignById,
  updateDesign,
  deleteDesign,
  uploadDesignAssets,
  deleteAsset,
  addCollaborator,
  removeCollaborator,
  getDesignComments,
  createDesignComment,
  deleteDesignComment,
} = require("../../controllers/modasphere/designController");
const { protect } = require("../../middleware/authMiddleware");
const AppError = require("../../utils/AppError");

// Multer memory storage configuration (up to 10 files, 10MB max each, images & PDFs)
const uploadAssets = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");
    const isPdf = file.mimetype === "application/pdf";
    if (isImage || isPdf) {
      cb(null, true);
    } else {
      cb(new AppError("Only image files and PDFs are allowed!", 400), false);
    }
  },
});

const router = express.Router();

// Apply protect middleware to all ModaStudio endpoints
router.use(protect);

// ==========================================
// DESIGNER PROFILE ROUTES
// ==========================================
router.put("/designer-profile", putDesignerProfile);
router.get("/designer-profile/me", getMyDesignerProfile);
router.get("/designer-profile/:userId", getDesignerProfileByUserId);

// ==========================================
// DESIGN WORKSPACE ROUTES
// STATIC ROUTES DEFINED BEFORE PARAMETERIZED ONES
// ==========================================
router.post("/designs", createDesign);
router.get("/designs/me", getMyDesigns);
router.get("/designs/public", getPublicDesigns);

// Parameterized design routes
router.get("/designs/:id", getDesignById);
router.patch("/designs/:id", updateDesign);
router.delete("/designs/:id", deleteDesign);

// Asset routes
router.post("/designs/:id/assets", uploadAssets.array("files", 10), uploadDesignAssets);
router.delete("/designs/:id/assets/{*publicId}", deleteAsset);

// Collaborator routes
router.post("/designs/:id/collaborators", addCollaborator);
router.delete("/designs/:id/collaborators/:userId", removeCollaborator);

// Comment routes
router.get("/designs/:id/comments", getDesignComments);
router.post("/designs/:id/comments", createDesignComment);
router.delete("/designs/:id/comments/:commentId", deleteDesignComment);

module.exports = router;
