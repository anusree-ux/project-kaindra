const mongoose = require("mongoose");

const courseCertificateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ModaCourse",
      required: [true, "Course is required"],
    },

    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseEnrollment",
      required: [true, "Enrollment is required"],
    },

    certificateNumber: {
      type: String,
      required: [true, "Certificate number is required"],
      unique: true,
    },

    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

courseCertificateSchema.index(
  { user: 1, course: 1 },
  { unique: true }
);

const CourseCertificate = mongoose.model(
  "CourseCertificate",
  courseCertificateSchema
);

module.exports = CourseCertificate;