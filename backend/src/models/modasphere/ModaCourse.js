const mongoose = require("mongoose");

const quizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  options: { type: [String], required: true, validate: (items) => items.length >= 2 },
  correctAnswerIndex: {
    type: Number,
    required: true,
    min: 0,
    validate: { validator(value) { return value < (this.options || []).length; }, message: "Correct answer must reference an available option" },
  },
}, { _id: true });

const courseLessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 500 },
  content: { type: String, default: "" },
  type: { type: String, enum: ["video", "article", "quiz", "task"], default: "article" },
  videoUrl: { type: String, trim: true },
  durationMinutes: { type: Number, min: 1 },
  order: { type: Number, min: 1 },
  isRequired: { type: Boolean, default: true },
  quizQuestions: { type: [quizQuestionSchema], default: undefined },
  passingScore: { type: Number, min: 0, max: 100, default: 70 },
  taskInstructions: { type: String, trim: true },
  submissionRequirements: { type: String, trim: true },
}, { _id: true });

const courseSubmoduleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 500 },
  order: { type: Number, min: 1 },
  lessons: { type: [courseLessonSchema], default: [] },
}, { _id: true });

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
      default: "",
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
      default: 1,
      min: [1, "Module order must be at least 1"],
    },

    isRequired: {
      type: Boolean,
      default: true,
    },
    lessons: { type: [courseLessonSchema], default: [] },
    submodules: { type: [courseSubmoduleSchema], default: [] },
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

modaCourseSchema.statics.getLessons = (course) =>
  (course?.modules || []).flatMap((module) => {
    const directLessons = module.lessons || [];
    const legacyLesson = !directLessons.length && module.content?.trim()
      ? [module]
      : [];
    return [
      ...legacyLesson,
      ...directLessons,
      ...(module.submodules || []).flatMap((submodule) => submodule.lessons || []),
    ];
  });

modaCourseSchema.statics.getProgress = (course, completedLessonIds = []) => {
  const requiredLessons = ModaCourse.getLessons(course).filter(
    (lesson) => lesson.isRequired !== false,
  );
  const completedIds = new Set(completedLessonIds.map(String));
  const completedRequiredLessons = requiredLessons.filter((lesson) =>
    completedIds.has(String(lesson._id)),
  ).length;
  const totalRequiredLessons = requiredLessons.length;
  const progress = totalRequiredLessons
    ? Math.round((completedRequiredLessons / totalRequiredLessons) * 100)
    : 0;
  return {
    progress,
    completedRequiredLessons,
    totalRequiredLessons,
    status: totalRequiredLessons > 0 && completedRequiredLessons === totalRequiredLessons
      ? "Completed"
      : "Enrolled",
  };
};

const ModaCourse = mongoose.model("ModaCourse", modaCourseSchema);

module.exports = ModaCourse;
