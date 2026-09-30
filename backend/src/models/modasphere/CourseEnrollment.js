const mongoose = require("mongoose");

const modaAcademyEnrollmentSchema = new mongoose.Schema(
  {
    enrollmentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Course information comes from the selected frontend course
    courseId: {
      type: String,
      required: true,
      trim: true,
    },

    courseName: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    level: {
      type: String,
      required: true,
      trim: true,
    },

    duration: {
      type: String,
      required: true,
      trim: true,
    },

    instructor: {
      type: String,
      required: true,
      trim: true,
    },

    // Student information comes from the enrollment form
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    experience: {
      type: String,
      required: true,
      enum: ["Beginner", "Intermediate", "Advanced"],
    },

    status: {
      type: String,
      enum: ["Enrolled", "Completed"],
      default: "Enrolled",
    },

    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    enrolledAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const ModaAcademyEnrollment = mongoose.model(
  "ModaAcademyEnrollment",
  modaAcademyEnrollmentSchema
);

module.exports = ModaAcademyEnrollment;