const crypto = require("crypto");
const mongoose = require("mongoose");
const CourseCertificate = require("../../models/modasphere/CourseCertificate");
const ModaCourse = require("../../models/modasphere/ModaCourse");
const ModaAcademyEnrollment = require("../../models/modasphere/CourseEnrollment");
const { getVerifiedCompletedLessonIds } = require("../../services/modasphere/courseProgressService");

const formatCertificate = ({
  certificate,
  courseTitle,
  studentName,
  completedAt,
}) => ({
  id: String(certificate._id),
  certificateNumber: certificate.certificateNumber,
  courseTitle,
  studentName,
  completedAt,
  issuedAt: certificate.issuedAt,
});

const issueCourseCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID.",
      });
    }

    const enrollment = await ModaAcademyEnrollment.findOne({
      courseId,
      email: req.user.email,
    });
    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course.",
      });
    }

    const course = await ModaCourse.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    const verifiedProgress = getVerifiedCompletedLessonIds(course, enrollment);
    const progressSummary = ModaCourse.getProgress(
      course,
      verifiedProgress.completedLessonIds,
    );
    const completedAt = enrollment.completedAt;
    if (
      enrollment.status !== "Completed" ||
      progressSummary.status !== "Completed" ||
      enrollment.progress !== 100 ||
      !(completedAt instanceof Date) ||
      Number.isNaN(completedAt.getTime())
    ) {
      return res.status(409).json({
        success: false,
        message: "Complete the course before requesting a certificate.",
      });
    }

    const certificateQuery = {
      user: req.user._id,
      course: course._id,
    };
    const existingCertificate = await CourseCertificate.findOne(
      certificateQuery,
    );
    if (existingCertificate) {
      return res.status(200).json({
        success: true,
        certificate: formatCertificate({
          certificate: existingCertificate,
          courseTitle: course.title,
          studentName: req.user.name,
          completedAt,
        }),
      });
    }

    const certificateNumber = `KAINDRA-${crypto.randomUUID().toUpperCase()}`;
    let certificate;
    let created = true;
    try {
      certificate = await CourseCertificate.create({
        user: req.user._id,
        course: course._id,
        enrollment: enrollment._id,
        certificateNumber,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;

      certificate = await CourseCertificate.findOne(certificateQuery);
      if (!certificate) throw error;
      created = false;
    }

    return res.status(created ? 201 : 200).json({
      success: true,
      certificate: formatCertificate({
        certificate,
        courseTitle: course.title,
        studentName: req.user.name,
        completedAt,
      }),
    });
  } catch (error) {
    console.error("Issue academy certificate error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to issue course certificate.",
    });
  }
};

const getMyCertificates = async (req, res) => {
  try {
    const certificates = await CourseCertificate.find({
      user: req.user._id,
    })
      .populate("user", "name")
      .populate("course", "title")
      .populate("enrollment", "completedAt")
      .sort({ issuedAt: -1 });

    return res.status(200).json({
      success: true,
      count: certificates.length,
      certificates: certificates.map((certificate) =>
        formatCertificate({
          certificate,
          courseTitle: certificate.course?.title || null,
          studentName: certificate.user?.name || null,
          completedAt: certificate.enrollment?.completedAt || null,
        }),
      ),
    });
  } catch (error) {
    console.error("Get academy certificates error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch certificates.",
    });
  }
};

module.exports = {
  issueCourseCertificate,
  getMyCertificates,
};
