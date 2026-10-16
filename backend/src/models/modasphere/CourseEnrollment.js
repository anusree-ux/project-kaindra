const mongoose = require("mongoose");

const academyTaskSubmissionSchema = new mongoose.Schema(
  {
    lessonId: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    filePublicId: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

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

    experience: {
      type: String,
      required: false,
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

    completedLessonIds: {
      type: [String],
      default: [],
    },

    taskSubmissions: {
      type: [academyTaskSubmissionSchema],
      default: [],
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