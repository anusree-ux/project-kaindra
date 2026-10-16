import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock3,
  Circle,
  FileText,
  GraduationCap,
  HelpCircle,
  LoaderCircle,
  LockKeyhole,
  PlayCircle,
  RotateCw,
} from "lucide-react";
import "./CourseLearning.css";

const ordered = (items) =>
  (Array.isArray(items) ? items : [])
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const aOrder = Number(a.item?.order);
      const bOrder = Number(b.item?.order);
      const aHasOrder = Number.isFinite(aOrder) && aOrder > 0;
      const bHasOrder = Number.isFinite(bOrder) && bOrder > 0;
      if (aHasOrder && bHasOrder && aOrder !== bOrder) return aOrder - bOrder;
      if (aHasOrder !== bHasOrder) return aHasOrder ? -1 : 1;
      return a.index - b.index;
    })
    .map(({ item }) => item);

const getCourseSections = (course) =>
  ordered(course?.modules).map((module, moduleIndex) => ({
    module,
    moduleIndex,
    submodules: ordered(module?.submodules).map(
      (submodule, submoduleIndex) => ({
        submodule,
        submoduleIndex,
        lessons: ordered(submodule?.lessons).map((lesson, lessonIndex) => ({
          lesson,
          key:
            lesson?._id ||
            `module-${moduleIndex}-submodule-${submoduleIndex}-lesson-${lessonIndex}`,
          moduleIndex,
          submoduleIndex,
          lessonIndex,
        })),
      }),
    ),
    lessons: ordered(module?.lessons?.length ? module.lessons : (module?.content?.trim() ? [module] : [])).map((lesson, lessonIndex) => ({
      lesson,
      key: lesson?._id || `module-${moduleIndex}-lesson-${lessonIndex}`,
      moduleIndex,
      submoduleIndex: null,
      lessonIndex,
    })),
  }));

const getProgressSummary = (lessonEntries, completedLessonIds) => {
  const completedIds = new Set((completedLessonIds || []).map(String));
  const requiredLessons = lessonEntries.filter(
    (entry) => entry.lesson?.isRequired !== false,
  );
  const completedRequiredLessons = requiredLessons.filter((entry) =>
    completedIds.has(String(entry.lesson?._id)),
  ).length;
  const totalRequiredLessons = requiredLessons.length;
  return {
    completedRequiredLessons,
    totalRequiredLessons,
    progress: totalRequiredLessons
      ? Math.round((completedRequiredLessons / totalRequiredLessons) * 100)
      : 0,
  };
};

const progressResponseMatchesCourse = (result, lessonEntries, completedLessonIds) => {
  const summary = getProgressSummary(lessonEntries, completedLessonIds);
  return Number(result.progress) === summary.progress &&
    Number(result.completedRequiredLessons) === summary.completedRequiredLessons &&
    Number(result.totalRequiredLessons) === summary.totalRequiredLessons;
};

const getLessonIcon = (type) => {
  switch (type) {
    case "video":
      return PlayCircle;
    case "quiz":
      return HelpCircle;
    case "task":
      return ClipboardList;
    case "article":
    default:
      return FileText;
  }
};

const getLessonTypeLabel = (type) => {
  switch (type) {
    case "video":
      return "Video";
    case "quiz":
      return "Quiz";
    case "task":
      return "Task";
    case "article":
    default:
      return "Article";
  }
};

const getDuration = (duration) => {
  const minutes = Number(duration);
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
};

const getSafeVideoUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
};

const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  let videoId = null;

  if (host === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0];
  } else if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtube-nocookie.com"
  ) {
    const segments = url.pathname.split("/").filter(Boolean);
    if (url.pathname === "/watch") videoId = url.searchParams.get("v");
    else if (["embed", "shorts", "live"].includes(segments[0])) {
      videoId = segments[1];
    }
  }

  return videoId && /^[\w-]{11}$/.test(videoId)
    ? `https://www.youtube-nocookie.com/embed/${videoId}`
    : null;
};

const isYouTubeUrl = (url) => {
  if (!url) return false;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  return (
    host === "youtu.be" ||
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtube-nocookie.com"
  );
};

const readJsonResponse = async (response) => {
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(
      "The server returned an unreadable response. Please try again.",
    );
  }
  return result;
};

function CourseLearning() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  const [selectedLessonKey, setSelectedLessonKey] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizResults, setQuizResults] = useState({});
  const [quizErrors, setQuizErrors] = useState({});
  const [checkingQuizKey, setCheckingQuizKey] = useState(null);
  const [taskFiles, setTaskFiles] = useState({});
  const [taskSubmissions, setTaskSubmissions] = useState({});
  const [taskErrors, setTaskErrors] = useState({});
  const [uploadingTaskKey, setUploadingTaskKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [savingLessonId, setSavingLessonId] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [videoPlaybackError, setVideoPlaybackError] = useState(false);
  const [expandedModules, setExpandedModules] = useState(() => new Set());
  const [expandedSubmodules, setExpandedSubmodules] = useState(() => new Set());

  const sections = useMemo(() => getCourseSections(course), [course]);
  const lessons = useMemo(
    () =>
      sections.flatMap((section) => [
        ...section.lessons,
        ...section.submodules.flatMap((submodule) => submodule.lessons),
      ]),
    [sections],
  );
  const selectedLessonIndex = lessons.findIndex(
    (entry) => entry.key === selectedLessonKey,
  );
  const selectedEntry =
    selectedLessonIndex >= 0 ? lessons[selectedLessonIndex] : null;
  const selectedLesson = selectedEntry?.lesson ?? null;
  const completedIds = useMemo(
    () => new Set(completedLessonIds.map(String)),
    [completedLessonIds],
  );
  const progressSummary = useMemo(
    () => getProgressSummary(lessons, completedLessonIds),
    [lessons, completedLessonIds],
  );
  const { progress } = progressSummary;
  const completed =
    selectedLesson?._id != null && completedIds.has(String(selectedLesson._id));

  useEffect(() => {
    const controller = new AbortController();

    const loadCourse = async () => {
      setLoading(true);
      setLoadError("");
      setSaveError("");
      setSaveMessage("");
      setVideoPlaybackError(false);
      setCourse(null);
      setCompletedLessonIds([]);
      setSelectedLessonKey(null);
      setSelectedAnswers({});
      setQuizResults({});
      setQuizErrors({});
      setTaskFiles({});
      setTaskSubmissions({});
      setTaskErrors({});

      const token = localStorage.getItem("token");
      if (!token) {
        setLoadError("Sign in to access your enrolled course.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/modasphere/academy/courses/id/${encodeURIComponent(courseId)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        );
        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Sign in again to continue.",
          );
        }
        if (response.status === 403) {
          throw new Error(
            "You are not enrolled in this course, or you do not have permission to access it.",
          );
        }
        const result = await readJsonResponse(response);
        if (!response.ok || !result?.success || !result.course) {
          throw new Error(
            result?.message || "Unable to load this course. Please try again.",
          );
        }

        const nextCourse = result.course;
        const nextSections = getCourseSections(nextCourse);
        const loadedCompletedLessonIds = Array.isArray(result.completedLessonIds)
          ? [...new Set(result.completedLessonIds.filter(Boolean).map(String))]
          : [];
        const loadedLessons = nextSections.flatMap((section) => [
          ...section.lessons,
          ...section.submodules.flatMap((submodule) => submodule.lessons),
        ]);
        if (!progressResponseMatchesCourse(result, loadedLessons, loadedCompletedLessonIds)) {
          throw new Error("Course progress totals do not match its required lessons. Please refresh or contact an administrator.");
        }
        const firstLesson =
          nextSections.flatMap((section) => [
            ...section.lessons,
            ...section.submodules.flatMap((submodule) => submodule.lessons),
          ])[0] ?? null;

        setCourse(nextCourse);
        setCompletedLessonIds(loadedCompletedLessonIds);
        setTaskSubmissions(
          Object.fromEntries(
            (Array.isArray(result.taskSubmissions)
              ? result.taskSubmissions
              : []
            )
              .filter((submission) => submission?.lessonId)
              .map((submission) => [
                String(submission.lessonId),
                submission,
              ]),
          ),
        );
        setSelectedLessonKey(firstLesson?.key ?? null);
        setExpandedModules(
          new Set(nextSections.map((section) => section.moduleIndex)),
        );
        setExpandedSubmodules(
          new Set(
            nextSections.flatMap((section) =>
              section.submodules.map(
                (submodule) =>
                  `${section.moduleIndex}-${submodule.submoduleIndex}`,
              ),
            ),
          ),
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          setLoadError(error.message || "Unable to load this course.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadCourse();
    return () => controller.abort();
  }, [courseId]);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/businesses/modaacademy");
  };

  const selectLesson = (key) => {
    setSelectedLessonKey(key);
    setSaveError("");
    setSaveMessage("");
    setVideoPlaybackError(false);
  };

  const toggleModule = (moduleIndex) => {
    setExpandedModules((current) => {
      const next = new Set(current);
      if (next.has(moduleIndex)) next.delete(moduleIndex);
      else next.add(moduleIndex);
      return next;
    });
  };

  const toggleSubmodule = (moduleIndex, submoduleIndex) => {
    const key = `${moduleIndex}-${submoduleIndex}`;
    setExpandedSubmodules((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectQuizAnswer = (lessonKey, questionIndex, optionIndex) => {
    setSelectedAnswers((current) => ({
      ...current,
      [lessonKey]: {
        ...current[lessonKey],
        [questionIndex]: optionIndex,
      },
    }));
    setQuizResults((current) => {
      const next = { ...current };
      delete next[lessonKey];
      return next;
    });
    setQuizErrors((current) => ({ ...current, [lessonKey]: "" }));
  };

  const saveLessonCompletion = async () => {
    if (!selectedLesson?._id || completed || savingLessonId) return;
    if (
      selectedLesson.type === "quiz" &&
      !quizResults[selectedEntry.key]?.passed
    ) {
      setSaveError("Pass the quiz before marking this lesson complete.");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setSaveError("Your session is missing. Sign in again to save progress.");
      return;
    }

    const lessonId = String(selectedLesson._id);
    const nextCompletedIds = [...new Set([...completedLessonIds, lessonId])];
    setSavingLessonId(lessonId);
    setSaveError("");
    setSaveMessage("");

    try {
      const response = await fetch(
        `/api/modasphere/academy/enrollments/course/${encodeURIComponent(courseId)}/progress`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ completedLessonIds: nextCompletedIds }),
        },
      );
      if (response.status === 401) {
        throw new Error(
          "Your session has expired. Sign in again to save progress.",
        );
      }
      if (response.status === 403) {
        throw new Error(
          "You are not enrolled in this course, or you do not have permission to save progress.",
        );
      }
      const result = await readJsonResponse(response);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Unable to save your progress.");
      }

      if (!Array.isArray(result.completedLessonIds) ||
          !result.completedLessonIds.map(String).includes(lessonId) ||
          !progressResponseMatchesCourse(result, lessons, result.completedLessonIds)) {
        throw new Error(
          result?.message || "The server did not confirm this lesson completion. Please try again.",
        );
      }

      setCompletedLessonIds([
        ...new Set(result.completedLessonIds.filter(Boolean).map(String)),
      ]);
      setSaveMessage("Lesson completed. Your progress has been saved.");
    } catch (error) {
      setSaveError(error.message || "Unable to save your progress.");
    } finally {
      setSavingLessonId(null);
    }
  };

  const checkQuizAnswers = async (lesson, lessonKey) => {
    const questions = Array.isArray(lesson.quizQuestions)
      ? lesson.quizQuestions
      : [];
    const answers = selectedAnswers[lessonKey] || {};
    if (
      !lesson._id ||
      questions.length === 0 ||
      questions.some(
        (_, index) => !Number.isInteger(answers[index]),
      )
    ) {
      setQuizErrors((current) => ({
        ...current,
        [lessonKey]: "Answer every question before checking your answers.",
      }));
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setQuizErrors((current) => ({
        ...current,
        [lessonKey]: "Your session is missing. Sign in again to check this quiz.",
      }));
      return;
    }

    setCheckingQuizKey(lessonKey);
    setQuizErrors((current) => ({ ...current, [lessonKey]: "" }));
    setQuizResults((current) => {
      const next = { ...current };
      delete next[lessonKey];
      return next;
    });

    try {
      const response = await fetch(
        `/api/modasphere/academy/enrollments/course/${encodeURIComponent(courseId)}/quizzes/${encodeURIComponent(lesson._id)}/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answers: questions.map((_, index) => answers[index]),
          }),
        },
      );
      if (response.status === 401) {
        throw new Error("Your session has expired. Sign in again to continue.");
      }
      if (response.status === 403) {
        throw new Error(
          "You are not enrolled in this course, or you do not have permission to submit this quiz.",
        );
      }
      const result = await readJsonResponse(response);
      if (
        !response.ok ||
        !result?.success ||
        !Number.isFinite(Number(result.score)) ||
        typeof result.passed !== "boolean"
      ) {
        throw new Error(result?.message || "Unable to check your answers.");
      }

      if (!Array.isArray(result.completedLessonIds) ||
          !progressResponseMatchesCourse(result, lessons, result.completedLessonIds)) {
        throw new Error("Quiz progress totals do not match its required lessons. Please refresh and try again.");
      }

      const score = Math.min(100, Math.max(0, Number(result.score)));
      setQuizResults((current) => ({
        ...current,
        [lessonKey]: {
          score,
          passed: result.passed,
          passingScore: Number(result.passingScore),
        },
      }));
      setCompletedLessonIds([
        ...new Set(result.completedLessonIds.filter(Boolean).map(String)),
      ]);
    } catch (error) {
      setQuizErrors((current) => ({
        ...current,
        [lessonKey]: error.message || "Unable to check your answers.",
      }));
    } finally {
      setCheckingQuizKey(null);
    }
  };

  const uploadTaskFile = async (lesson, lessonKey) => {
    const file = taskFiles[lessonKey];
    if (!lesson._id || !file) {
      setTaskErrors((current) => ({
        ...current,
        [lessonKey]: "Choose a task file before uploading.",
      }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setTaskErrors((current) => ({
        ...current,
        [lessonKey]: "Task files must be 10 MB or smaller.",
      }));
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setTaskErrors((current) => ({
        ...current,
        [lessonKey]: "Your session is missing. Sign in again to upload a file.",
      }));
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setUploadingTaskKey(lessonKey);
    setTaskErrors((current) => ({ ...current, [lessonKey]: "" }));

    try {
      const response = await fetch(
        `/api/modasphere/academy/enrollments/course/${encodeURIComponent(courseId)}/tasks/${encodeURIComponent(lesson._id)}/submission`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );
      if (response.status === 401) {
        throw new Error("Your session has expired. Sign in again to continue.");
      }
      if (response.status === 403) {
        throw new Error(
          "You are not enrolled in this course, or you do not have permission to upload a task.",
        );
      }
      const result = await readJsonResponse(response);
      if (!response.ok || !result?.success || !result.taskSubmission) {
        throw new Error(result?.message || "Unable to upload your task file.");
      }

      setTaskSubmissions((current) => ({
        ...current,
        [String(lesson._id)]: result.taskSubmission,
      }));
      setTaskFiles((current) => ({ ...current, [lessonKey]: null }));
    } catch (error) {
      setTaskErrors((current) => ({
        ...current,
        [lessonKey]: error.message || "Unable to upload your task file.",
      }));
    } finally {
      setUploadingTaskKey(null);
    }
  };

  const moveLesson = (direction) => {
    const nextEntry = lessons[selectedLessonIndex + direction];
    if (nextEntry) selectLesson(nextEntry.key);
  };

  const renderLessonItem = (entry) => {
    const LessonIcon = getLessonIcon(entry.lesson?.type);
    const isSelected = selectedLessonKey === entry.key;
    const isCompleted =
      entry.lesson?._id != null && completedIds.has(String(entry.lesson._id));
    const duration = getDuration(entry.lesson?.durationMinutes);

    return (
      <button
        type="button"
        className={`course-learning-lesson${isSelected ? " is-selected" : ""}${isCompleted ? " is-completed" : ""}`}
        key={entry.key}
        onClick={() => selectLesson(entry.key)}
        aria-current={isSelected ? "step" : undefined}
      >
        <span className="course-learning-lesson-status" aria-hidden="true">
          {isCompleted ? <CheckCircle2 size={17} /> : <Circle size={17} />}
        </span>
        <span className="course-learning-lesson-copy">
          <span className="course-learning-lesson-title">
            {entry.lesson?.title || "Untitled lesson"}
          </span>
          <span className="course-learning-lesson-meta">
            <span>{getLessonTypeLabel(entry.lesson?.type)}</span>
            {duration && <span>{duration}</span>}
          </span>
        </span>
      </button>
    );
  };

  const renderVideo = (lesson) => {
    const videoUrl = getSafeVideoUrl(lesson.videoUrl);
    const embedUrl = getYouTubeEmbedUrl(videoUrl);

    if (videoPlaybackError) {
      return (
        <div className="course-learning-content-note">
          <PlayCircle size={24} />
          <p>
            This video could not be played. Check your connection or contact
            your course administrator.
          </p>
        </div>
      );
    }

    if (!videoUrl) {
      return (
        <div className="course-learning-content-note">
          <PlayCircle size={24} />
          <p>
            {lesson.videoUrl
              ? "This video link is invalid. Please contact your course administrator."
              : "A video has not been added to this lesson yet."}
          </p>
        </div>
      );
    }

    if (isYouTubeUrl(videoUrl) && !embedUrl) {
      return (
        <div className="course-learning-content-note">
          <PlayCircle size={24} />
          <p>
            This YouTube link is invalid. Please contact your course
            administrator.
          </p>
        </div>
      );
    }

    if (embedUrl) {
      return (
        <div className="course-learning-video-frame">
          <iframe
            src={embedUrl}
            title={lesson.title || "Course video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      );
    }

    return (
      <div className="course-learning-video-frame">
        <video
          controls
          preload="metadata"
          onError={() => setVideoPlaybackError(true)}
        >
          <source src={videoUrl.href} />
          Your browser does not support embedded video playback.
        </video>
      </div>
    );
  };

  const renderLessonContent = (lesson) => {
    switch (lesson.type) {
      case "video":
        return renderVideo(lesson);
      case "article":
        return lesson.content?.trim() ? (
          <div className="course-learning-article">{lesson.content}</div>
        ) : (
          <div className="course-learning-content-note">
            <FileText size={24} />
            <p>Article content has not been added to this lesson yet.</p>
          </div>
        );
      case "quiz": {
        const questions = Array.isArray(lesson.quizQuestions)
          ? lesson.quizQuestions
          : [];
        if (!questions.length) {
          return (
            <div className="course-learning-content-note">
              <HelpCircle size={24} />
              <p>No quiz questions have been added to this lesson yet.</p>
            </div>
          );
        }
        return (
          <div className="course-learning-quiz">
            <div className="course-learning-quiz-notice">
              <LockKeyhole size={17} />
              <p>
                Your answers are checked securely by the course server. Correct
                answers are never sent to your browser.
              </p>
            </div>
            {questions.map((question, questionIndex) => {
              const options = Array.isArray(question?.options)
                ? question.options
                : [];
              return (
                <fieldset
                  className="course-learning-question"
                  key={question?._id || `question-${questionIndex}`}
                >
                  <legend>
                    <span>Question {questionIndex + 1}</span>
                    <strong>{question?.question || "Question"}</strong>
                  </legend>
                  {options.length ? (
                    <div className="course-learning-options">
                      {options.map((option, optionIndex) => (
                        <label
                          className="course-learning-option"
                          key={`option-${optionIndex}`}
                        >
                          <input
                            type="radio"
                            name={`${selectedEntry.key}-question-${questionIndex}`}
                            value={optionIndex}
                            checked={
                              selectedAnswers[selectedEntry.key]?.[
                                questionIndex
                              ] === optionIndex
                            }
                            onChange={() =>
                              selectQuizAnswer(
                                selectedEntry.key,
                                questionIndex,
                                optionIndex,
                              )
                            }
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="course-learning-question-empty">
                      No answer options are available for this question.
                    </p>
                  )}
                </fieldset>
              );
            })}
            {quizErrors[selectedEntry.key] && (
              <p className="course-learning-message is-error" role="alert">
                {quizErrors[selectedEntry.key]}
              </p>
            )}
            <div className="course-learning-quiz-actions">
              <button
                type="button"
                className="course-learning-button course-learning-button-primary"
                onClick={() => checkQuizAnswers(lesson, selectedEntry.key)}
                disabled={checkingQuizKey === selectedEntry.key}
              >
                {checkingQuizKey === selectedEntry.key ? (
                  <LoaderCircle
                    className="course-learning-spinner"
                    size={17}
                  />
                ) : (
                  <CheckCircle2 size={17} />
                )}
                {checkingQuizKey === selectedEntry.key
                  ? "Checking answers..."
                  : "Check answers"}
              </button>
              {quizResults[selectedEntry.key] && (
                <p
                  className={`course-learning-quiz-result${quizResults[selectedEntry.key].passed ? " is-passed" : " is-failed"}`}
                  role="status"
                >
                  {quizResults[selectedEntry.key].score}% correct
                  {" · "}
                  {quizResults[selectedEntry.key].passed
                    ? "Passed — lesson completed"
                    : `You need ${quizResults[selectedEntry.key].passingScore}% to pass`}
                </p>
              )}
            </div>
          </div>
        );
      }
      case "task": {
        const hasInstructions = Boolean(lesson.taskInstructions?.trim());
        const hasRequirements = Boolean(lesson.submissionRequirements?.trim());
        const taskSubmission = taskSubmissions[String(lesson._id)];
        const taskFile = taskFiles[selectedEntry.key];
        return (
          <div className="course-learning-task">
            {hasInstructions && (
              <section>
                <h3>Task instructions</h3>
                <div className="course-learning-article">
                  {lesson.taskInstructions}
                </div>
              </section>
            )}
            {hasRequirements && (
              <section>
                <h3>Submission requirements</h3>
                <div className="course-learning-article">
                  {lesson.submissionRequirements}
                </div>
              </section>
            )}
            {!hasInstructions && !hasRequirements && (
              <div className="course-learning-content-note">
                <ClipboardList size={24} />
                <p>Task instructions have not been added to this lesson yet.</p>
              </div>
            )}
            <section
              className="course-learning-task-upload"
              style={{
                display: "grid",
                gap: 12,
                padding: 18,
                border: "1px solid var(--learning-border)",
                borderRadius: 8,
                background: "#fff",
              }}
            >
              <h3 style={{ margin: 0 }}>Submit your task</h3>
              <p
                className="course-learning-task-notice"
                style={{ margin: 0, fontSize: 12, fontWeight: 500, lineHeight: 1.6 }}
              >
                Upload one PDF, DOC, DOCX, PNG, or JPG file up to 10 MB.
                Uploading again replaces your previous submission.
              </p>
              {taskSubmission && (
                <div className="course-learning-task-submission">
                  <CheckCircle2 size={18} />
                  <span>
                    Submitted:{" "}
                    <a
                      href={taskSubmission.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {taskSubmission.fileName}
                    </a>
                  </span>
                </div>
              )}
              <label
                className="course-learning-file-picker"
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  minHeight: 46,
                  padding: "8px 10px 8px 14px",
                  overflow: "hidden",
                  border: "1px solid var(--learning-border)",
                  borderRadius: 6,
                  background: "var(--learning-paper)",
                  color: "var(--learning-muted)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  lineHeight: 1.5,
                }}
              >
                <span
                  style={{
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {taskFile ? taskFile.name : "Choose a file to upload"}
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    flex: "0 0 auto",
                    padding: "7px 11px",
                    border: "1px solid var(--learning-border)",
                    borderRadius: 5,
                    background: "#fff",
                    color: "var(--learning-accent)",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  Browse
                </span>
                <input
                  type="file"
                  aria-label="Choose a task file to upload"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    cursor: "pointer",
                  }}
                  onFocus={(event) => {
                    event.currentTarget.parentElement.style.borderColor = "var(--learning-accent)";
                    event.currentTarget.parentElement.style.boxShadow = "0 0 0 2px rgb(164 94 58 / 16%)";
                  }}
                  onBlur={(event) => {
                    event.currentTarget.parentElement.style.borderColor = "var(--learning-border)";
                    event.currentTarget.parentElement.style.boxShadow = "none";
                  }}
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setTaskFiles((current) => ({
                      ...current,
                      [selectedEntry.key]: file,
                    }));
                    setTaskErrors((current) => ({
                      ...current,
                      [selectedEntry.key]: "",
                    }));
                  }}
                />
              </label>
              <button
                type="button"
                className="course-learning-button course-learning-button-primary"
                onClick={() => uploadTaskFile(lesson, selectedEntry.key)}
                disabled={
                  uploadingTaskKey === selectedEntry.key || !taskFile
                }
              >
                {uploadingTaskKey === selectedEntry.key ? (
                  <LoaderCircle
                    className="course-learning-spinner"
                    size={17}
                  />
                ) : (
                  <ArrowRight size={17} />
                )}
                {uploadingTaskKey === selectedEntry.key
                  ? "Uploading..."
                  : "Upload task"}
              </button>
              {taskErrors[selectedEntry.key] && (
                <p className="course-learning-message is-error" role="alert">
                  {taskErrors[selectedEntry.key]}
                </p>
              )}
            </section>
          </div>
        );
      }
      default:
        return (
          <div className="course-learning-content-note">
            <BookOpen size={24} />
            <p>This lesson type is not supported yet.</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <main className="course-learning-page">
        <div className="course-learning-state">
          <LoaderCircle className="course-learning-spinner" size={34} />
          <h1>Opening your course</h1>
          <p>Getting your learning space ready...</p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="course-learning-page">
        <div className="course-learning-state course-learning-state-error">
          <div className="course-learning-state-icon">
            <LockKeyhole size={25} />
          </div>
          <p className="course-learning-eyebrow">COURSE ACCESS</p>
          <h1>We couldn’t open this course</h1>
          <p>{loadError}</p>
          <div className="course-learning-state-actions">
            <button
              type="button"
              className="course-learning-button course-learning-button-light"
              onClick={() => window.location.reload()}
            >
              <RotateCw size={16} /> Try again
            </button>
            <button
              type="button"
              className="course-learning-back-link"
              onClick={goBack}
            >
              <ArrowLeft size={16} /> Back to ModaAcademy
            </button>
          </div>
        </div>
      </main>
    );
  }

  const courseTitle = course.title || "Untitled course";
  const instructor =
    typeof course.instructor === "string"
      ? course.instructor
      : course.instructor?.name;
  const courseDuration = getDuration(course.durationMinutes);
  const courseLevel = course.level
    ? `${course.level.charAt(0).toUpperCase()}${course.level.slice(1)}`
    : "All levels";

  return (
    <main className="course-learning-page">
      <header className="course-learning-header">
        <div className="course-learning-header-top">
          <button
            type="button"
            className="course-learning-back-link"
            onClick={goBack}
          >
            <ArrowLeft size={17} />
            <span>Back to ModaAcademy</span>
          </button>
          <span className="course-learning-header-brand">
            <GraduationCap size={18} />
            MODAACADEMY
          </span>
        </div>

        {course.coverImage && (
          <div className="course-learning-cover">
            <img src={course.coverImage} alt="" />
          </div>
        )}

        <div className="course-learning-course-intro">
          <div className="course-learning-course-copy">
            <p className="course-learning-eyebrow">YOUR LEARNING SPACE</p>
            <h1>{courseTitle}</h1>
            <p className="course-learning-description">
              {course.shortDescription || course.description || ""}
            </p>
            <div className="course-learning-course-meta">
              <span>
                <GraduationCap size={16} />
                {instructor || "Instructor details unavailable"}
              </span>
              <span>
                <BarChart3 size={16} />
                {courseLevel}
              </span>
              <span>
                <Clock3 size={16} />
                {courseDuration || "Self-paced"}
              </span>
            </div>
          </div>

          <div className="course-learning-progress-card">
            <div className="course-learning-progress-copy">
              <span>COURSE PROGRESS</span>
              <strong>{progress}%</strong>
            </div>
            <div
              className="course-learning-progress-track"
              role="progressbar"
              aria-label="Course progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <p>
              {progressSummary.totalRequiredLessons
                ? `${progressSummary.completedRequiredLessons} / ${progressSummary.totalRequiredLessons} required lessons complete`
                : "No required lessons; progress is 0%"}
            </p>
          </div>
        </div>
      </header>

      <div className="course-learning-layout">
        <aside className="course-learning-sidebar">
          <div className="course-learning-sidebar-heading">
            <div>
              <p className="course-learning-eyebrow">COURSE CONTENT</p>
              <h2>Course outline</h2>
            </div>
            <span className="course-learning-lesson-count">
              {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
            </span>
          </div>

          {!sections.length || !lessons.length ? (
            <div className="course-learning-outline-empty">
              <BookOpen size={22} />
              <p>Course lessons will appear here when they are available.</p>
            </div>
          ) : (
            <nav
              className="course-learning-outline"
              aria-label="Course outline"
            >
              {sections.map((section) => {
                const moduleTitle =
                  section.module?.title || `Module ${section.moduleIndex + 1}`;
                const moduleExpanded = expandedModules.has(section.moduleIndex);
                return (
                  <section
                    className="course-learning-module"
                    key={section.module?._id || `module-${section.moduleIndex}`}
                  >
                    <button
                      type="button"
                      className="course-learning-module-toggle"
                      aria-expanded={moduleExpanded}
                      onClick={() => toggleModule(section.moduleIndex)}
                    >
                      {moduleExpanded ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                      <span>
                        <span className="course-learning-module-kicker">
                          MODULE {section.moduleIndex + 1}
                        </span>
                        <strong>{moduleTitle}</strong>
                      </span>
                    </button>

                    {moduleExpanded && (
                      <div className="course-learning-module-content">
                        {section.lessons.map(renderLessonItem)}
                        {section.submodules.map((submodule) => {
                          const submoduleKey = `${section.moduleIndex}-${submodule.submoduleIndex}`;
                          const submoduleExpanded =
                            expandedSubmodules.has(submoduleKey);
                          return (
                            <div
                              className="course-learning-submodule"
                              key={
                                submodule.submodule?._id ||
                                `submodule-${submoduleKey}`
                              }
                            >
                              <button
                                type="button"
                                className="course-learning-submodule-toggle"
                                aria-expanded={submoduleExpanded}
                                onClick={() =>
                                  toggleSubmodule(
                                    section.moduleIndex,
                                    submodule.submoduleIndex,
                                  )
                                }
                              >
                                {submoduleExpanded ? (
                                  <ChevronDown size={14} />
                                ) : (
                                  <ChevronRight size={14} />
                                )}
                                <span>
                                  {submodule.submodule?.title ||
                                    `Section ${submodule.submoduleIndex + 1}`}
                                </span>
                              </button>
                              {submoduleExpanded && (
                                <div className="course-learning-submodule-lessons">
                                  {submodule.lessons.length ? (
                                    submodule.lessons.map(renderLessonItem)
                                  ) : (
                                    <p className="course-learning-no-lessons">
                                      No lessons in this section yet.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {!section.lessons.length &&
                          !section.submodules.length && (
                            <p className="course-learning-no-lessons">
                              No lessons in this module yet.
                            </p>
                          )}
                      </div>
                    )}
                  </section>
                );
              })}
            </nav>
          )}
        </aside>

        <section className="course-learning-main" aria-live="polite">
          {!lessons.length ? (
            <div className="course-learning-empty">
              <div className="course-learning-empty-icon">
                <BookOpen size={27} />
              </div>
              <p className="course-learning-eyebrow">READY WHEN YOU ARE</p>
              <h2>This course is getting ready</h2>
              <p>
                There aren’t any lessons available yet. Check back soon for new
                course content.
              </p>
            </div>
          ) : !selectedLesson ? (
            <div className="course-learning-empty">
              <div className="course-learning-empty-icon">
                <BookOpen size={27} />
              </div>
              <h2>Select a lesson to begin</h2>
              <p>Choose a lesson from the course outline.</p>
            </div>
          ) : (
            <>
              <div className="course-learning-lesson-topline">
                <span>
                  {selectedEntry.submoduleIndex === null
                    ? `Module ${selectedEntry.moduleIndex + 1}`
                    : `Module ${selectedEntry.moduleIndex + 1} · Section ${selectedEntry.submoduleIndex + 1}`}
                </span>
                <span>
                  LESSON {selectedLessonIndex + 1} OF {lessons.length}
                </span>
              </div>
              <div className="course-learning-lesson-heading">
                <div className="course-learning-lesson-heading-icon">
                  {(() => {
                    const Icon = getLessonIcon(selectedLesson.type);
                    return <Icon size={21} />;
                  })()}
                </div>
                <div>
                  <p className="course-learning-eyebrow">
                    {getLessonTypeLabel(selectedLesson.type)}
                    {getDuration(selectedLesson.durationMinutes) &&
                      ` · ${getDuration(selectedLesson.durationMinutes)}`}
                  </p>
                  <h2>{selectedLesson.title || "Untitled lesson"}</h2>
                  {selectedLesson.description && (
                    <p className="course-learning-lesson-description">
                      {selectedLesson.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="course-learning-content">
                {renderLessonContent(selectedLesson)}
              </div>

              <div className="course-learning-completion">
                {selectedLesson._id ? (
                  <button
                    type="button"
                    className={`course-learning-button${completed ? " is-done" : " course-learning-button-primary"}`}
                    onClick={saveLessonCompletion}
                    disabled={completed || savingLessonId !== null}
                  >
                    {savingLessonId === String(selectedLesson._id) ? (
                      <LoaderCircle
                        className="course-learning-spinner"
                        size={17}
                      />
                    ) : completed ? (
                      <Check size={17} />
                    ) : (
                      <CheckCircle2 size={17} />
                    )}
                    {completed
                      ? "Lesson completed"
                      : savingLessonId === String(selectedLesson._id)
                        ? "Saving progress..."
                        : "Mark lesson complete"}
                  </button>
                ) : (
                  <p className="course-learning-track-note">
                    Progress tracking is unavailable for this lesson.
                  </p>
                )}
                {saveError && (
                  <p className="course-learning-message is-error" role="alert">
                    {saveError}
                  </p>
                )}
                {saveMessage && (
                  <p
                    className="course-learning-message is-success"
                    role="status"
                  >
                    {saveMessage}
                  </p>
                )}
              </div>

              <nav
                className="course-learning-lesson-navigation"
                aria-label="Lesson navigation"
              >
                <button
                  type="button"
                  className="course-learning-nav-button"
                  onClick={() => moveLesson(-1)}
                  disabled={selectedLessonIndex <= 0}
                >
                  <ArrowLeft size={17} />
                  <span>
                    <small>PREVIOUS</small>
                    Previous lesson
                  </span>
                </button>
                <button
                  type="button"
                  className="course-learning-nav-button is-next"
                  onClick={() => moveLesson(1)}
                  disabled={selectedLessonIndex >= lessons.length - 1}
                >
                  <span>
                    <small>NEXT</small>
                    Next lesson
                  </span>
                  <ArrowRight size={17} />
                </button>
              </nav>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default CourseLearning;
