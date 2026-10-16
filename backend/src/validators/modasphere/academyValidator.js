const { body } = require("express-validator");

const validLesson = (lesson) => {
  if (!lesson || typeof lesson !== "object" || Array.isArray(lesson)) return false;
  if (typeof lesson.title !== "string" || !lesson.title.trim() || lesson.title.length > 200) return false;
  if (lesson.type !== undefined && !["video", "article", "quiz", "task"].includes(lesson.type)) return false;
  if (lesson.isRequired !== undefined && typeof lesson.isRequired !== "boolean") return false;
  if (lesson.order !== undefined && (!Number.isInteger(Number(lesson.order)) || Number(lesson.order) < 1)) return false;
  if (lesson.durationMinutes !== undefined && (!Number.isFinite(Number(lesson.durationMinutes)) || Number(lesson.durationMinutes) < 1)) return false;
  if (lesson.type === "quiz") {
    if (!Array.isArray(lesson.quizQuestions) || !lesson.quizQuestions.length) return false;
    if (lesson.quizQuestions.some((q) => !q || typeof q.question !== "string" || !q.question.trim() || !Array.isArray(q.options) || q.options.length < 2 || q.options.some((option) => typeof option !== "string" || !option.trim()) || !Number.isInteger(q.correctAnswerIndex) || q.correctAnswerIndex < 0 || q.correctAnswerIndex >= q.options.length)) return false;
    if (lesson.passingScore !== undefined && (!Number.isFinite(Number(lesson.passingScore)) || Number(lesson.passingScore) < 0 || Number(lesson.passingScore) > 100)) return false;
  }
  return true;
};

const validateModules = (required) => body("modules").custom((modules) => {
  if (modules === undefined && !required) return true;
  if (!Array.isArray(modules)) throw new Error("Modules must be an array");
  for (const module of modules) {
    if (!module || typeof module.title !== "string" || !module.title.trim()) throw new Error("Module title is required");
    // Accept legacy flat modules while supporting the canonical nested lesson structure.
    if (module.order !== undefined && (!Number.isInteger(Number(module.order)) || Number(module.order) < 1)) throw new Error("Module order must be at least 1");
    if (module.type !== undefined && !["video", "article", "quiz", "task"].includes(module.type)) throw new Error("Invalid module type");
    if (module.content !== undefined && typeof module.content !== "string") throw new Error("Module content must be text");
    if (module.lessons !== undefined && (!Array.isArray(module.lessons) || module.lessons.some((lesson) => !validLesson(lesson)))) throw new Error("Each lesson must have valid lesson details");
    if (module.submodules !== undefined && (!Array.isArray(module.submodules) || module.submodules.some((submodule) => !submodule || typeof submodule.title !== "string" || !submodule.title.trim() || !Array.isArray(submodule.lessons) || submodule.lessons.some((lesson) => !validLesson(lesson))))) throw new Error("Each submodule must have a title and valid lessons");
    if (module.content === undefined && !(module.lessons?.length) && !(module.submodules?.some((submodule) => submodule.lessons?.length))) throw new Error("A module must contain content or at least one lesson");
  }
  return true;
});

const common = [
  body("title").optional().trim().isLength({ min: 1, max: 200 }).withMessage("Course title is required and cannot exceed 200 characters"),
  body("subtitle").optional().trim().isLength({ max: 300 }),
  body("description").optional().trim().notEmpty(),
  body("shortDescription").optional().trim().isLength({ max: 500 }),
  body("category").optional().trim().notEmpty(),
  body("level").optional().isIn(["beginner", "intermediate", "advanced"]),
  body("coverImage").optional().trim(),
  body("tags").optional().isArray(),
];

const academyValidator = [
  body("title").trim().notEmpty().isLength({ max: 200 }),
  body("description").trim().notEmpty(),
  body("category").trim().notEmpty(),
  body("status").optional().isIn(["draft", "published"]),
  validateModules(true),
  ...common.slice(1),
];

const academyUpdateValidator = [
  ...common,
  body("status").optional().isIn(["draft", "published"]),
  validateModules(false),
  body("isFeatured").optional().isBoolean(),
];

module.exports = { academyValidator, academyUpdateValidator };
