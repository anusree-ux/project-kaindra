const request = require("supertest");
const app = require("../../src/app");
const CourseCertificate = require("../../src/models/modasphere/CourseCertificate");
const ModaCourse = require("../../src/models/modasphere/ModaCourse");
const ModaAcademyEnrollment = require("../../src/models/modasphere/CourseEnrollment");
const { createTestUser } = require("../helpers/testUser");

describe("ModaAcademy course certificates", () => {
  let student;
  let otherStudent;
  let course;
  let enrollment;

  beforeAll(async () => {
    await CourseCertificate.init();
  });

  beforeEach(async () => {
    student = await createTestUser({ name: "Certificate Student" });
    otherStudent = await createTestUser({ name: "Other Student" });
    course = await ModaCourse.create({
      title: "Certificate Test Course",
      slug: `certificate-test-${Date.now()}-${Math.random()}`,
      description: "Test course description",
      category: "Design",
      instructor: student.userId,
      createdBy: student.userId,
      status: "published",
      modules: [
        {
          title: "Course Module",
          lessons: [
            { title: "Required lesson", type: "article", content: "Lesson text" },
          ],
        },
      ],
    });
    enrollment = await ModaAcademyEnrollment.create({
      enrollmentId: `MA-certificate-test-${Date.now()}-${Math.random()}`,
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

  const certificateUrl = () =>
    `/api/modasphere/academy/courses/${course.id}/certificate`;

  const authorizeAs = (token, requestBuilder) =>
    requestBuilder.set("Authorization", `Bearer ${token}`);

  const completeCourse = async () => {
    const lessonId = String(course.modules[0].lessons[0]._id);
    const response = await authorizeAs(
      student.token,
      request(app).patch(
        `/api/modasphere/academy/enrollments/course/${course.id}/progress`,
      ),
    ).send({ completedLessonIds: [lessonId] });
    expect(response.status).toBe(200);
    return response.body.completedAt;
  };

  test("requires authentication, enrollment ownership, and verified completion", async () => {
    const unauthenticatedResponse = await request(app)
      .post(certificateUrl())
      .send({ status: "Completed", studentName: "Forged Name" });
    expect(unauthenticatedResponse.status).toBe(401);

    const otherStudentResponse = await authorizeAs(
      otherStudent.token,
      request(app).post(certificateUrl()),
    );
    expect(otherStudentResponse.status).toBe(403);

    const incompleteResponse = await authorizeAs(
      student.token,
      request(app).post(certificateUrl()),
    ).send({
      status: "Completed",
      progress: 100,
      completedAt: new Date().toISOString(),
      studentName: "Forged Name",
      courseTitle: "Forged Course",
    });
    expect(incompleteResponse.status).toBe(409);
    expect(await CourseCertificate.countDocuments()).toBe(0);
  });

  test("issues one certificate per student and course and returns it idempotently", async () => {
    const completedAt = await completeCourse();
    const certificateIndexes = await CourseCertificate.collection.indexes();
    expect(certificateIndexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: { user: 1, course: 1 },
          unique: true,
        }),
      ]),
    );
    const issue = () =>
      authorizeAs(student.token, request(app).post(certificateUrl())).send({
        courseTitle: "Forged Course",
        studentName: "Forged Name",
      });

    const [firstResponse, concurrentResponse] = await Promise.all([
      issue(),
      issue(),
    ]);

    expect([firstResponse.status, concurrentResponse.status].sort()).toEqual([
      200,
      201,
    ]);
    expect(firstResponse.body.certificate.certificateNumber).toBe(
      concurrentResponse.body.certificate.certificateNumber,
    );
    expect(firstResponse.body.certificate).toEqual(
      expect.objectContaining({
        courseTitle: course.title,
        studentName: student.user.name,
        completedAt,
      }),
    );
    expect(firstResponse.body.certificate.certificateNumber).toMatch(
      /^KAINDRA-[0-9A-F-]+$/,
    );
    expect(firstResponse.body.certificate.issuedAt).toBeTruthy();
    expect(await CourseCertificate.countDocuments()).toBe(1);

    const savedCertificate = await CourseCertificate.findOne({
      user: student.userId,
      course: course._id,
    });
    expect(String(savedCertificate.enrollment)).toBe(String(enrollment._id));
    expect(
      CourseCertificate.schema.path("enrollment").options.ref,
    ).toBe("ModaAcademyEnrollment");
  });

  test("lists only certificates belonging to the authenticated student", async () => {
    await completeCourse();
    const issueResponse = await authorizeAs(
      student.token,
      request(app).post(certificateUrl()),
    );
    expect(issueResponse.status).toBe(201);

    const ownCertificatesResponse = await authorizeAs(
      student.token,
      request(app).get("/api/modasphere/academy/certificates/my"),
    );
    expect(ownCertificatesResponse.status).toBe(200);
    expect(ownCertificatesResponse.body.count).toBe(1);
    expect(ownCertificatesResponse.body.certificates[0]).toEqual(
      expect.objectContaining({
        certificateNumber:
          issueResponse.body.certificate.certificateNumber,
        courseTitle: course.title,
        studentName: student.user.name,
        completedAt: issueResponse.body.certificate.completedAt,
      }),
    );

    const otherCertificatesResponse = await authorizeAs(
      otherStudent.token,
      request(app).get("/api/modasphere/academy/certificates/my"),
    );
    expect(otherCertificatesResponse.status).toBe(200);
    expect(otherCertificatesResponse.body.count).toBe(0);
    expect(otherCertificatesResponse.body.certificates).toEqual([]);
  });
});
