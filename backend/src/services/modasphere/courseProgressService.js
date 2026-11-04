const ModaCourse = require("../../models/modasphere/ModaCourse");

const getVerifiedCompletedLessonIds = (
  course,
  enrollment,
  requestedLessonIds = [],
) => {
  const lessons = ModaCourse.getLessons(course);
  const lessonsById = new Map(
    lessons.map((lesson) => [String(lesson._id), lesson]),
  );
  const passedQuizLessonIds = new Set(
    (enrollment.passedQuizLessonIds || []).map(String),
  );
  const storedCompletedLessonIds = new Set(
    (enrollment.completedLessonIds || []).map(String),
  );
  const submittedTaskLessonIds = new Set(
    (enrollment.taskSubmissions || []).map((submission) =>
      String(submission.lessonId),
    ),
  );
  const requestedIds = [...new Set(requestedLessonIds.map(String))];

  const invalidRequestedId = requestedIds.find((lessonId) => {
    const lesson = lessonsById.get(lessonId);
    if (storedCompletedLessonIds.has(lessonId)) return false;
    if (!lesson) return true;
    if (lesson.type === "quiz" && !passedQuizLessonIds.has(lessonId)) {
      return true;
    }
    return lesson.type === "task" && !submittedTaskLessonIds.has(lessonId);
  });

  if (invalidRequestedId) {
    const lesson = lessonsById.get(invalidRequestedId);
    let message = "A lesson does not belong to this course.";
    if (lesson?.type === "quiz") {
      message = "Pass the quiz before marking the lesson complete.";
    } else if (lesson?.type === "task") {
      message = "Submit the required task before marking the lesson complete.";
    }
    return { completedLessonIds: [], error: message };
  }

  const completedLessonIds = [
    ...new Set([
      ...(enrollment.completedLessonIds || []).map(String),
      ...requestedIds,
    ]),
  ].filter((lessonId) => {
    const lesson = lessonsById.get(lessonId);
    if (!lesson) return false;
    if (lesson.type === "quiz") return passedQuizLessonIds.has(lessonId);
    if (lesson.type === "task") return submittedTaskLessonIds.has(lessonId);
    return true;
  });

  return { completedLessonIds };
};

const saveEnrollmentProgress = (
  enrollment,
  course,
  completedLessonIds,
  wasCompleted,
) => {
  const progressSummary = ModaCourse.getProgress(course, completedLessonIds);

  enrollment.completedLessonIds = completedLessonIds;
  enrollment.progress = progressSummary.progress;
  enrollment.status = progressSummary.status;

  if (
    progressSummary.status === "Completed" &&
    !wasCompleted &&
    !enrollment.completedAt
  ) {
    enrollment.completedAt = new Date();
  }

  return progressSummary;
};

module.exports = {
  getVerifiedCompletedLessonIds,
  saveEnrollmentProgress,
};
