const mongoose = require("mongoose");
const path = require("path");
const ModaCourse = require("../../models/modasphere/ModaCourse");
const ModaAcademyEnrollment = require("../../models/modasphere/CourseEnrollment");
const AppError = require("../../utils/AppError");
const {
  uploadAcademyTaskSubmission,
  deleteAcademyTaskSubmission,
} = require("../../services/modasphere/academyTaskUploadService");

const getCourseLessons = (course) =>
  (course.modules || []).flatMap((module) => [
    ...(module.lessons || []),
    ...(module.submodules || []).flatMap(
      (submodule) => submodule.lessons || [],
    ),
  ]);

const getProgressForCompletedLessons = (course, completedLessonIds) => {
  const lessons = getCourseLessons(course);
  const requiredLessons = lessons.filter(
    (lesson) => lesson.isRequired !== false,
  );
  const progressLessons = requiredLessons.length ? requiredLessons : lessons;
  const progressIds = new Set(progressLessons.map((lesson) => String(lesson._id)));
  const completedProgressCount = completedLessonIds.filter((id) =>
    progressIds.has(String(id)),
  ).length;
  const progress = progressLessons.length
    ? Math.round((completedProgressCount / progressLessons.length) * 100)
    : 0;

  return {
    lessons,
    progress,
    status: progress === 100 ? "Completed" : "Enrolled",
  };
};

// Student - Submit enrollment
const createEnrollment = async (req, res) => {
  try {
    const {
      courseId,
      courseName,
      category,
      level,
      duration,
      instructor,
      name,
      email,
      phone,
      experience,
    } = req.body;

    // Basic validation
    if (
      !courseId ||
      !courseName ||
      !category ||
      !level ||
      !duration ||
      !instructor ||
      !name ||
      !email ||
      !phone ||
      !experience
    ) {
      return res.status(400).json({
        success: false,
        message: "All enrollment fields are required",
      });
    }

    const enrollment = await ModaAcademyEnrollment.create({
      enrollmentId: `MA-${Date.now()}`,
      courseId,
      courseName,
      category,
      level,
      duration,
      instructor,
      name,
      email,
      phone,
      experience,
      status: "Enrolled",
      progress: 0,
    });

    return res.status(201).json({
      success: true,
      message: "Enrollment submitted successfully",
      data: enrollment,
    });
  } catch (error) {
    console.error("Create academy enrollment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit enrollment",
    });
  }
};

// Student - Get enrollments using email
const getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await ModaAcademyEnrollment.find({
      email: req.user.email,
    }).sort({
      enrolledAt: -1,
    });

    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments,
    });
  } catch (error) {
    next(error);
  }
};

// Admin - Get all enrollments
const getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await ModaAcademyEnrollment.find().sort({
      enrolledAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments,
    });
  } catch (error) {
    console.error("Get all academy enrollments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch enrollments",
    });
  }
};

// Admin - Delete enrollment
const deleteEnrollment = async (req, res) => {
  try {
    const enrollment = await ModaAcademyEnrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    await enrollment.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Enrollment deleted successfully",
    });
  } catch (error) {
    console.error("Delete academy enrollment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete enrollment",
    });
  }
};

// Student - Save completed lessons and recalculate course progress
const updateEnrollmentProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { completedLessonIds } = req.body;

    if (
      !mongoose.isValidObjectId(courseId) ||
      !Array.isArray(completedLessonIds) ||
      !completedLessonIds.every(
        (id) => typeof id === "string" && mongoose.isValidObjectId(id),
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid course or lesson data",
      });
    }

    const enrollment = await ModaAcademyEnrollment.findOne({
      user: req.user._id,
      courseId,
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    const course = await ModaCourse.findOne({
      _id: courseId,
      status: "published",
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const lessons = getCourseLessons(course);
    const validLessonIds = new Set(lessons.map((lesson) => String(lesson._id)));

    // Ignore IDs that do not belong to lessons in this course.
    const completed = [
      ...new Set(completedLessonIds.filter((id) => validLessonIds.has(id))),
    ];

    const { progress, status: nextStatus } = getProgressForCompletedLessons(
      course,
      completed,
    );

    enrollment.completedLessonIds = completed;
    enrollment.progress = progress;
    enrollment.status = nextStatus;

    await enrollment.save();

    return res.status(200).json({
      success: true,
      message: "Course progress saved",
      progress: enrollment.progress,
      completedLessonIds: enrollment.completedLessonIds,
      status: enrollment.status,
    });
  } catch (error) {
    console.error("Update academy progress error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save course progress",
    });
  }
};

const submitQuiz = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { answers } = req.body;

    if (
      !mongoose.isValidObjectId(courseId) ||
      !mongoose.isValidObjectId(lessonId) ||
      !Array.isArray(answers) ||
      !answers.every(Number.isInteger)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid course, lesson, or quiz answers.",
      });
    }

    const enrollment = await ModaAcademyEnrollment.findOne({
      user: req.user._id,
      courseId,
    });
    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course.",
      });
    }

    const course = await ModaCourse.findOne({
      _id: courseId,
      status: "published",
    });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    const lesson = getCourseLessons(course).find(
      (courseLesson) => String(courseLesson._id) === lessonId,
    );
    if (!lesson || lesson.type !== "quiz") {
      return res.status(404).json({
        success: false,
        message: "Quiz lesson not found.",
      });
    }

    const questions = lesson.quizQuestions || [];
    if (
      questions.length === 0 ||
      answers.length !== questions.length ||
      answers.some(
        (answer, index) =>
          answer < 0 || answer >= (questions[index]?.options?.length || 0),
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Answer every quiz question before checking your answers.",
      });
    }

    const correctCount = questions.reduce(
      (count, question, index) =>
        count + (answers[index] === question.correctAnswerIndex ? 1 : 0),
      0,
    );
    const score = Math.round((correctCount / questions.length) * 100);
    const passingScore = Number(lesson.passingScore ?? 70);
    const passed = score >= passingScore;
    const validLessonIds = new Set(
      getCourseLessons(course).map((courseLesson) =>
        String(courseLesson._id),
      ),
    );
    const completedLessonIds = [
      ...new Set(
        (enrollment.completedLessonIds || [])
          .map(String)
          .filter((id) => validLessonIds.has(id)),
      ),
    ];

    if (passed && !completedLessonIds.includes(lessonId)) {
      completedLessonIds.push(lessonId);
      const { progress, status } = getProgressForCompletedLessons(
        course,
        completedLessonIds,
      );
      enrollment.completedLessonIds = completedLessonIds;
      enrollment.progress = progress;
      enrollment.status = status;
      await enrollment.save();
    }

    const currentProgress = getProgressForCompletedLessons(
      course,
      completedLessonIds,
    );

    return res.status(200).json({
      success: true,
      score,
      correctCount,
      totalQuestions: questions.length,
      passingScore,
      passed,
      progress: enrollment.progress ?? currentProgress.progress,
      completedLessonIds: enrollment.completedLessonIds || completedLessonIds,
      status: enrollment.status || currentProgress.status,
    });
  } catch (error) {
    console.error("Submit academy quiz error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to check quiz answers.",
    });
  }
};

const hasValidTaskFileSignature = (file) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const buffer = file.buffer;
  const startsWith = (...bytes) =>
    buffer.length >= bytes.length &&
    bytes.every((byte, index) => buffer[index] === byte);

  switch (extension) {
    case ".pdf":
      return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
    case ".doc":
      return startsWith(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1);
    case ".docx":
      return startsWith(0x50, 0x4b, 0x03, 0x04);
    case ".png":
      return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    case ".jpg":
    case ".jpeg":
      return startsWith(0xff, 0xd8, 0xff);
    default:
      return false;
  }
};

const uploadTaskSubmission = async (req, res) => {
  let uploadedFile;

  try {
    const { courseId, lessonId } = req.params;
    if (
      !mongoose.isValidObjectId(courseId) ||
      !mongoose.isValidObjectId(lessonId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid course or lesson.",
      });
    }
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Choose a task file to upload.",
      });
    }
    if (!hasValidTaskFileSignature(req.file)) {
      return res.status(400).json({
        success: false,
        message: "The selected file does not match its file type.",
      });
    }

    const enrollment = await ModaAcademyEnrollment.findOne({
      user: req.user._id,
      courseId,
    });
    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course.",
      });
    }

    const course = await ModaCourse.findOne({
      _id: courseId,
      status: "published",
    });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    const lesson = getCourseLessons(course).find(
      (courseLesson) => String(courseLesson._id) === lessonId,
    );
    if (!lesson || lesson.type !== "task") {
      return res.status(404).json({
        success: false,
        message: "Task lesson not found.",
      });
    }

    uploadedFile = await uploadAcademyTaskSubmission(
      req.file.buffer,
      req.file.originalname,
    );

    const previousSubmission = (enrollment.taskSubmissions || []).find(
      (submission) => submission.lessonId === lessonId,
    );
    const fileName = path
      .basename(req.file.originalname.replace(/\\/g, "/"))
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .slice(0, 255);
    const submission = {
      lessonId,
      fileUrl: uploadedFile.url,
      filePublicId: uploadedFile.publicId,
      fileName,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      submittedAt: new Date(),
    };

    enrollment.taskSubmissions = (enrollment.taskSubmissions || [])
      .filter((item) => item.lessonId !== lessonId)
      .concat(submission);

    await enrollment.save();

    if (previousSubmission?.filePublicId) {
      await deleteAcademyTaskSubmission(previousSubmission.filePublicId).catch(
        (error) =>
          console.error(
            "Failed to remove replaced academy task file:",
            error,
          ),
      );
    }

    return res.status(200).json({
      success: true,
      message: "Task file uploaded successfully.",
      taskSubmission: {
        lessonId: submission.lessonId,
        fileUrl: submission.fileUrl,
        fileName: submission.fileName,
        mimeType: submission.mimeType,
        fileSize: submission.fileSize,
        submittedAt: submission.submittedAt,
      },
    });
  } catch (error) {
    if (uploadedFile?.publicId) {
      await deleteAcademyTaskSubmission(uploadedFile.publicId).catch(
        (cleanupError) =>
          console.error(
            "Failed to clean up academy task file after an error:",
            cleanupError,
          ),
      );
    }
    console.error("Upload academy task submission error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to upload task file.",
    });
  }
};

module.exports = {
  createEnrollment,
  getMyEnrollments,
  getAllEnrollments,
  deleteEnrollment,
  updateEnrollmentProgress,
  submitQuiz,
  uploadTaskSubmission,
};
