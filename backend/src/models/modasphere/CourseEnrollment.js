const mongoose = require("mongoose");

const courseEnrollmentSchema = new mongoose.Schema(
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

    completedModules: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
        },
      ],
      default: [],
    },

    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    status: {
      type: String,
      enum: ["enrolled", "completed"],
      default: "enrolled",
    },

    enrolledAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

courseEnrollmentSchema.index(
  { user: 1, course: 1 },
  { unique: true }
);

const CourseEnrollment = mongoose.model(
  "CourseEnrollment",
  courseEnrollmentSchema
);

module.exports = CourseEnrollment;