const request = require("supertest");
const app = require("../../src/app");
const ModaCourse = require("../../src/models/modasphere/ModaCourse");
const ModaAcademyEnrollment = require("../../src/models/modasphere/CourseEnrollment");
const { createTestUser } = require("../helpers/testUser");

describe("ModaAcademy course completion validation", () => {
  let student;
  let course;
  let enrollment;
  let lessonIds;

  beforeEach(async () => {
    student = await createTestUser({ name: "Academy Student" });
    course = await ModaCourse.create({
      title: "Course Completion Test",
      slug: `course-completion-${Date.now()}-${Math.random()}`,
      description: "Test course description",
      category: "Design",
      instructor: student.userId,
      createdBy: student.userId,
      status: "published",
      modules: [
        {
          title: "Course Module",
          lessons: [
            { title: "Article lesson", type: "article", content: "Lesson text" },
            { title: "Task lesson", type: "task", taskInstructions: "Upload a file" },
            {
              title: "Quiz lesson",
              type: "quiz",
              passingScore: 100,
              quizQuestions: [
                {
                  question: "Correct answer?",
                  options: ["Incorrect", "Correct"],
                  correctAnswerIndex: 1,
                },
              ],
            },
            {
              title: "Optional lesson",
              type: "article",
              content: "Optional lesson text",
              isRequired: false,
            },
          ],
        },
      ],
    });

    const lessons = course.modules[0].lessons;
    lessonIds = {
      article: String(lessons[0]._id),
      task: String(lessons[1]._id),
      quiz: String(lessons[2]._id),
      optional: String(lessons[3]._id),
    };

    enrollment = await ModaAcademyEnrollment.create({
      enrollmentId: `MA-test-${Date.now()}-${Math.random()}`,
      courseId: String(course._id),
      courseName: course.title,
      category: course.category,
      level: course.level,
      duration: "Self-paced",
      instructor: "Test Instructor",
      name: student.user.name,
      email: student.user.email,
    });
  });

  const progressRequest = (completedLessonIds) =>
    request(app)
      .patch(`/api/modasphere/academy/enrollments/course/${course.id}/progress`)
      .set("Authorization", `Bearer ${student.token}`)
      .send({ completedLessonIds });

  test("requires valid lesson, submitted task, and server-passed quiz before completion", async () => {
    const unknownLessonResponse = await progressRequest([
      "507f1f77bcf86cd799439011",
    ]);
    expect(unknownLessonResponse.status).toBe(400);
    expect((await ModaAcademyEnrollment.findById(enrollment.id)).progress).toBe(0);

    const articleResponse = await progressRequest([lessonIds.article]);
    expect(articleResponse.status).toBe(200);
    expect(articleResponse.body.progress).toBe(33);

    const taskBeforeUploadResponse = await progressRequest([
      lessonIds.article,
      lessonIds.task,
    ]);
    expect(taskBeforeUploadResponse.status).toBe(400);
    expect(taskBeforeUploadResponse.body.message).toMatch(/submit the required task/i);

    enrollment = await ModaAcademyEnrollment.findById(enrollment.id);
    enrollment.taskSubmissions = [
      {
        lessonId: lessonIds.task,
        fileUrl: "https://example.com/task.pdf",
        filePublicId: "academy-task-test",
        fileName: "task.pdf",
        mimeType: "application/pdf",
        fileSize: 64,
      },
    ];
    await enrollment.save();

    const taskCompletionResponse = await progressRequest([
      lessonIds.article,
      lessonIds.task,
    ]);
    expect(taskCompletionResponse.status).toBe(200);
    expect(taskCompletionResponse.body.progress).toBe(67);

    const quizBeforePassResponse = await progressRequest([
      lessonIds.article,
      lessonIds.task,
      lessonIds.quiz,
    ]);
    expect(quizBeforePassResponse.status).toBe(400);
    expect(quizBeforePassResponse.body.message).toMatch(/pass the quiz/i);

    const quizUrl = `/api/modasphere/academy/enrollments/course/${course.id}/quizzes/${lessonIds.quiz}/submit`;
    const failedQuizResponse = await request(app)
      .post(quizUrl)
      .set("Authorization", `Bearer ${student.token}`)
      .send({ answers: [0] });
    expect(failedQuizResponse.status).toBe(200);
    expect(failedQuizResponse.body.passed).toBe(false);
    expect(failedQuizResponse.body.progress).toBe(67);

    const passedQuizResponse = await request(app)
      .post(quizUrl)
      .set("Authorization", `Bearer ${student.token}`)
      .send({ answers: [1] });
    expect(passedQuizResponse.status).toBe(200);
    expect(passedQuizResponse.body.passed).toBe(true);
    expect(passedQuizResponse.body.progress).toBe(100);
    expect(passedQuizResponse.body.totalRequiredLessons).toBe(3);
    expect(passedQuizResponse.body.status).toBe("Completed");
    expect(passedQuizResponse.body.completedAt).toBeTruthy();

    const savedEnrollment = await ModaAcademyEnrollment.findById(enrollment.id);
    expect(savedEnrollment.completedLessonIds).toEqual(
      expect.arrayContaining([
        lessonIds.article,
        lessonIds.task,
        lessonIds.quiz,
      ]),
    );
    expect(savedEnrollment.completedLessonIds).not.toContain(lessonIds.optional);
    expect(savedEnrollment.passedQuizLessonIds).toContain(lessonIds.quiz);
    expect(savedEnrollment.progress).toBe(100);
    expect(savedEnrollment.status).toBe("Completed");
    const originalCompletedAt = savedEnrollment.completedAt.getTime();

    const repeatedCompletionResponse = await progressRequest(
      Object.values(lessonIds),
    );
    expect(repeatedCompletionResponse.status).toBe(200);
    expect(
      new Date(repeatedCompletionResponse.body.completedAt).getTime(),
    ).toBe(originalCompletedAt);

    const enrolledCourseResponse = await request(app)
      .get(`/api/modasphere/academy/courses/id/${course.id}`)
      .set("Authorization", `Bearer ${student.token}`);
    expect(enrolledCourseResponse.status).toBe(200);
    expect(enrolledCourseResponse.body.progress).toBe(100);
    expect(enrolledCourseResponse.body.completedLessonIds).toEqual(
      expect.arrayContaining([
        lessonIds.article,
        lessonIds.task,
        lessonIds.quiz,
      ]),
    );
    expect(enrolledCourseResponse.body.completedAt).toBe(
      repeatedCompletionResponse.body.completedAt,
    );
  });

  test("removes unverifiable legacy quiz and task completions when recalculating progress", async () => {
    enrollment.completedLessonIds = [
      lessonIds.task,
      lessonIds.quiz,
      "507f1f77bcf86cd799439011",
    ];
    enrollment.progress = 100;
    enrollment.status = "Completed";
    await enrollment.save();

    const response = await request(app)
      .get(`/api/modasphere/academy/courses/id/${course.id}`)
      .set("Authorization", `Bearer ${student.token}`);

    expect(response.status).toBe(200);
    expect(response.body.progress).toBe(0);
    expect(response.body.status).toBe("Enrolled");
    expect(response.body.completedLessonIds).toEqual([]);

    const savedEnrollment = await ModaAcademyEnrollment.findById(enrollment.id);
    expect(savedEnrollment.progress).toBe(0);
    expect(savedEnrollment.status).toBe("Enrolled");
    expect(savedEnrollment.completedLessonIds).toEqual([]);
    expect(savedEnrollment.completedAt).toBeNull();
  });

  test("sets completedAt when course reconciliation first completes an enrollment", async () => {
    enrollment.completedLessonIds = [
      lessonIds.article,
      lessonIds.task,
      lessonIds.quiz,
    ];
    enrollment.taskSubmissions = [
      {
        lessonId: lessonIds.task,
        fileUrl: "https://example.com/task.pdf",
        filePublicId: "academy-task-test",
        fileName: "task.pdf",
        mimeType: "application/pdf",
        fileSize: 64,
      },
    ];
    enrollment.passedQuizLessonIds = [lessonIds.quiz];
    enrollment.progress = 67;
    await enrollment.save();

    const response = await request(app)
      .get(`/api/modasphere/academy/courses/id/${course.id}`)
      .set("Authorization", ["Bearer", student.token].join(" "));
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("Completed");
    expect(response.body.completedAt).toBeTruthy();

    const originalCompletedAt = response.body.completedAt;
    const repeatedResponse = await request(app)
      .get(`/api/modasphere/academy/courses/id/${course.id}`)
      .set("Authorization", ["Bearer", student.token].join(" "));
    expect(repeatedResponse.status).toBe(200);
    expect(repeatedResponse.body.completedAt).toBe(originalCompletedAt);
  });
});
