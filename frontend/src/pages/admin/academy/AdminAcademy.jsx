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
} from "lucide-react";

import "./AdminAcademy.css";

function AdminAcademy() {
  const [enrollments, setEnrollments] = useState(() => {
    try {
      const savedEnrollments = JSON.parse(
        localStorage.getItem(
          "modaAcademyEnrollments"
        ) || "[]"
      );

      return Array.isArray(savedEnrollments)
        ? savedEnrollments
        : [];
    } catch {
      return [];
    }
  });

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedEnrollment, setSelectedEnrollment] =
    useState(null);

  /* =========================================
     LOAD ENROLLMENTS
  ========================================= */

  useEffect(() => {
    const loadEnrollments = () => {
      try {
        const savedEnrollments = JSON.parse(
          localStorage.getItem(
            "modaAcademyEnrollments"
          ) || "[]"
        );

        setEnrollments(
          Array.isArray(savedEnrollments)
            ? savedEnrollments
            : []
        );
      } catch {
        setEnrollments([]);
      }
    };

    window.addEventListener(
      "modaAcademyEnrollmentsUpdated",
      loadEnrollments
    );

    window.addEventListener(
      "storage",
      loadEnrollments
    );

    return () => {
      window.removeEventListener(
        "modaAcademyEnrollmentsUpdated",
        loadEnrollments
      );

      window.removeEventListener(
        "storage",
        loadEnrollments
      );
    };
  }, []);

  /* =========================================
     DELETE ENROLLMENT
  ========================================= */

  const handleDelete = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this enrollment?"
    );

    if (!confirmed) return;

    const updatedEnrollments =
      enrollments.filter(
        (enrollment) =>
          enrollment.id !== id
      );

    setEnrollments(updatedEnrollments);

    localStorage.setItem(
      "modaAcademyEnrollments",
      JSON.stringify(updatedEnrollments)
    );

    window.dispatchEvent(
      new Event("modaAcademyEnrollmentsUpdated")
    );

    if (
      selectedEnrollment?.id === id
    ) {
      setSelectedEnrollment(null);
    }
  };

  /* =========================================
     SEARCH
  ========================================= */

  const filteredEnrollments =
    enrollments.filter((enrollment) => {
      const search =
        searchTerm.toLowerCase().trim();

      if (!search) return true;

      return (
        enrollment.id
          ?.toLowerCase()
          .includes(search) ||
        enrollment.name
          ?.toLowerCase()
          .includes(search) ||
        enrollment.email
          ?.toLowerCase()
          .includes(search) ||
        enrollment.courseName
          ?.toLowerCase()
          .includes(search) ||
        enrollment.experience
          ?.toLowerCase()
          .includes(search) ||
        enrollment.status
          ?.toLowerCase()
          .includes(search)
      );
    });

  /* =========================================
     STATS
  ========================================= */

  const totalEnrollments =
    enrollments.length;

  const activeEnrollments =
    enrollments.filter(
      (enrollment) =>
        enrollment.status === "Enrolled"
    ).length;

  const completedEnrollments =
    enrollments.filter(
      (enrollment) =>
        Number(enrollment.progress) >= 100
    ).length;

  const uniqueCourses =
    new Set(
      enrollments.map(
        (enrollment) =>
          enrollment.courseId
      )
    ).size;

  return (
    <div className="admin-academy-page">

      <div className="admin-academy-container">

        {/* =================================
            HEADER
        ================================= */}

        <div className="admin-academy-header">

          <div>
            <span className="admin-academy-eyebrow">
              KAINDRA ADMIN
            </span>

            <h1>
              ModaAcademy
            </h1>

            <p>
              View and manage course enrollments
              submitted through ModaAcademy.
            </p>
          </div>

          <div className="admin-academy-header-icon">
            <GraduationCap size={32} />
          </div>

        </div>

        {/* =================================
            STATS
        ================================= */}

        <div className="admin-academy-stats">

          <div className="admin-academy-stat-card">

            <div className="admin-academy-stat-icon">
              <Users size={21} />
            </div>

            <div>
              <span>
                Total Enrollments
              </span>

              <strong>
                {totalEnrollments}
              </strong>
            </div>

          </div>

          <div className="admin-academy-stat-card">

            <div className="admin-academy-stat-icon">
              <BookOpen size={21} />
            </div>

            <div>
              <span>
                Active Learners
              </span>

              <strong>
                {activeEnrollments}
              </strong>
            </div>

          </div>

          <div className="admin-academy-stat-card">

            <div className="admin-academy-stat-icon">
              <GraduationCap size={21} />
            </div>

            <div>
              <span>
                Completed
              </span>

              <strong>
                {completedEnrollments}
              </strong>
            </div>

          </div>

          <div className="admin-academy-stat-card">

            <div className="admin-academy-stat-icon">
              <BarChart3 size={21} />
            </div>

            <div>
              <span>
                Courses
              </span>

              <strong>
                {uniqueCourses}
              </strong>
            </div>

          </div>

        </div>

        {/* =================================
            SEARCH
        ================================= */}

        <div className="admin-academy-toolbar">

          <div className="admin-academy-search">

            <Search size={18} />

            <input
              type="text"
              placeholder="Search student, email, course or enrollment ID..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />

          </div>

          <span className="admin-academy-result-count">
            {filteredEnrollments.length} enrollment
            {filteredEnrollments.length !== 1
              ? "s"
              : ""}
          </span>

        </div>

        {/* =================================
            TABLE
        ================================= */}

        {filteredEnrollments.length === 0 ? (

          <div className="admin-academy-empty">

            <GraduationCap size={42} />

            <h2>
              No enrollments found
            </h2>

            <p>
              ModaAcademy enrollments will
              appear here when students register
              for a course.
            </p>

          </div>

        ) : (

          <div className="admin-academy-table-card">

            <div className="admin-academy-table-wrapper">

              <table className="admin-academy-table">

                <thead>
                  <tr>
                    <th>
                      Enrollment
                    </th>

                    <th>
                      Student
                    </th>

                    <th>
                      Course
                    </th>

                    <th>
                      Level
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Progress
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {filteredEnrollments.map(
                    (enrollment) => (
                      <tr
                        key={enrollment.id}
                      >

                        <td>
                          <strong className="admin-academy-id">
                            {enrollment.id}
                          </strong>
                        </td>

                        <td>

                          <div className="admin-academy-student">

                            <strong>
                              {enrollment.name ||
                                "—"}
                            </strong>

                            <span>
                              {enrollment.email ||
                                "—"}
                            </span>

                          </div>

                        </td>

                        <td>

                          <div className="admin-academy-course">

                            <BookOpen
                              size={15}
                            />

                            <span>
                              {enrollment.courseName ||
                                "—"}
                            </span>

                          </div>

                        </td>

                        <td>
                          <span className="admin-academy-level">
                            {enrollment.experience ||
                              enrollment.level ||
                              "—"}
                          </span>
                        </td>

                        <td>

                          <span className="admin-academy-status">
                            {enrollment.status ||
                              "Enrolled"}
                          </span>

                        </td>

                        <td>

                          <div className="admin-academy-progress">

                            <div className="admin-academy-progress-top">

                              <span>
                                {Number(
                                  enrollment.progress ||
                                    0
                                )}
                                %
                              </span>

                            </div>

                            <div className="admin-academy-progress-bar">

                              <span
                                style={{
                                  width: `${Math.min(
                                    Number(
                                      enrollment.progress ||
                                        0
                                    ),
                                    100
                                  )}%`,
                                }}
                              />

                            </div>

                          </div>

                        </td>

                        <td>

                          <span className="admin-academy-date">
                            <CalendarDays
                              size={14}
                            />

                            {enrollment.enrolledAt ||
                              "—"}
                          </span>

                        </td>

                        <td>

                          <div className="admin-academy-actions">

                            <button
                              type="button"
                              className="admin-academy-view-button"
                              onClick={() =>
                                setSelectedEnrollment(
                                  enrollment
                                )
                              }
                            >
                              <Eye
                                size={15}
                              />

                              View
                            </button>

                            <button
                              type="button"
                              className="admin-academy-delete-button"
                              onClick={() =>
                                handleDelete(
                                  enrollment.id
                                )
                              }
                              aria-label="Delete enrollment"
                            >
                              <Trash2
                                size={15}
                              />
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}

      </div>

      {/* =================================
          VIEW MODAL
      ================================= */}

      {selectedEnrollment && (

        <div
          className="admin-academy-modal-overlay"
          onClick={() =>
            setSelectedEnrollment(null)
          }
        >

          <div
            className="admin-academy-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="admin-academy-modal-header">

              <div>

                <span>
                  ENROLLMENT DETAILS
                </span>

                <h2>
                  {selectedEnrollment.name ||
                    "Student"}
                </h2>

              </div>

              <button
                type="button"
                className="admin-academy-modal-close"
                onClick={() =>
                  setSelectedEnrollment(null)
                }
              >
                <X size={20} />
              </button>

            </div>

            <div className="admin-academy-detail-grid">

              <div className="admin-academy-detail">

                <span>
                  ENROLLMENT ID
                </span>

                <strong>
                  {selectedEnrollment.id}
                </strong>

              </div>

              <div className="admin-academy-detail">

                <span>
                  COURSE
                </span>

                <strong>
                  {selectedEnrollment.courseName ||
                    "—"}
                </strong>

              </div>

              <div className="admin-academy-detail">

                <span>
                  STUDENT
                </span>

                <strong>
                  {selectedEnrollment.name ||
                    "—"}
                </strong>

              </div>

              <div className="admin-academy-detail">

                <span>
                  EXPERIENCE
                </span>

                <strong>
                  {selectedEnrollment.experience ||
                    "—"}
                </strong>

              </div>

              <div className="admin-academy-detail">

                <span>
                  EMAIL
                </span>

                <strong className="admin-academy-detail-with-icon">
                  <Mail size={15} />
                  {selectedEnrollment.email ||
                    "—"}
                </strong>

              </div>

              <div className="admin-academy-detail">

                <span>
                  PHONE
                </span>

                <strong className="admin-academy-detail-with-icon">
                  <Phone size={15} />
                  {selectedEnrollment.phone ||
                    "—"}
                </strong>

              </div>

              <div className="admin-academy-detail">

                <span>
                  COURSE LEVEL
                </span>

                <strong>
                  {selectedEnrollment.level ||
                    "—"}
                </strong>

              </div>

              <div className="admin-academy-detail">

                <span>
                  DURATION
                </span>

                <strong className="admin-academy-detail-with-icon">
                  <Clock size={15} />
                  {selectedEnrollment.duration ||
                    "—"}
                </strong>

              </div>

              <div className="admin-academy-detail">

                <span>
                  STATUS
                </span>

                <strong>
                  {selectedEnrollment.status ||
                    "Enrolled"}
                </strong>

              </div>

              <div className="admin-academy-detail">

                <span>
                  ENROLLED DATE
                </span>

                <strong>
                  {selectedEnrollment.enrolledAt ||
                    "—"}
                </strong>

              </div>

            </div>

            <div className="admin-academy-modal-progress">

              <div>

                <span>
                  COURSE PROGRESS
                </span>

                <strong>
                  {Number(
                    selectedEnrollment.progress ||
                      0
                  )}
                  %
                </strong>

              </div>

              <div className="admin-academy-modal-progress-bar">

                <span
                  style={{
                    width: `${Math.min(
                      Number(
                        selectedEnrollment.progress ||
                          0
                      ),
                      100
                    )}%`,
                  }}
                />

              </div>

            </div>

            <div className="admin-academy-modal-footer">

              <button
                type="button"
                className="admin-academy-modal-delete"
                onClick={() =>
                  handleDelete(
                    selectedEnrollment.id
                  )
                }
              >
                <Trash2 size={16} />
                Delete Enrollment
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default AdminAcademy;