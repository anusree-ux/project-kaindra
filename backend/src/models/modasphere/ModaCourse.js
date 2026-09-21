const mongoose = require("mongoose");

const courseModuleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Module title is required"],
      trim: true,
      maxlength: [200, "Module title cannot exceed 200 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Module description cannot exceed 500 characters"],
    },

    content: {
      type: String,
      required: [true, "Module content is required"],
    },

    type: {
      type: String,
      enum: ["video", "article", "quiz", "task"],
      default: "article",
    },

    durationMinutes: {
      type: Number,
      min: [1, "Module duration must be at least 1 minute"],
    },

    order: {
      type: Number,
      required: [true, "Module order is required"],
      min: [1, "Module order must be at least 1"],
    },

    isRequired: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: true,
  }
);

const modaCourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      maxlength: [200, "Course title cannot exceed 200 characters"],
    },

    slug: {
      type: String,
      required: [true, "Course slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    subtitle: {
      type: String,
      trim: true,
      maxlength: [300, "Course subtitle cannot exceed 300 characters"],
    },

    description: {
      type: String,
      required: [true, "Course description is required"],
      trim: true,
    },

    shortDescription: {
      type: String,
      trim: true,
      maxlength: [
        500,
        "Course short description cannot exceed 500 characters",
      ],
    },

    category: {
      type: String,
      required: [true, "Course category is required"],
      trim: true,
    },

    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },

    coverImage: {
      type: String,
      trim: true,
    },

    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Course instructor is required"],
    },

    tags: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    modules: {
      type: [courseModuleSchema],
      default: [],
    },

    durationMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Course creator is required"],
    },

    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const ModaCourse = mongoose.model("ModaCourse", modaCourseSchema);

module.exports = ModaCourse;