import { useEffect, useState } from "react";

import {
  GraduationCap,
  Palette,
  Scissors,
  TrendingUp,
  Globe2,
  Sparkles,
  Users,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  X,
  Clock,
  UserRound,
  BarChart3,
} from "lucide-react";

import "./ModaAcademy.css";

const placeholderCourses = [
  {
    id: "fashion-design",
    title: "Fashion Design Foundations",
    category: "DESIGN",
    level: "Beginner",
    duration: "8 Weeks",
    instructor: "ModaAcademy Design Team",
    icon: Palette,
    description:
      "Learn fashion concepts, design development, styling and collection building.",
    skills: [
      "Fashion fundamentals",
      "Design development",
      "Color & styling",
      "Collection planning",
    ],
  },

  {
    id: "fashion-business",
    title: "Fashion Business & Branding",
    category: "BUSINESS",
    level: "Beginner",
    duration: "6 Weeks",
    instructor: "ModaAcademy Business Team",
    icon: TrendingUp,
    description:
      "Learn how fashion brands are created, positioned, marketed and grown.",
    skills: [
      "Brand strategy",
      "Fashion marketing",
      "Customer research",
      "Business planning",
    ],
  },

  {
    id: "sustainable-fashion",
    title: "Sustainable Fashion",
    category: "SUSTAINABILITY",
    level: "Intermediate",
    duration: "6 Weeks",
    instructor: "ModaAcademy Sustainability Team",
    icon: Globe2,
    description:
      "Understand responsible materials, circular fashion and ethical production.",
    skills: [
      "Sustainable materials",
      "Circular fashion",
      "Ethical production",
      "Sustainability planning",
    ],
  },

  {
    id: "fashion-technology",
    title: "Fashion Technology & AI",
    category: "TECHNOLOGY",
    level: "Intermediate",
    duration: "8 Weeks",
    instructor: "ModaAcademy Innovation Team",
    icon: Sparkles,
    description:
      "Explore AI, digital fashion, smart textiles and technology-driven fashion.",
    skills: [
      "AI in fashion",
      "Digital fashion",
      "Smart textiles",
      "Fashion innovation",
    ],
  },
];

const learningAreas = [
  {
    icon: Palette,
    title: "Fashion Design",
    description:
      "Develop creative concepts, collections, styling and visual direction.",
  },

  {
    icon: Scissors,
    title: "Craft & Production",
    description:
      "Understand fabrics, garment construction and fashion production.",
  },

  {
    icon: TrendingUp,
    title: "Fashion Business",
    description:
      "Learn branding, marketing, merchandising and entrepreneurship.",
  },

  {
    icon: Globe2,
    title: "Global Fashion",
    description:
      "Explore fashion cultures, markets and international opportunities.",
  },

  {
    icon: Sparkles,
    title: "Fashion Technology",
    description:
      "Discover AI, digital fashion and emerging fashion technologies.",
  },

  {
    icon: Users,
    title: "Creator Development",
    description:
      "Build your creative portfolio and professional identity.",
  },
];

function ModaAcademy() {
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [showEnrollment, setShowEnrollment] = useState(false);

  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    experience: "Beginner",
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);

        const response = await fetch(
          "/api/modasphere/academy/courses"
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to fetch courses"
          );
        }

        setCourses(
          result.courses?.length
            ? result.courses
            : placeholderCourses
        );
      } catch (error) {
        console.error(
          "Unable to load ModaAcademy courses:",
          error
        );

        setCourses(placeholderCourses);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  /*
   * =========================================
   * LOAD MY LEARNING
   * =========================================
   *
   * My Learning is now protected.
   *
   * The frontend does NOT send an email.
   * The backend identifies the logged-in user
   * from the JWT access token.
   */
  useEffect(() => {
    const fetchMyEnrollments = async () => {
      const accessToken = localStorage.getItem("token");

      // User is not logged in.
      if (!accessToken) {
        setEnrollments([]);
        return;
      }

      try {
        setLoadingEnrollments(true);

        const response = await fetch(
          "/api/modasphere/academy/enrollments/my",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to fetch your enrollments"
          );
        }

        setEnrollments(result.data || []);
      } catch (error) {
        console.error(
          "Unable to load ModaAcademy enrollments:",
          error
        );

        setEnrollments([]);
      } finally {
        setLoadingEnrollments(false);
      }
    };

    fetchMyEnrollments();
  }, []);

  /* =========================================
     OPEN ENROLLMENT
  ========================================= */

  const openEnrollment = (course) => {
    setSelectedCourse(course);
    setShowEnrollment(true);
  };

  /* =========================================
     CLOSE ENROLLMENT
  ========================================= */

  const closeEnrollment = () => {
    setShowEnrollment(false);
    setSelectedCourse(null);

    setFormData({
      name: "",
      email: "",
      phone: "",
      experience: "Beginner",
    });
  };

  /* =========================================
     FORM CHANGE
  ========================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /* =========================================
     SUBMIT ENROLLMENT
  ========================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedCourse) {
      return;
    }

    try {
      const response = await fetch(
        "/api/modasphere/academy/enrollments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseId: selectedCourse._id || selectedCourse.id,
            courseName: selectedCourse.title,
            category: selectedCourse.category,
            level: selectedCourse.level,
            duration: selectedCourse.durationMinutes
              ? `${selectedCourse.durationMinutes} min`
              : selectedCourse.duration || "Self-paced",
            instructor: selectedCourse.instructor,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            experience: formData.experience,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to submit enrollment"
        );
      }

      /*
       * Do NOT store the student's email in localStorage.
       *
       * My Learning is now determined by the logged-in
       * user's access token.
       */

      setEnrollments((current) => [
        result.data,
        ...current,
      ]);

      alert(
        `Successfully enrolled in ${selectedCourse.title}`
      );

      closeEnrollment();
    } catch (error) {
      console.error(
        "ModaAcademy enrollment error:",
        error
      );

      alert(
        error.message ||
          "Failed to submit enrollment. Please try again."
      );
    }
  };

  return (
    <main className="modaacademy-page">

      {/* =========================================
          HERO
      ========================================= */}

      <section className="modaacademy-hero">
        <div className="modaacademy-container">

          <div className="modaacademy-hero-content">

            <span className="modaacademy-label">
              MODASPHERE EDUCATION
            </span>

            <h1>
              Learn fashion.
              <br />
              Create the future.
            </h1>

            <p>
              ModaAcademy is a practical learning platform
              for designers, creators, entrepreneurs and
              professionals building the future of fashion.
            </p>

            <div className="modaacademy-hero-actions">

              <a
                href="#courses"
                className="modaacademy-primary-button"
              >
                Explore Courses
                <ArrowRight size={18} />
              </a>

              <a
                href="#my-learning"
                className="modaacademy-secondary-button"
              >
                My Learning
              </a>

            </div>

          </div>

          <div className="modaacademy-hero-visual">

            <div className="academy-orbit academy-orbit-one">
              <span>DESIGN</span>
            </div>

            <div className="academy-orbit academy-orbit-two">
              <span>CREATE</span>
            </div>

            <div className="academy-orbit academy-orbit-three">
              <span>GROW</span>
            </div>

            <div className="academy-center">

              <GraduationCap size={50} />

              <span>MODA</span>

              <strong>ACADEMY</strong>

            </div>

          </div>

        </div>
      </section>

      {/* =========================================
          INTRO
      ========================================= */}

      <section className="modaacademy-intro">

        <div className="modaacademy-container">

          <div className="modaacademy-section-heading">

            <span>LEARNING ECOSYSTEM</span>

            <h2>
              Learn skills that
              <br />
              connect with fashion.
            </h2>

          </div>

          <div className="modaacademy-intro-text">

            <p>
              ModaAcademy combines fashion creativity,
              business, sustainability and technology into
              practical learning experiences.
            </p>

            <p>
              Choose a course, enroll and start building
              skills that can connect directly with the
              wider ModaSphere ecosystem.
            </p>

          </div>

        </div>

      </section>

      {/* =========================================
          COURSES
      ========================================= */}

      <section
        className="modaacademy-courses"
        id="courses"
      >

        <div className="modaacademy-container">

          <div className="modaacademy-section-heading centered">

            <span>AVAILABLE COURSES</span>

            <h2>
              Learn by doing.
            </h2>

            <p>
              Choose a learning path and start developing
              practical fashion skills.
            </p>

          </div>

          <div className="modaacademy-course-grid">
            {loadingCourses ? (
              <div className="modaacademy-no-learning">
                <BookOpen size={40} />
                <h3>Loading courses...</h3>
              </div>
            ) : courses.length === 0 ? (
              <div className="modaacademy-no-learning">
                <BookOpen size={40} />
                <h3>No courses available.</h3>
                <p>Check back soon for new ModaAcademy courses.</p>
              </div>
            ) : (
              courses.map((course) => (
                <article
                  className="modaacademy-course-card"
                  key={course._id || course.id}
                >
                  <div className="modaacademy-course-top">
                    <div className="modaacademy-course-icon">
                      {course.icon ? (
                        <course.icon size={25} />
                      ) : (
                        <GraduationCap size={25} />
                      )}
                    </div>

                    <span>{course.category}</span>
                  </div>

                  <h3>{course.title}</h3>

                  <p>{course.description}</p>

                  <div className="modaacademy-course-meta">
                    <span>
                      <BarChart3 size={15} />
                      {course.level}
                    </span>

                    <span>
                      <Clock size={15} />
                      {course.durationMinutes
                        ? `${course.durationMinutes} min`
                        : course.duration || "Self-paced"}
                    </span>
                  </div>

                  <div className="modaacademy-course-skills">
                    {(course.tags || course.skills)?.map((tag) => (
                      <span key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="modaacademy-enroll-button"
                    onClick={() => openEnrollment(course)}
                  >
                    Enroll Now
                    <ArrowRight size={17} />
                  </button>
                </article>
              ))
            )}
          </div>

        </div>

      </section>

      {/* =========================================
          MY LEARNING
      ========================================= */}

      <section
        className="modaacademy-my-learning"
        id="my-learning"
      >

        <div className="modaacademy-container">

          <div className="modaacademy-section-heading">

            <span>MY LEARNING</span>

            <h2>
              Your enrolled courses.
            </h2>

          </div>

          {loadingEnrollments ? (

            <div className="modaacademy-no-learning">

              <BookOpen size={40} />

              <h3>
                Loading your courses...
              </h3>

            </div>

          ) : enrollments.length === 0 ? (

            <div className="modaacademy-no-learning">

              <BookOpen size={40} />

              <h3>
                No courses enrolled yet.
              </h3>

              <p>
                Choose a course above and start your
                ModaAcademy learning journey.
              </p>

              <a href="#courses">
                Explore Courses
                <ArrowRight size={16} />
              </a>

            </div>

          ) : (

            <div className="modaacademy-learning-grid">

              {enrollments.map((enrollment) => (

                <article
                  className="modaacademy-learning-card"
                  key={enrollment._id}
                >

                  <div className="learning-card-header">

                    <div>

                      <span>
                        {enrollment.enrollmentId}
                      </span>

                      <h3>
                        {enrollment.courseName}
                      </h3>

                    </div>

                    <CheckCircle2 size={24} />

                  </div>

                  <div className="learning-card-info">

                    <div>

                      <span>STUDENT</span>

                      <strong>
                        {enrollment.name}
                      </strong>

                    </div>

                    <div>

                      <span>LEVEL</span>

                      <strong>
                        {enrollment.experience}
                      </strong>

                    </div>

                    <div>

                      <span>STATUS</span>

                      <strong>
                        {enrollment.status}
                      </strong>

                    </div>

                  </div>

                  <div className="learning-progress">

                    <div className="learning-progress-top">

                      <span>
                        Course Progress
                      </span>

                      <strong>
                        {enrollment.progress}%
                      </strong>

                    </div>

                    <div className="learning-progress-bar">

                      <span
                        style={{
                          width: `${enrollment.progress}%`,
                        }}
                      />

                    </div>

                  </div>

                </article>

              ))}

            </div>

          )}

        </div>

      </section>

      {/* =========================================
          LEARNING AREAS
      ========================================= */}

      <section className="modaacademy-areas">

        <div className="modaacademy-container">

          <div className="modaacademy-section-heading centered">

            <span>WHAT YOU CAN LEARN</span>

            <h2>
              Explore the fashion ecosystem.
            </h2>

          </div>

          <div className="modaacademy-areas-grid">

            {learningAreas.map((area) => {

              const Icon = area.icon;

              return (
                <article
                  className="modaacademy-area-card"
                  key={area.title}
                >

                  <div className="modaacademy-area-icon">
                    <Icon size={24} />
                  </div>

                  <h3>
                    {area.title}
                  </h3>

                  <p>
                    {area.description}
                  </p>

                </article>
              );
            })}

          </div>

        </div>

      </section>

      {/* =========================================
          PRACTICAL LEARNING
      ========================================= */}

      <section className="modaacademy-practical">

        <div className="modaacademy-container">

          <div className="modaacademy-section-heading centered">

            <span>PRACTICAL LEARNING</span>

            <h2>
              Learn something.
              <br />
              Build something.
            </h2>

            <p>
              ModaAcademy focuses on turning knowledge
              into practical fashion work.
            </p>

          </div>

          <div className="modaacademy-practical-grid">

            <div className="practical-card">

              <span>01</span>

              <Palette size={28} />

              <h3>
                Create
              </h3>

              <p>
                Develop a fashion concept, collection or
                creative direction.
              </p>

            </div>

            <div className="practical-card">

              <span>02</span>

              <Scissors size={28} />

              <h3>
                Build
              </h3>

              <p>
                Turn your idea into a practical fashion
                project.
              </p>

            </div>

            <div className="practical-card">

              <span>03</span>

              <TrendingUp size={28} />

              <h3>
                Present
              </h3>

              <p>
                Build your portfolio and communicate your
                fashion work professionally.
              </p>

            </div>

            <div className="practical-card">

              <span>04</span>

              <Users size={28} />

              <h3>
                Connect
              </h3>

              <p>
                Connect your skills with creators,
                businesses and the ModaSphere ecosystem.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* =========================================
          CTA
      ========================================= */}

      <section className="modaacademy-cta">

        <div className="modaacademy-container">

          <span>
            START LEARNING
          </span>

          <h2>
            Your next fashion skill
            <br />
            starts here.
          </h2>

          <p>
            Choose a course and begin your
            ModaAcademy journey.
          </p>

          <a
            href="#courses"
            className="modaacademy-cta-button"
          >
            Browse Courses
            <ArrowRight size={18} />
          </a>

        </div>

      </section>

      {/* =========================================
          ENROLLMENT MODAL
      ========================================= */}

      {showEnrollment && selectedCourse && (

        <div
          className="modaacademy-modal-overlay"
          onClick={closeEnrollment}
        >

          <div
            className="modaacademy-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modaacademy-modal-header">

              <div>

                <span>
                  COURSE ENROLLMENT
                </span>

                <h2>
                  {selectedCourse.title}
                </h2>

              </div>

              <button
                type="button"
                onClick={closeEnrollment}
                className="modaacademy-modal-close"
              >
                <X size={20} />
              </button>

            </div>

            <div className="modaacademy-selected-course">

              <BookOpen size={20} />

              <div>

                <strong>
                  {selectedCourse.title}
                </strong>

                <span>
                  {selectedCourse.level} ·{" "}
                  {selectedCourse.durationMinutes
                    ? `${selectedCourse.durationMinutes} min`
                    : selectedCourse.duration || "Self-paced"}
                </span>

              </div>

            </div>

            <form
              className="modaacademy-form"
              onSubmit={handleSubmit}
            >

              <div className="modaacademy-form-group">

                <label>
                  Full Name
                </label>

                <div className="modaacademy-input-wrapper">

                  <UserRound size={17} />

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    required
                  />

                </div>

              </div>

              <div className="modaacademy-form-group">

                <label>
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />

              </div>

              <div className="modaacademy-form-group">

                <label>
                  Phone
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  required
                />

              </div>

              <div className="modaacademy-form-group">

                <label>
                  Experience Level
                </label>

                <select
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                >

                  <option value="Beginner">
                    Beginner
                  </option>

                  <option value="Intermediate">
                    Intermediate
                  </option>

                  <option value="Advanced">
                    Advanced
                  </option>

                </select>

              </div>

              <button
                type="submit"
                className="modaacademy-submit-button"
              >
                Confirm Enrollment
                <ArrowRight size={17} />
              </button>

            </form>

          </div>

        </div>

      )}

    </main>
  );
}

export default ModaAcademy;