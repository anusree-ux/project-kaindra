const ModaAcademyEnrollment = require("../../models/modasphere/CourseEnrollment");

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
const getMyEnrollments = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const enrollments = await ModaAcademyEnrollment.find({
      email: email.toLowerCase(),
    }).sort({ enrolledAt: -1 });

    return res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments,
    });
  } catch (error) {
    console.error("Get academy enrollments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch enrollments",
    });
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

module.exports = {
  createEnrollment,
  getMyEnrollments,
  getAllEnrollments,
  deleteEnrollment,
};