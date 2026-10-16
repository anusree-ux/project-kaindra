const mongoose = require("mongoose");
const ModaCourse = require("../../models/modasphere/ModaCourse");
const ModaAcademyEnrollment = require("../../models/modasphere/CourseEnrollment");

const stripQuizAnswerKeys = (course) => {
  const data = typeof course.toObject === "function" ? course.toObject() : course;
  const strip = (lesson) => {
    if (lesson?.type === "quiz") lesson.quizQuestions = (lesson.quizQuestions || []).map(({ _id, question, options }) => ({ _id, question, options }));
  };
  (data.modules || []).forEach((module) => {
    strip(module);
    (module.lessons || []).forEach(strip);
    (module.submodules || []).forEach((submodule) => (submodule.lessons || []).forEach(strip));
  });
  return data;
};

const getCourseDuration = (modules = []) => modules.reduce((total, module) => {
  const lessonDurations = [
    ...(module.lessons || []),
    ...(module.submodules || []).flatMap((submodule) => submodule.lessons || []),
  ].reduce((sum, lesson) => sum + (Number(lesson.durationMinutes) || 0), 0);
  return total + (lessonDurations || Number(module.durationMinutes) || 0);
}, 0);

// Create course
const createCourse = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      shortDescription,
      category,
      level,
      coverImage,
      tags,
      modules,
      durationMinutes,
      isFeatured,
      status,
    } = req.body;

    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existingCourse = await ModaCourse.findOne({ slug });

    if (existingCourse) {
      return res.status(409).json({
        success: false,
        message: "A course with this title already exists",
      });
    }

    const course = await ModaCourse.create({
      title,
      slug,
      subtitle,
      description,
      shortDescription,
      category,
      level: level || "beginner",
      coverImage,
      tags,
      modules,
      durationMinutes: getCourseDuration(modules),
      isFeatured: isFeatured || false,
      status: status || "draft",
      instructor: req.user._id,
      createdBy: req.user._id,
      publishedAt: status === "published" ? new Date() : null,
    });

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    console.error("Create course error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create course",
    });
  }
};

// Get published courses for public
const getPublishedCourses = async (req, res) => {
  try {
    const courses = await ModaCourse.find({ status: "published" })
      .select("-createdBy")
      .populate("instructor", "name email")
      .sort({ publishedAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      courses: courses.map(stripQuizAnswerKeys),
    });
  } catch (error) {
    console.error("Get published courses error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch published courses",
    });
  }
};


 // Get all courses for admin dashboard
const getAllCoursesForAdmin = async (req, res) => {
  try {
    const courses = await ModaCourse.find({})
      .populate("instructor", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error) {
    console.error("Get all academy courses error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch academy courses",
    });
  }
};


// Get published course by slug
const getPublishedCourseBySlug = async (req, res) => {
  try {
    const course = await ModaCourse.findOne({
      slug: req.params.slug,
      status: "published",
    })
      .select("-createdBy")
      .populate("instructor", "name email");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.status(200).json({
      success: true,
      course: stripQuizAnswerKeys(course),
    });
  } catch (error) {
    console.error("Get published course error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch course",
    });
  }
};

// Publish course
const publishCourse = async (req, res) => {
  try {
    const course = await ModaCourse.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    course.status = "published";
    course.publishedAt = new Date();

    await course.save();

    res.status(200).json({
      success: true,
      message: "Course published successfully",
      course,
    });
  } catch (error) {
    console.error("Publish course error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to publish course",
    });
  }
};

// Update course status
const updateCourseStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["draft", "published"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either draft or published",
      });
    }

    const course = await ModaCourse.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (course.status !== status) {
      course.status = status;
      course.publishedAt = status === "published" ? new Date() : null;
      await course.save();
    }

    res.status(200).json({
      success: true,
      message: `Course ${status === "published" ? "published" : "moved to draft"} successfully`,
      course,
    });
  } catch (error) {
    console.error("Update academy course status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update course status",
    });
  }
};

// Update course
const updateCourse = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      shortDescription,
      category,
      level,
      coverImage,
      tags,
      modules,
      isFeatured,
    } = req.body;

    const course = await ModaCourse.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (title && title !== course.title) {
      const newSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const existingCourse = await ModaCourse.findOne({
        slug: newSlug,
        _id: { $ne: course._id },
      });

      if (existingCourse) {
        return res.status(409).json({
          success: false,
          message: "A course with this title already exists",
        });
      }

      course.title = title;
      course.slug = newSlug;
    }

    if (subtitle !== undefined) course.subtitle = subtitle;
    if (description !== undefined) course.description = description;
    if (shortDescription !== undefined)
      course.shortDescription = shortDescription;
    if (category !== undefined) course.category = category;
    if (level !== undefined) course.level = level;
    if (coverImage !== undefined) course.coverImage = coverImage;
    if (tags !== undefined) course.tags = tags;
    if (modules !== undefined) {
      course.modules = modules;

      course.durationMinutes = getCourseDuration(modules);
    }
    if (isFeatured !== undefined) course.isFeatured = isFeatured;

    await course.save();

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course,
    });
  } catch (error) {
    console.error("Update course error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update course",
    });
  }
};

// Delete course
const deleteCourse = async (req, res) => {
  try {
    const course = await ModaCourse.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    await course.deleteOne();

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Delete course error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete course",
    });
  }
};

// Student - Get an enrolled course by ID
const getEnrolledCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const enrollment = await ModaAcademyEnrollment.findOne({
      email: req.user.email,
      courseId: id,
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    const course = await ModaCourse.findOne({
      _id: id,
      status: "published",
    }).populate("instructor", "name");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const courseData = stripQuizAnswerKeys(course);
    const progressSummary = ModaCourse.getProgress(course, enrollment.completedLessonIds || []);
    if (enrollment.progress !== progressSummary.progress || enrollment.status !== progressSummary.status) {
      enrollment.progress = progressSummary.progress;
      enrollment.status = progressSummary.status;
      await enrollment.save();
    }

    return res.status(200).json({
      success: true,
      course: courseData,
      progress: progressSummary.progress,
      completedRequiredLessons: progressSummary.completedRequiredLessons,
      totalRequiredLessons: progressSummary.totalRequiredLessons,
      completedLessonIds: enrollment.completedLessonIds || [],
      taskSubmissions: (enrollment.taskSubmissions || []).map((submission) => ({
        lessonId: submission.lessonId,
        fileUrl: submission.fileUrl,
        fileName: submission.fileName,
        mimeType: submission.mimeType,
        fileSize: submission.fileSize,
        submittedAt: submission.submittedAt,
      })),
    });
  } catch (error) {
    console.error("Get enrolled course error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch course",
    });
  }
};


module.exports = {
  createCourse,
  getPublishedCourses,
  getAllCoursesForAdmin,
  getPublishedCourseBySlug,
  getEnrolledCourseById,
  publishCourse,
  updateCourseStatus,
  updateCourse,
  deleteCourse
};
