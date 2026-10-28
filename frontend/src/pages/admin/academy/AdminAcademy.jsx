import { useEffect, useState } from "react";
import {
  GraduationCap,
  Users,
  Search,
  Eye,
  Trash2,
  X,
  Mail,
  Phone,
  CalendarDays,
  BookOpen,
  Clock,
  BarChart3,
  Plus,
  Pencil,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import "./AdminAcademy.css";
import "./AdminAcademy-course-modal.css";

const emptyCourseForm = {
  title: "", subtitle: "", description: "", shortDescription: "",
  category: "", level: "beginner", coverImage: "", tags: "",
  isFeatured: false, status: "draft", modules: [],
};

const normalizeLesson = (lesson = {}, index = 0) => ({
  _id: lesson._id,
  title: lesson.title || "",
  description: lesson.description || "",
  type: lesson.type || "article",
  content: lesson.content || "",
  videoUrl: lesson.videoUrl || "",
  quizQuestions: (lesson.quizQuestions || []).map((q) => ({
    _id: q._id,
    question: q.question || "",
    options: Array.isArray(q.options) && q.options.length ? [...q.options] : ["", ""],
    correctAnswerIndex: Number(q.correctAnswerIndex ?? 0),
  })),
  passingScore: lesson.passingScore ?? 70,
  taskInstructions: lesson.taskInstructions || "",
  submissionRequirements: lesson.submissionRequirements || "",
  durationMinutes: lesson.durationMinutes ?? 1,
  order: lesson.order || index + 1,
  isRequired: lesson.isRequired !== false,
});

const createEmptyLesson = (order = 1) => normalizeLesson({}, order - 1);
const createEmptySubmodule = (order = 1) => ({ title: "", description: "", order, lessons: [] });
const createEmptyModule = (order = 1) => ({ title: "", description: "", order, lessons: [], submodules: [] });

const lessonHasContent = (lesson) => Boolean(
  lesson.title?.trim() || lesson.description?.trim() || lesson.content?.trim() ||
  lesson.videoUrl?.trim() || lesson.taskInstructions?.trim() ||
  lesson.submissionRequirements?.trim() || (lesson.quizQuestions || []).some((q) =>
    q.question?.trim() || (q.options || []).some((option) => option.trim())
  )
);

const normalizeSubmodule = (submodule = {}, index = 0) => ({
  _id: submodule._id,
  title: submodule.title || "",
  description: submodule.description || "",
  order: submodule.order || index + 1,
  lessons: (submodule.lessons || []).map(normalizeLesson),
});

const normalizeModule = (module = {}, index = 0) => {
  const legacyHasLesson = Boolean(
    module.content || module.videoUrl || module.taskInstructions || (module.quizQuestions || []).length
  );
  return {
    _id: module._id,
    title: module.title || "",
    description: module.description || "",
    order: module.order || index + 1,
    lessons: (module.lessons || (legacyHasLesson ? [{
      title: module.title || "Existing Lesson", description: module.description || "",
      type: module.type || "article", content: module.content || "", videoUrl: module.videoUrl || "",
      quizQuestions: module.quizQuestions || [], passingScore: module.passingScore ?? 70,
      taskInstructions: module.taskInstructions || "", submissionRequirements: module.submissionRequirements || "",
      durationMinutes: module.durationMinutes ?? 1,
    }] : [])).map(normalizeLesson),
    submodules: (module.submodules || []).map(normalizeSubmodule),
  };
};

function AdminAcademy() {
  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [updatingCourseId, setUpdatingCourseId] = useState(null);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [savingCourse, setSavingCourse] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState(null);
  const [collapsedModules, setCollapsedModules] = useState({});
  const [collapsedSubmodules, setCollapsedSubmodules] = useState({});
  const [collapsedLessons, setCollapsedLessons] = useState({});

  const getToken = () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("You are not logged in.");
    return token;
  };

  const readResult = async (response, fallback) => {
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || fallback);
    return result;
  };

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = await fetch("/api/modasphere/academy/admin/courses", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const result = await readResult(response, "Failed to load courses.");
      setCourses(result.courses || []);
    } catch (error) {
      console.error("Failed to load ModaAcademy courses:", error);
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadEnrollments = async () => {
    try {
      setLoadingEnrollments(true);
      const response = await fetch("/api/modasphere/academy/enrollments", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const result = await readResult(response, "Failed to load enrollments.");
      setEnrollments(result.data || []);
    } catch (error) {
      console.error("Failed to load ModaAcademy enrollments:", error);
      setEnrollments([]);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  useEffect(() => {
    loadCourses();
    loadEnrollments();
  }, []);

  const openCreateCourse = () => {
    setEditingCourse(null);
    setCourseForm({ ...emptyCourseForm, modules: [] });
    setCourseModalOpen(true);
  };

  const openEditCourse = (course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title || "",
      subtitle: course.subtitle || "",
      description: course.description || "",
      shortDescription: course.shortDescription || "",
      category: course.category || "",
      level: course.level || "beginner",
      coverImage: course.coverImage || "",
      tags: Array.isArray(course.tags) ? course.tags.join(", ") : "",
      isFeatured: Boolean(course.isFeatured),
      status: course.status || "draft",
      modules: (course.modules || []).map(normalizeModule),
    });
    setCourseModalOpen(true);
  };

  const updateCourseField = (event) => {
    const { name, value, type, checked } = event.target;
    setCourseForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const updateModuleField = (moduleIndex, field, value) => setCourseForm((current) => ({
    ...current,
    modules: current.modules.map((module, i) =>
      i === moduleIndex ? { ...module, [field]: value } : module
    ),
  }));

  const updateSubmoduleField = (moduleIndex, submoduleIndex, field, value) => setCourseForm((current) => ({
    ...current,
    modules: current.modules.map((module, i) => i !== moduleIndex ? module : {
      ...module,
      submodules: module.submodules.map((sub, j) =>
        j === submoduleIndex ? { ...sub, [field]: value } : sub
      ),
    }),
  }));

  const getLessons = (module, submoduleIndex) => submoduleIndex === null
    ? (module.lessons || [])
    : (module.submodules?.[submoduleIndex]?.lessons || []);

  const setLessons = (moduleIndex, submoduleIndex, nextLessons) => {
    if (submoduleIndex === null) {
      updateModuleField(moduleIndex, "lessons", nextLessons);
    } else {
      updateSubmoduleField(moduleIndex, submoduleIndex, "lessons", nextLessons);
    }
  };

  const addCourseModule = () => setCourseForm((current) => ({
    ...current,
    modules: [...current.modules, createEmptyModule(current.modules.length + 1)],
  }));

  const toggleModule = (moduleIndex) => {
    setCollapsedModules((current) => ({
      ...current,
      [moduleIndex]: !(current[moduleIndex] ?? true),
    }));
  };

  const toggleSubmodule = (moduleIndex, submoduleIndex) => {
    const key = `${moduleIndex}-${submoduleIndex}`;

    setCollapsedSubmodules((current) => ({
      ...current,
      [key]: !(current[key] ?? true),
    }));
  };

  const toggleLesson = (moduleIndex, submoduleIndex, lessonIndex) => {
    const key = `${moduleIndex}-${submoduleIndex ?? "direct"}-${lessonIndex}`;

    setCollapsedLessons((current) => ({
      ...current,
      [key]: !(current[key] ?? true),
    }));
  };

  const removeCourseModule = (moduleIndex) => setCourseForm((current) => ({
    ...current,
    modules: current.modules
      .filter((_, i) => i !== moduleIndex)
      .map((m, i) => ({ ...m, order: i + 1 })),
  }));

  const addSubmodule = (moduleIndex) => {
    const module = courseForm.modules[moduleIndex];
    updateModuleField(moduleIndex, "submodules", [
      ...module.submodules,
      createEmptySubmodule(module.submodules.length + 1),
    ]);
  };

  const removeSubmodule = (moduleIndex, submoduleIndex) => {
    const module = courseForm.modules[moduleIndex];
    updateModuleField(
      moduleIndex,
      "submodules",
      module.submodules
        .filter((_, i) => i !== submoduleIndex)
        .map((s, i) => ({ ...s, order: i + 1 }))
    );
  };

  const addLesson = (moduleIndex, submoduleIndex) => {
    const lessons = getLessons(courseForm.modules[moduleIndex], submoduleIndex);
    setLessons(moduleIndex, submoduleIndex, [
      ...lessons,
      createEmptyLesson(lessons.length + 1),
    ]);
  };

  const removeLesson = (moduleIndex, submoduleIndex, lessonIndex) => {
    const lessons = getLessons(courseForm.modules[moduleIndex], submoduleIndex);
    setLessons(
      moduleIndex,
      submoduleIndex,
      lessons
        .filter((_, i) => i !== lessonIndex)
        .map((l, i) => ({ ...l, order: i + 1 }))
    );
  };

  const updateLessonField = (moduleIndex, submoduleIndex, lessonIndex, field, value) => {
    const lessons = getLessons(courseForm.modules[moduleIndex], submoduleIndex);
    setLessons(
      moduleIndex,
      submoduleIndex,
      lessons.map((l, i) => i === lessonIndex ? { ...l, [field]: value } : l)
    );
  };

  const addQuizQuestion = (mi, si, li) => {
    const lesson = getLessons(courseForm.modules[mi], si)[li];
    updateLessonField(mi, si, li, "quizQuestions", [
      ...lesson.quizQuestions,
      { question: "", options: ["", ""], correctAnswerIndex: 0 },
    ]);
  };

  const updateQuizQuestion = (mi, si, li, qi, field, value) => {
    const lesson = getLessons(courseForm.modules[mi], si)[li];
    updateLessonField(
      mi, si, li, "quizQuestions",
      lesson.quizQuestions.map((q, i) => i === qi ? { ...q, [field]: value } : q)
    );
  };

  const updateQuizOption = (mi, si, li, qi, oi, value) => {
    const lesson = getLessons(courseForm.modules[mi], si)[li];
    updateLessonField(
      mi, si, li, "quizQuestions",
      lesson.quizQuestions.map((q, i) => i !== qi ? q : {
        ...q,
        options: q.options.map((option, j) => j === oi ? value : option),
      })
    );
  };

  const addQuizOption = (mi, si, li, qi) => {
    const lesson = getLessons(courseForm.modules[mi], si)[li];
    updateLessonField(
      mi, si, li, "quizQuestions",
      lesson.quizQuestions.map((q, i) =>
        i === qi ? { ...q, options: [...q.options, ""] } : q
      )
    );
  };

  const removeQuizOption = (mi, si, li, qi, oi) => {
    const lesson = getLessons(courseForm.modules[mi], si)[li];
    const question = lesson.quizQuestions[qi];

    if (question.options.length <= 2) {
      return window.alert("A quiz question must have at least two options.");
    }

    let correctAnswerIndex = Number(question.correctAnswerIndex);
    if (oi === correctAnswerIndex) correctAnswerIndex = 0;
    else if (oi < correctAnswerIndex) correctAnswerIndex -= 1;

    updateLessonField(
      mi, si, li, "quizQuestions",
      lesson.quizQuestions.map((q, i) => i !== qi ? q : {
        ...q,
        options: q.options.filter((_, j) => j !== oi),
        correctAnswerIndex,
      })
    );
  };

  const removeQuizQuestion = (mi, si, li, qi) => {
    const lesson = getLessons(courseForm.modules[mi], si)[li];
    updateLessonField(
      mi, si, li, "quizQuestions",
      lesson.quizQuestions.filter((_, i) => i !== qi)
    );
  };

  const validateLesson = (lesson, label) => {
    if (!lessonHasContent(lesson)) return true;

    if (!lesson.title.trim()) {
      window.alert(`Enter a title for ${label}.`);
      return false;
    }

    if (!Number.isInteger(Number(lesson.durationMinutes)) || Number(lesson.durationMinutes) < 1) {
      window.alert(`${label} must have a duration of at least 1 minute.`);
      return false;
    }

    if (lesson.type === "article" && !lesson.content.trim()) {
      window.alert(`Enter article content for ${label}.`);
      return false;
    }

    if (lesson.type === "video" && !lesson.videoUrl.trim()) {
      window.alert(`Enter a video URL for ${label}.`);
      return false;
    }

    if (lesson.type === "task" && !lesson.taskInstructions.trim()) {
      window.alert(`Enter task instructions for ${label}.`);
      return false;
    }

    if (lesson.type === "quiz") {
      if (!lesson.quizQuestions.length) {
        window.alert(`Add at least one question to ${label}.`);
        return false;
      }

      if (
        !Number.isInteger(Number(lesson.passingScore)) ||
        Number(lesson.passingScore) < 0 ||
        Number(lesson.passingScore) > 100
      ) {
        window.alert(`The passing score for ${label} must be between 0 and 100.`);
        return false;
      }

      for (let qi = 0; qi < lesson.quizQuestions.length; qi += 1) {
        const q = lesson.quizQuestions[qi];

        if (!q.question.trim()) {
          window.alert(`Enter Question ${qi + 1} in ${label}.`);
          return false;
        }

        if (q.options.length < 2 || q.options.some((o) => !o.trim())) {
          window.alert(`Every question in ${label} needs at least two non-empty options.`);
          return false;
        }

        const answer = Number(q.correctAnswerIndex);
        if (!Number.isInteger(answer) || answer < 0 || answer >= q.options.length) {
          window.alert(`Choose a valid correct answer for Question ${qi + 1}.`);
          return false;
        }
      }
    }

    return true;
  };

  const serializeLesson = (lesson, index) => ({
    ...(lesson._id ? { _id: lesson._id } : {}),
    title: lesson.title.trim(),
    description: lesson.description.trim(),
    type: lesson.type,
    content: lesson.type === "article" ? lesson.content.trim() : "",
    videoUrl: lesson.type === "video" ? lesson.videoUrl.trim() : "",
    quizQuestions: lesson.type === "quiz" ? lesson.quizQuestions.map((q) => ({
      ...(q._id ? { _id: q._id } : {}),
      question: q.question.trim(),
      options: q.options.map((o) => o.trim()),
      correctAnswerIndex: Number(q.correctAnswerIndex),
    })) : [],
    passingScore: Number(lesson.passingScore ?? 70),
    taskInstructions: lesson.type === "task" ? lesson.taskInstructions.trim() : "",
    submissionRequirements: lesson.type === "task" ? lesson.submissionRequirements.trim() : "",
    durationMinutes: Number(lesson.durationMinutes) || 1,
    order: index + 1,
    isRequired: lesson.isRequired !== false,
  });

  const handleCourseSubmit = async (event) => {
    event.preventDefault();

    if (!courseForm.title.trim() || !courseForm.description.trim() || !courseForm.category.trim()) {
      window.alert("Please enter the course title, description, and category.");
      return;
    }

    for (let mi = 0; mi < courseForm.modules.length; mi += 1) {
      const module = courseForm.modules[mi];

      if (!module.title.trim()) {
        window.alert(`Enter a title for Module ${mi + 1}.`);
        return;
      }

      const directLessons = module.lessons || [];
      for (let li = 0; li < directLessons.length; li += 1) {
        if (!validateLesson(directLessons[li], `Lesson ${li + 1} in Module ${mi + 1}`)) return;
      }

      for (let si = 0; si < (module.submodules || []).length; si += 1) {
        const sub = module.submodules[si];
        const activeLessons = (sub.lessons || []).filter(lessonHasContent);
        const subHasContent = Boolean(sub.title.trim() || sub.description.trim() || activeLessons.length);

        if (!subHasContent) continue;

        if (!sub.title.trim()) {
          window.alert(`Enter a title for Submodule ${si + 1} in Module ${mi + 1}.`);
          return;
        }

        for (let li = 0; li < (sub.lessons || []).length; li += 1) {
          if (!validateLesson(sub.lessons[li], `Lesson ${li + 1} in Submodule ${si + 1}, Module ${mi + 1}`)) return;
        }
      }
    }

    const payload = {
      title: courseForm.title.trim(),
      subtitle: courseForm.subtitle.trim(),
      description: courseForm.description.trim(),
      shortDescription: courseForm.shortDescription.trim(),
      category: courseForm.category.trim(),
      level: courseForm.level,
      coverImage: courseForm.coverImage.trim(),
      tags: courseForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      isFeatured: courseForm.isFeatured,
      modules: courseForm.modules.map((module, mi) => ({
        ...(module._id ? { _id: module._id } : {}),
        title: module.title.trim(),
        description: module.description.trim(),
        order: mi + 1,
        lessons: (module.lessons || []).filter(lessonHasContent).map(serializeLesson),
        submodules: (module.submodules || [])
          .filter((sub) => sub.title.trim() || sub.description.trim() || (sub.lessons || []).some(lessonHasContent))
          .map((sub, si) => ({
            ...(sub._id ? { _id: sub._id } : {}),
            title: sub.title.trim(),
            description: sub.description.trim(),
            order: si + 1,
            lessons: (sub.lessons || []).filter(lessonHasContent).map(serializeLesson),
          })),
      })),
    };

    try {
      setSavingCourse(true);
      const isEditing = Boolean(editingCourse);
      const response = await fetch(
        isEditing
          ? `/api/modasphere/academy/courses/${editingCourse._id}`
          : "/api/modasphere/academy/courses",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(isEditing ? payload : { ...payload, status: courseForm.status }),
        }
      );

      const result = await readResult(response, "Failed to save course.");

      if (isEditing) {
        setCourses((current) =>
          current.map((c) => c._id === editingCourse._id ? result.course : c)
        );
      } else {
        setCourses((current) => [result.course, ...current]);
      }

      setCourseModalOpen(false);
      setEditingCourse(null);
      setCourseForm({ ...emptyCourseForm, modules: [] });
      window.alert(isEditing ? "Course updated successfully." : "Course created successfully.");
    } catch (error) {
      console.error("Failed to save ModaAcademy course:", error);
      window.alert(error.message || "Failed to save course.");
    } finally {
      setSavingCourse(false);
    }
  };

  const handleCourseStatusToggle = async (course) => {
    const status = course.status === "published" ? "draft" : "published";

    try {
      setUpdatingCourseId(course._id);
      const response = await fetch(`/api/modasphere/academy/courses/${course._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status }),
      });

      const result = await readResult(response, "Failed to update course status.");
      setCourses((current) => current.map((c) => c._id === course._id ? result.course : c));
    } catch (error) {
      window.alert(error.message || "Failed to update course status.");
    } finally {
      setUpdatingCourseId(null);
    }
  };

  const handleDeleteCourse = async (course) => {
    const enrolledCount = enrollments.filter(
      (e) => String(e.courseId?._id || e.courseId) === String(course._id)
    ).length;

    if (enrolledCount) {
      return window.alert(`This course has ${enrolledCount} enrollment(s). Delete those enrollments first.`);
    }

    if (!window.confirm(`Delete "${course.title}" permanently? This action cannot be undone.`)) return;

    try {
      setDeletingCourseId(course._id);
      const response = await fetch(`/api/modasphere/academy/courses/${course._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      await readResult(response, "Failed to delete course.");
      setCourses((current) => current.filter((c) => c._id !== course._id));
    } catch (error) {
      window.alert(error.message || "Failed to delete course.");
    } finally {
      setDeletingCourseId(null);
    }
  };

  const handleDeleteEnrollment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this enrollment?")) return;

    try {
      const response = await fetch(`/api/modasphere/academy/enrollments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      await readResult(response, "Failed to delete enrollment.");
      setEnrollments((current) => current.filter((e) => e._id !== id));
      if (selectedEnrollment?._id === id) setSelectedEnrollment(null);
    } catch (error) {
      window.alert(error.message || "Failed to delete enrollment.");
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
      ? date
      : parsed.toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      });
  };

  const filteredEnrollments = enrollments.filter((e) => {
    const search = searchTerm.toLowerCase().trim();
    return !search || [
      e.enrollmentId, e.name, e.email, e.courseName, e.experience, e.status,
    ].some((v) => v?.toLowerCase().includes(search));
  });

  const activeEnrollments = enrollments.filter((e) => e.status === "Enrolled").length;
  const completedEnrollments = enrollments.filter((e) => Number(e.progress) >= 100).length;

  const renderLesson = (moduleIndex, submoduleIndex, lesson, lessonIndex) => {
    const update = (field, value) =>
      updateLessonField(moduleIndex, submoduleIndex, lessonIndex, field, value);

    const lessonKey =
      `${moduleIndex}-${submoduleIndex ?? "direct"}-${lessonIndex}`;

    const isLessonCollapsed = collapsedLessons[lessonKey] ?? true;

    return (
      <div
        className="admin-academy-module-card"
        key={
          lesson._id ||
          `lesson-${moduleIndex}-${submoduleIndex ?? "direct"}-${lessonIndex}`
        }
      >
        <div className="admin-academy-module-card-heading editor-module-header">
          <button
            type="button"
            className="editor-collapse-header"
            onClick={() =>
              toggleLesson(moduleIndex, submoduleIndex, lessonIndex)
            }
            aria-expanded={!isLessonCollapsed}
          >
            {isLessonCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronDown size={18} />
            )}

            <strong>
              {lesson.title?.trim() || `Lesson ${lessonIndex + 1}`}
            </strong>

            <span className="editor-collapse-label">
              {lesson.type || "article"}
            </span>
          </button>

          <button
            type="button"
            className="admin-academy-module-remove"
            onClick={() =>
              removeLesson(moduleIndex, submoduleIndex, lessonIndex)
            }
          >
            <Trash2 size={14} /> Remove lesson
          </button>
        </div>

        {!isLessonCollapsed && (
          <div className="editor-collapse-content">
            <div className="admin-academy-course-form">
              <label className="admin-academy-form-field">
                Lesson title
                <input
                  value={lesson.title}
                  onChange={(e) => update("title", e.target.value)}
                  maxLength={200}
                />
              </label>

              <label className="admin-academy-form-field">
                Lesson type
                <select
                  value={lesson.type}
                  onChange={(e) => update("type", e.target.value)}
                >
                  <option value="article">Article</option>
                  <option value="video">Video</option>
                  <option value="quiz">Quiz</option>
                  <option value="task">Task</option>
                </select>
              </label>

              <label className="admin-academy-form-field">
                Duration (minutes)
                <input
                  type="number"
                  min="1"
                  value={lesson.durationMinutes}
                  onChange={(e) =>
                    update("durationMinutes", e.target.value)
                  }
                />
              </label>

              <label className="admin-academy-form-field admin-academy-form-field-full">
                Lesson description
                <textarea
                  value={lesson.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={2}
                  maxLength={500}
                />
              </label>

              {lesson.type === "article" && (
                <label className="admin-academy-form-field admin-academy-form-field-full">
                  Article content
                  <textarea
                    value={lesson.content}
                    onChange={(e) => update("content", e.target.value)}
                    rows={6}
                  />
                </label>
              )}

              {lesson.type === "video" && (
                <label className="admin-academy-form-field admin-academy-form-field-full">
                  Video URL
                  <input
                    type="url"
                    value={lesson.videoUrl}
                    onChange={(e) => update("videoUrl", e.target.value)}
                    placeholder="https://..."
                  />
                </label>
              )}

              {lesson.type === "task" && (
                <>
                  <label className="admin-academy-form-field admin-academy-form-field-full">
                    Task instructions
                    <textarea
                      value={lesson.taskInstructions}
                      onChange={(e) =>
                        update("taskInstructions", e.target.value)
                      }
                      rows={4}
                    />
                  </label>

                  <label className="admin-academy-form-field admin-academy-form-field-full">
                    Submission requirements
                    <textarea
                      value={lesson.submissionRequirements}
                      onChange={(e) =>
                        update("submissionRequirements", e.target.value)
                      }
                      rows={3}
                    />
                  </label>
                </>
              )}

              {lesson.type === "quiz" && (
                <div className="admin-academy-form-field-full">
                  <label className="admin-academy-form-field">
                    Passing score (%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={lesson.passingScore}
                      onChange={(e) =>
                        update("passingScore", e.target.value)
                      }
                    />
                  </label>

                  <div className="admin-academy-module-heading">
                    <div>
                      <h4>Quiz questions</h4>
                      <p>Add answer options and choose the correct one.</p>
                    </div>

                    <button
                      type="button"
                      className="admin-academy-secondary-button"
                      onClick={() =>
                        addQuizQuestion(
                          moduleIndex,
                          submoduleIndex,
                          lessonIndex
                        )
                      }
                    >
                      <Plus size={15} /> Add question
                    </button>
                  </div>

                  {lesson.quizQuestions.map((q, qi) => (
                    <div
                      className="admin-academy-module-card"
                      key={q._id || `question-${qi}`}
                    >
                      <div className="admin-academy-module-card-heading editor-module-header">
                        <strong>Question {qi + 1}</strong>

                        <button
                          type="button"
                          className="admin-academy-module-remove"
                          onClick={() =>
                            removeQuizQuestion(
                              moduleIndex,
                              submoduleIndex,
                              lessonIndex,
                              qi
                            )
                          }
                        >
                          <Trash2 size={14} /> Remove question
                        </button>
                      </div>

                      <label className="admin-academy-form-field admin-academy-form-field-full">
                        Question
                        <textarea
                          value={q.question}
                          onChange={(e) =>
                            updateQuizQuestion(
                              moduleIndex,
                              submoduleIndex,
                              lessonIndex,
                              qi,
                              "question",
                              e.target.value
                            )
                          }
                          rows={2}
                        />
                      </label>

                      {q.options.map((option, oi) => (
                        <div
                          className="admin-academy-course-form"
                          key={`option-${oi}`}
                        >
                          <label className="admin-academy-form-field">
                            Option {oi + 1}
                            <input
                              value={option}
                              onChange={(e) =>
                                updateQuizOption(
                                  moduleIndex,
                                  submoduleIndex,
                                  lessonIndex,
                                  qi,
                                  oi,
                                  e.target.value
                                )
                              }
                            />
                          </label>

                          <button
                            type="button"
                            className="admin-academy-module-remove"
                            onClick={() =>
                              removeQuizOption(
                                moduleIndex,
                                submoduleIndex,
                                lessonIndex,
                                qi,
                                oi
                              )
                            }
                            disabled={q.options.length <= 2}
                          >
                            Remove option
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        className="admin-academy-secondary-button"
                        onClick={() =>
                          addQuizOption(
                            moduleIndex,
                            submoduleIndex,
                            lessonIndex,
                            qi
                          )
                        }
                      >
                        <Plus size={15} /> Add option
                      </button>

                      <label className="admin-academy-form-field">
                        Correct answer
                        <select
                          value={q.correctAnswerIndex}
                          onChange={(e) =>
                            updateQuizQuestion(
                              moduleIndex,
                              submoduleIndex,
                              lessonIndex,
                              qi,
                              "correctAnswerIndex",
                              Number(e.target.value)
                            )
                          }
                        >
                          {q.options.map((option, oi) => (
                            <option key={oi} value={oi}>
                              Option {oi + 1}
                              {option.trim() ? ` — ${option}` : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="admin-academy-page">
      <div className="admin-academy-container">
        <div className="admin-academy-header">
          <div>
            <span className="admin-academy-eyebrow">KAINDRA ADMIN</span>
            <h1>ModaAcademy</h1>
            <p>View and manage course enrollments submitted through ModaAcademy.</p>
          </div>
          <div className="admin-academy-header-icon"><GraduationCap size={32} /></div>
        </div>

        <div className="admin-academy-stats">
          {[
            [Users, "Total Enrollments", enrollments.length],
            [BookOpen, "Active Learners", activeEnrollments],
            [GraduationCap, "Completed", completedEnrollments],
            [BarChart3, "Courses", courses.length],
          ].map(([Icon, label, value]) => (
            <div className="admin-academy-stat-card" key={label}>
              <div className="admin-academy-stat-icon"><Icon size={21} /></div>
              <div><span>{label}</span><strong>{value}</strong></div>
            </div>
          ))}
        </div>

        <section aria-labelledby="admin-academy-courses-heading">
          <div className="admin-academy-toolbar">
            <h2 id="admin-academy-courses-heading">Courses</h2>
            <div className="admin-academy-course-toolbar-actions">
              <span className="admin-academy-result-count">
                {courses.length} course{courses.length !== 1 ? "s" : ""}
              </span>
              <button type="button" className="admin-academy-primary-button" onClick={openCreateCourse}>
                <Plus size={16} /> Create Course
              </button>
            </div>
          </div>

          {loadingCourses ? (
            <div className="admin-academy-empty">
              <GraduationCap size={42} />
              <h2>Loading courses...</h2>
              <p>Fetching ModaAcademy courses.</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="admin-academy-empty">
              <GraduationCap size={42} />
              <h2>No courses found</h2>
              <p>ModaAcademy courses will appear here when they are created.</p>
            </div>
          ) : (
            <div className="admin-academy-table-card">
              <div className="admin-academy-table-wrapper">
                <table className="admin-academy-table">
                  <thead>
                    <tr>
                      <th>Course</th><th>Status</th><th>Enrolled Students</th>
                      <th>Modules</th><th>Duration</th><th>Created</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course._id}>
                        <td><div className="admin-academy-course"><BookOpen size={15} /><span>{course.title || "Untitled course"}</span></div></td>
                        <td><span className="admin-academy-level">{course.status || "draft"}</span></td>
                        <td>
                          {loadingEnrollments ? "—" : enrollments.filter(
                            (e) => String(e.courseId?._id || e.courseId) === String(course._id)
                          ).length}
                        </td>
                        <td>{course.modules?.length ?? 0}</td>
                        <td>{Number(course.durationMinutes) || 0} min</td>
                        <td><span className="admin-academy-date"><CalendarDays size={14} />{formatDate(course.createdAt)}</span></td>
                        <td>
                          <div className="admin-academy-actions">
                            <button type="button" className="admin-academy-view-button" onClick={() => openEditCourse(course)} title="Edit course">
                              <Pencil size={14} /> Edit
                            </button>
                            <button type="button" className="admin-academy-view-button" onClick={() => handleCourseStatusToggle(course)} disabled={updatingCourseId === course._id}>
                              {updatingCourseId === course._id ? "Updating..." : course.status === "published" ? "Move to draft" : "Publish"}
                            </button>
                            <button type="button" className="admin-academy-delete-button" onClick={() => handleDeleteCourse(course)} disabled={deletingCourseId === course._id} aria-label={`Delete ${course.title}`} title="Delete course">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <div className="admin-academy-toolbar">
          <div className="admin-academy-search">
            <Search size={18} />
            <input placeholder="Search student, email, course or enrollment ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <span className="admin-academy-result-count">
            {filteredEnrollments.length} enrollment{filteredEnrollments.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loadingEnrollments ? (
          <div className="admin-academy-empty">
            <GraduationCap size={42} />
            <h2>Loading enrollments...</h2>
            <p>Fetching ModaAcademy enrollments.</p>
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="admin-academy-empty">
            <GraduationCap size={42} />
            <h2>No enrollments found</h2>
            <p>ModaAcademy enrollments will appear here when students register for a course.</p>
          </div>
        ) : (
          <div className="admin-academy-table-card">
            <div className="admin-academy-table-wrapper">
              <table className="admin-academy-table">
                <thead>
                  <tr>
                    <th>Enrollment</th><th>Student</th><th>Course</th><th>Level</th>
                    <th>Status</th><th>Progress</th><th>Date</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnrollments.map((e) => (
                    <tr key={e._id}>
                      <td><strong className="admin-academy-id">{e.enrollmentId || "—"}</strong></td>
                      <td><div className="admin-academy-student"><strong>{e.name || "—"}</strong><span>{e.email || "—"}</span></div></td>
                      <td><div className="admin-academy-course"><BookOpen size={15} /><span>{e.courseName || "—"}</span></div></td>
                      <td><span className="admin-academy-level">{e.experience || e.level || "—"}</span></td>
                      <td><span className="admin-academy-status">{e.status || "Enrolled"}</span></td>
                      <td>
                        <div className="admin-academy-progress">
                          <div className="admin-academy-progress-top"><span>{Number(e.progress || 0)}%</span></div>
                          <div className="admin-academy-progress-bar"><span style={{ width: `${Math.min(Number(e.progress || 0), 100)}%` }} /></div>
                        </div>
                      </td>
                      <td><span className="admin-academy-date"><CalendarDays size={14} />{formatDate(e.enrolledAt)}</span></td>
                      <td>
                        <div className="admin-academy-actions">
                          <button type="button" className="admin-academy-view-button" onClick={() => setSelectedEnrollment(e)}><Eye size={15} /> View</button>
                          <button type="button" className="admin-academy-delete-button" onClick={() => handleDeleteEnrollment(e._id)} aria-label="Delete enrollment"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {courseModalOpen && (
        <div className="admin-academy-modal-overlay" onClick={() => { if (!savingCourse) setCourseModalOpen(false); }}>
          <div className="admin-academy-course-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-academy-modal-header">
              <div><span>MODAACADEMY MANAGEMENT</span><h2>{editingCourse ? "Edit Course" : "Create Course"}</h2></div>
              <button type="button" className="admin-academy-modal-close" onClick={() => { if (!savingCourse) setCourseModalOpen(false); }} disabled={savingCourse} aria-label="Close course form"><X size={20} /></button>
            </div>

            <form onSubmit={handleCourseSubmit}>
              <div className="admin-academy-course-form">
                <label className="admin-academy-form-field">Course title *
                  <input name="title" value={courseForm.title} onChange={updateCourseField} required maxLength={200} />
                </label>
                <label className="admin-academy-form-field">Subtitle
                  <input name="subtitle" value={courseForm.subtitle} onChange={updateCourseField} maxLength={300} />
                </label>
                <label className="admin-academy-form-field">Category *
                  <input name="category" value={courseForm.category} onChange={updateCourseField} required placeholder="e.g. Cloud Computing" />
                </label>
                <label className="admin-academy-form-field">Level
                  <select name="level" value={courseForm.level} onChange={updateCourseField}>
                    <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
                  </select>
                </label>
                <label className="admin-academy-form-field admin-academy-form-field-full">Description *
                  <textarea name="description" value={courseForm.description} onChange={updateCourseField} required rows={4} />
                </label>
                <label className="admin-academy-form-field admin-academy-form-field-full">Short description
                  <textarea name="shortDescription" value={courseForm.shortDescription} onChange={updateCourseField} rows={2} maxLength={500} />
                </label>
                <label className="admin-academy-form-field admin-academy-form-field-full">Cover image URL
                  <input name="coverImage" type="url" value={courseForm.coverImage} onChange={updateCourseField} placeholder="https://..." />
                </label>
                <label className="admin-academy-form-field admin-academy-form-field-full">Tags
                  <input name="tags" value={courseForm.tags} onChange={updateCourseField} placeholder="AWS, Linux, DevOps" />
                  <small>Separate tags with commas.</small>
                </label>
                <label className="admin-academy-checkbox-field">
                  <input type="checkbox" name="isFeatured" checked={courseForm.isFeatured} onChange={updateCourseField} /> Featured course
                </label>
                {!editingCourse && (
                  <label className="admin-academy-form-field">Initial status
                    <select name="status" value={courseForm.status} onChange={updateCourseField}>
                      <option value="draft">Draft</option><option value="published">Published</option>
                    </select>
                  </label>
                )}
              </div>

              <div className="admin-academy-module-heading">
                <div><h3>Course modules</h3><p>Each module can contain direct lessons, submodules, both, or neither.</p></div>
                <button type="button" className="admin-academy-secondary-button" onClick={addCourseModule}><Plus size={15} /> Add module</button>
              </div>

              {!courseForm.modules.length ? (
                <p className="admin-academy-no-modules">No modules added yet. You can add them now or edit the course later.</p>
              ) : (
                <div className="admin-academy-module-list">
                  {courseForm.modules.map((module, mi) => {
                    const isCollapsed = collapsedModules[mi] ?? true;

                    return (
                      <div
                        className="admin-academy-module-card"
                        key={module._id || `module-${mi}`}
                      >
                        <div className="admin-academy-module-card-heading editor-module-header">
                          <button
                            type="button"
                            className="editor-collapse-header"
                            onClick={() => toggleModule(mi)}
                            aria-expanded={!isCollapsed}
                          >
                            {isCollapsed ? (
                              <ChevronRight size={18} />
                            ) : (
                              <ChevronDown size={18} />
                            )}

                            <strong>{module.title || `Module ${mi + 1}`}</strong>
                          </button>

                          <button
                            type="button"
                            className="admin-academy-module-remove"
                            onClick={() => removeCourseModule(mi)}
                          >
                            <Trash2 size={14} /> Remove module
                          </button>
                        </div>

                        {!isCollapsed && (
                          <div className="editor-collapse-content">
                            <div className="admin-academy-course-form">
                              <label className="admin-academy-form-field">
                                Module title *
                                <input
                                  value={module.title}
                                  onChange={(e) =>
                                    updateModuleField(mi, "title", e.target.value)
                                  }
                                  maxLength={200}
                                />
                              </label>

                              <label className="admin-academy-form-field admin-academy-form-field-full">
                                Module description
                                <textarea
                                  value={module.description}
                                  onChange={(e) =>
                                    updateModuleField(mi, "description", e.target.value)
                                  }
                                  rows={2}
                                  maxLength={500}
                                />
                              </label>
                            </div>

                            <div className="admin-academy-module-heading">
                              <div>
                                <h4>Direct module lessons</h4>
                                <p>Optional lessons directly inside this module.</p>
                              </div>

                              <button
                                type="button"
                                className="admin-academy-secondary-button"
                                onClick={() => addLesson(mi, null)}
                              >
                                <Plus size={15} /> Add lesson
                              </button>
                            </div>

                            {(module.lessons || []).map((lesson, li) =>
                              renderLesson(mi, null, lesson, li)
                            )}

                            <div className="admin-academy-module-heading">
                              <div>
                                <h4>Submodules</h4>
                                <p>Optional groups of related lessons.</p>
                              </div>

                              <button
                                type="button"
                                className="admin-academy-secondary-button"
                                onClick={() => addSubmodule(mi)}
                              >
                                <Plus size={15} /> Add submodule
                              </button>
                            </div>
                          {(module.submodules || []).map((sub, si) => {
                            const submoduleKey = `${mi}-${si}`;
                            const isSubmoduleCollapsed =
                              collapsedSubmodules[submoduleKey] ?? true;

                            return (
                              <div
                                className="admin-academy-module-card"
                                key={sub._id || `submodule-${mi}-${si}`}
                              >
                                <div className="admin-academy-module-card-heading editor-module-header">
                                  <button
                                    type="button"
                                    className="editor-collapse-header"
                                    onClick={() => toggleSubmodule(mi, si)}
                                    aria-expanded={!isSubmoduleCollapsed}
                                  >
                                    {isSubmoduleCollapsed ? (
                                      <ChevronRight size={18} />
                                    ) : (
                                      <ChevronDown size={18} />
                                    )}

                                    <strong>
                                      {sub.title?.trim() || `Submodule ${mi + 1}.${si + 1}`}
                                    </strong>
                                  </button>

                                  <button
                                    type="button"
                                    className="admin-academy-module-remove"
                                    onClick={() => removeSubmodule(mi, si)}
                                  >
                                    <Trash2 size={14} /> Remove submodule
                                  </button>
                                </div>

                                {!isSubmoduleCollapsed && (
                                  <div className="editor-collapse-content">
                                    <div className="admin-academy-course-form">
                                      <label className="admin-academy-form-field">
                                        Submodule title
                                        <input
                                          value={sub.title}
                                          onChange={(e) =>
                                            updateSubmoduleField(
                                              mi,
                                              si,
                                              "title",
                                              e.target.value
                                            )
                                          }
                                          maxLength={200}
                                        />
                                      </label>

                                      <label className="admin-academy-form-field admin-academy-form-field-full">
                                        Submodule description
                                        <textarea
                                          value={sub.description}
                                          onChange={(e) =>
                                            updateSubmoduleField(
                                              mi,
                                              si,
                                              "description",
                                              e.target.value
                                            )
                                          }
                                          rows={2}
                                          maxLength={500}
                                        />
                                      </label>
                                    </div>

                                    <div className="admin-academy-module-heading">
                                      <div>
                                        <h4>Lessons</h4>
                                        <p>Choose a lesson type and enter its content.</p>
                                      </div>

                                      <button
                                        type="button"
                                        className="admin-academy-secondary-button"
                                        onClick={() => addLesson(mi, si)}
                                      >
                                        <Plus size={15} /> Add lesson
                                      </button>
                                    </div>

                                    {(sub.lessons || []).map((lesson, li) =>
                                      renderLesson(mi, si, lesson, li)
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

                <div className="admin-academy-modal-footer">
                  <button
                    type="button"
                    className="admin-academy-modal-close"
                    onClick={() => {
                      if (!savingCourse) setCourseModalOpen(false);
                    }}
                    disabled={savingCourse}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="admin-academy-primary-button"
                    disabled={savingCourse}
                  >
                    {savingCourse
                      ? "Saving..."
                      : editingCourse
                        ? "Update Course"
                        : "Create Course"}
                  </button>
                </div>     
            </form>
          </div>
        </div>
      )}

      {selectedEnrollment && (
        <div className="admin-academy-modal-overlay" onClick={() => setSelectedEnrollment(null)}>
          <div className="admin-academy-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-academy-modal-header">
              <div><span>ENROLLMENT DETAILS</span><h2>{selectedEnrollment.name || "Student"}</h2></div>
              <button type="button" className="admin-academy-modal-close" onClick={() => setSelectedEnrollment(null)}><X size={20} /></button>
            </div>

            <div className="admin-academy-detail-grid">
              {[
                ["ENROLLMENT ID", selectedEnrollment.enrollmentId || "—"],
                ["COURSE", selectedEnrollment.courseName || "—"],
                ["STUDENT", selectedEnrollment.name || "—"],
                ["EXPERIENCE", selectedEnrollment.experience || "—"],
                ["EMAIL", <><Mail size={15} />{selectedEnrollment.email || "—"}</>],
                ["PHONE", <><Phone size={15} />{selectedEnrollment.phone || "—"}</>],
                ["COURSE LEVEL", selectedEnrollment.level || "—"],
                ["DURATION", <><Clock size={15} />{selectedEnrollment.duration || "—"}</>],
                ["STATUS", selectedEnrollment.status || "Enrolled"],
                ["ENROLLED DATE", formatDate(selectedEnrollment.enrolledAt)],
              ].map(([label, value]) => (
                <div className="admin-academy-detail" key={label}>
                  <span>{label}</span>
                  <strong className={
                    label === "EMAIL" || label === "PHONE" || label === "DURATION"
                      ? "admin-academy-detail-with-icon"
                      : undefined
                  }>
                    {value}
                  </strong>
                </div>
              ))}
            </div>

            <div className="admin-academy-modal-progress">
              <div><span>COURSE PROGRESS</span><strong>{Number(selectedEnrollment.progress || 0)}%</strong></div>
              <div className="admin-academy-modal-progress-bar">
                <span style={{ width: `${Math.min(Number(selectedEnrollment.progress || 0), 100)}%` }} />
              </div>
            </div>

            <div className="admin-academy-modal-footer">
              <button type="button" className="admin-academy-modal-delete" onClick={() => handleDeleteEnrollment(selectedEnrollment._id)}>
                <Trash2 size={16} /> Delete Enrollment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAcademy;