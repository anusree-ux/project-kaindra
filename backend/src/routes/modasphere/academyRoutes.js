const express = require("express");
const { validationResult } = require("express-validator");
const multer = require("multer");
const path = require("path");
const { protect, authorize } = require("../../middleware/authMiddleware");
const AppError = require("../../utils/AppError");
const {
  academyValidator,
  academyUpdateValidator,
} = require("../../validators/modasphere/academyValidator");
const {
  createCourse,
  getPublishedCourses,
  getAllCoursesForAdmin,
  getPublishedCourseBySlug,
  publishCourse,
  updateCourseStatus,
  updateCourse,
  deleteCourse,
  getEnrolledCourseById
} = require("../../controllers/modasphere/academyController");
const {
  createEnrollment,
  getMyEnrollments: getAcademyMyEnrollments,
  getAllEnrollments,
  deleteEnrollment,
  unenrollFromCourse,
  updateEnrollmentProgress,
  submitQuiz,
  uploadTaskSubmission,
} = require("../../controllers/modasphere/enrollmentController");

const router = express.Router();
const validateAcademyRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
  next();
};

const academyTaskFileTypes = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

const taskFileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (academyTaskFileTypes[extension] !== file.mimetype) {
      callback(
        new AppError("Only PDF, DOC, DOCX, PNG, and JPG files are allowed.", 400),
      );
      return;
    }
    callback(null, true);
  },
});

const uploadTaskFile = (req, res, next) => {
  taskFileUpload.single("file")(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return next(new AppError("Task files must be 10 MB or smaller.", 413));
    }
    return next(error);
  });
};

// Public - Get published courses
router.get("/courses", getPublishedCourses);

// Admin - Get all courses, including drafts
router.get(
  "/admin/courses",
  protect,
  authorize("admin"),
  getAllCoursesForAdmin
);

// Admin / Moderator - Create course
router.post(
  "/courses",
  protect,
  authorize("admin", "moderator"),
  academyValidator,
  validateAcademyRequest,
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

// Admin / Moderator - Update course status
router.patch(
  "/courses/:id/status",
  protect,
  authorize("admin", "moderator"),
  updateCourseStatus
);

// Admin / Moderator - Update course
router.patch(
  "/courses/:id",
  protect,
  authorize("admin", "moderator"),
  academyUpdateValidator,
  validateAcademyRequest,
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
  protect,
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

// Student - Unenroll from their own course
router.delete(
  "/enrollments/:id/unenroll",
  protect,
  unenrollFromCourse
);

// Student - Get enrolled course content
router.get(
  "/courses/id/:id",
  protect,
  getEnrolledCourseById
);

// Student - Save lesson progress
router.patch(
  "/enrollments/course/:courseId/progress",
  protect,
  updateEnrollmentProgress
);

// Student - Submit quiz answers for server-side grading
router.post(
  "/enrollments/course/:courseId/quizzes/:lessonId/submit",
  protect,
  submitQuiz,
);

// Student - Upload or replace a task submission
router.post(
  "/enrollments/course/:courseId/tasks/:lessonId/submission",
  protect,
  uploadTaskFile,
  uploadTaskSubmission,
);

module.exports = router;
