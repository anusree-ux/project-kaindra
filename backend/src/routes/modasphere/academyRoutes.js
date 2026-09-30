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
const {
  createEnrollment,
  getMyEnrollments: getAcademyMyEnrollments,
  getAllEnrollments,
  deleteEnrollment,
} = require("../../controllers/modasphere/enrollmentController");

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

// Public - Submit academy enrollment
router.post(
  "/enrollments",
  createEnrollment
);

// Public - Get student's enrollments by email
router.get(
  "/enrollments/my",
  protect,
  getAcademyMyEnrollments
);

// Admin - Get all academy enrollments
router.get(
  "/enrollments",
  protect,
  authorize("admin"),
  getAllEnrollments
);

// Admin - Delete academy enrollment
router.delete(
  "/enrollments/:id",
  protect,
  authorize("admin"),
  deleteEnrollment
);

module.exports = router;