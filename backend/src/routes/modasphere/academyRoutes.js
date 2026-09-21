const express = require("express");
const { protect, authorize } = require("../../middleware/authMiddleware");
const {
  academyValidator,
  academyUpdateValidator,
} = require("../../validators/modasphere/academyValidator");
const {
  createCourse,
  getPublishedCourses,
  getPublishedCourseBySlug,
  publishCourse,
  updateCourse,
  deleteCourse
} = require("../../controllers/modasphere/academyController");

const router = express.Router();

// Public - Get published courses
router.get("/courses", getPublishedCourses);

// Admin / Moderator - Create course
router.post(
  "/courses",
  protect,
  authorize("admin", "moderator"),
  academyValidator,
  createCourse
);

// Public - Get published course by slug
router.get("/courses/:slug", getPublishedCourseBySlug);

// Admin / Moderator - Publish course
router.patch(
  "/courses/:id/publish",
  protect,
  authorize("admin", "moderator"),
  publishCourse
);

// Admin / Moderator - Update course
router.patch(
  "/courses/:id",
  protect,
  authorize("admin", "moderator"),
  academyUpdateValidator,
  updateCourse
);

// Admin / Moderator - Delete course
router.delete(
  "/courses/:id",
  protect,
  authorize("admin", "moderator"),
  deleteCourse
);

module.exports = router;