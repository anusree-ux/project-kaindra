import { useState } from "react";
import Footer from "../components/Footer/Footer";
import "./Careers.css";

const jobs = [
  {
    title: "Business Development Associate",
    location: "India",
    type: "Full Time",
    experience: "Fresher / 0–1 Years",
  },
  {
    title: "Business Development Executive",
    location: "India",
    type: "Full Time",
    experience: "0–2 Years",
  },
  {
    title: "Sales Executive",
    location: "India",
    type: "Full Time",
    experience: "0–2 Years",
  },
  {
    title: "Senior Sales Executive",
    location: "India",
    type: "Full Time",
    experience: "1–3 Years",
  },
  {
    title: "Business Development Manager",
    location: "India",
    type: "Full Time",
    experience: "2–5 Years",
  },
  {
    title: "Sales Manager",
    location: "India",
    type: "Full Time",
    experience: "2–5 Years",
  },
];

/* --------------------------------------------------
   Load additional jobs saved by admin
-------------------------------------------------- */
function loadAdminJobs() {
  try {
    const savedCareers = localStorage.getItem("kaindraCareers");

    if (!savedCareers) {
      return [];
    }

    const careers = JSON.parse(savedCareers);

    if (!Array.isArray(careers)) {
      return [];
    }

    return careers;
  } catch (error) {
    console.error("Unable to load careers from localStorage:", error);
    return [];
  }
}

function Careers() {
  /*
    Read admin jobs when the component initializes.

    This avoids calling setState() inside useEffect,
    which was causing your ESLint error.
  */
  const [adminJobs] = useState(loadAdminJobs);

  const allJobs = [...jobs, ...adminJobs];

  /* --------------------------------------------------
     Scroll to open positions
  -------------------------------------------------- */
  const handleViewPositions = () => {
    const positionsSection = document.getElementById("open-positions");

    if (positionsSection) {
      positionsSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  /* --------------------------------------------------
     Handle job application
  -------------------------------------------------- */
   const handleApply = (jobTitle) => {
  const subject = encodeURIComponent(`Application for ${jobTitle}`);

  const body = encodeURIComponent(
    `Hello Kaindra Team,

I am interested in applying for the ${jobTitle} position.

Please find my application details below.

Regards`
  );

  const mailtoUrl =
    `mailto:careers@kaindra.com?subject=${subject}&body=${body}`;

  window.location.assign(mailtoUrl);
};

  return (
    <>
      <main className="careers-page">
        {/* ==================================================
            HERO
        ================================================== */}
        <section className="careers-hero">
          <div className="careers-container">
            <span className="careers-label">CAREERS</span>

            <h1>
              Build relationships.
              <br />
              Drive growth.
            </h1>

            <p>
              Join Kaindra and help us build meaningful relationships,
              create new opportunities, and drive the next generation
              of fashion and mobility businesses.
            </p>
          </div>
        </section>

        {/* ==================================================
            OPEN POSITIONS
        ================================================== */}
        <section
          className="careers-jobs"
          id="open-positions"
        >
          <div className="careers-container">
            <div className="jobs-header">
              <div>
                <span className="careers-label">
                  OPEN POSITIONS
                </span>

                <h2>
                  Find your next opportunity.
                </h2>
              </div>

              <p>
                We are looking for ambitious people who enjoy
                communication, relationship building and sales.
              </p>
            </div>

            <div className="jobs-list">
              {allJobs.length > 0 ? (
                allJobs.map((job, index) => (
                  <article
                    className="job-card"
                    key={
                      job.id ||
                      `${job.title}-${job.location}-${index}`
                    }
                  >
                    <div className="job-number">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="job-content">
                      <h3>{job.title}</h3>

                      <div className="job-details">
                        <span>{job.location}</span>

                        <span>{job.type}</span>

                        <span>{job.experience}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="job-apply"
                      onClick={() => handleApply(job.title)}
                      aria-label={`Apply for ${job.title}`}
                    >
                      Apply
                      <span aria-hidden="true">→</span>
                    </button>
                  </article>
                ))
              ) : (
                <div className="no-jobs">
                  <h3>No open positions available</h3>

                  <p>
                    Please check back later for new opportunities.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ==================================================
            WHY KAINDA
        ================================================== */}
        <section className="careers-why">
          <div className="careers-container">
            <div className="why-heading">
              <span className="careers-label">
                WHY KAINDA
              </span>

              <h2>
                Grow with a team
                <br />
                that thinks bigger.
              </h2>
            </div>

            <div className="why-grid">
              <article className="why-card">
                <span>01</span>

                <h3>Growth Mindset</h3>

                <p>
                  Learn continuously, take ownership and
                  grow your career with real responsibilities.
                </p>
              </article>

              <article className="why-card">
                <span>02</span>

                <h3>Real Impact</h3>

                <p>
                  Work directly with customers and businesses
                  and see the impact of your work.
                </p>
              </article>

              <article className="why-card">
                <span>03</span>

                <h3>Team Culture</h3>

                <p>
                  Work with a collaborative team where
                  ideas, communication and initiative matter.
                </p>
              </article>

              <article className="why-card">
                <span>04</span>

                <h3>Career Opportunities</h3>

                <p>
                  Build strong skills in sales, business
                  development, communication and leadership.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ==================================================
            CTA
        ================================================== */}
        <section className="careers-cta">
          <div className="careers-container">
            <span className="careers-label">
              JOIN KAINDA
            </span>

            <h2>Ready to grow with us?</h2>

            <p>
              Explore an opportunity at Kaindra and become
              part of a team building something meaningful.
            </p>

            <button
              type="button"
              className="careers-cta-button"
              onClick={handleViewPositions}
            >
              View Open Positions →
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default Careers;