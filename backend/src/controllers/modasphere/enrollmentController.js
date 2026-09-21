const CourseEnrollment = require("../../models/modasphere/CourseEnrollment");
const ModaCourse = require("../../models/modasphere/ModaCourse");
const CourseCertificate = require("../../models/modasphere/CourseCertificate");

// Enroll in a course
const enrollInCourse = async (req, res) => {
  try {
    const course = await ModaCourse.findOne({
      _id: req.params.id,
      status: "published",
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Published course not found",
      });
    }

    const existingEnrollment = await CourseEnrollment.findOne({
      user: req.user._id,
      course: course._id,
    });

    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

    const enrollment = await CourseEnrollment.create({
      user: req.user._id,
      course: course._id,
    });

    res.status(201).json({
      success: true,
      message: "Enrolled in course successfully",
      enrollment,
    });
  } catch (error) {
    console.error("Enroll in course error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to enroll in course",
    });
  }
};

// Get logged-in user's enrollments
const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await CourseEnrollment.find({
      user: req.user._id,
    })
      .populate(
        "course",
        "title slug subtitle shortDescription category level coverImage durationMinutes"
      )
      .sort({ enrolledAt: -1 });

    res.status(200).json({
      success: true,
      count: enrollments.length,
      enrollments,
    });
  } catch (error) {
    console.error("Get my enrollments error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch enrollments",
    });
  }
};

// Get enrollment for a specific course
const getMyEnrollment = async (req, res) => {
  try {
    const enrollment = await CourseEnrollment.findOne({
      user: req.user._id,
      course: req.params.courseId,
    }).populate("course");

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    res.status(200).json({
      success: true,
      enrollment,
    });
  } catch (error) {
    console.error("Get enrollment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch enrollment",
    });
  }
};

// Complete a course module
const completeModule = async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;

    const enrollment = await CourseEnrollment.findOne({
      user: req.user._id,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    const course = await ModaCourse.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const moduleExists = course.modules.some(
      (module) => module._id.toString() === moduleId
    );

    if (!moduleExists) {
      return res.status(404).json({
        success: false,
        message: "Module not found in this course",
      });
    }

    const alreadyCompleted = enrollment.completedModules.some(
      (id) => id.toString() === moduleId
    );

    if (!alreadyCompleted) {
      enrollment.completedModules.push(moduleId);
    }

    const totalModules = course.modules.length;

    enrollment.progress =
      totalModules === 0
        ? 0
        : Math.round(
            (enrollment.completedModules.length / totalModules) * 100
          );

    if (enrollment.progress === 100) {
        enrollment.status = "completed";

        if (!enrollment.completedAt) {
            enrollment.completedAt = new Date();
        }
    }

    await enrollment.save();

    let certificate = null;

    if (enrollment.progress === 100) {
        certificate = await CourseCertificate.findOneAndUpdate(
            {
                user: req.user._id,
                course: course._id,
            },
            {
                user: req.user._id,
                course: course._id,
                enrollment: enrollment._id,
                certificateNumber: `MODA-${Date.now()}`,
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
            }
        );
    }

    res.status(200).json({
      success: true,
      message: "Module completed successfully",
      enrollment,
      certificate,
    });
  } catch (error) {
    console.error("Complete module error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to complete module",
    });
  }
};

module.exports = {
  enrollInCourse,
  getMyEnrollments,
  getMyEnrollment,
  completeModule,
};