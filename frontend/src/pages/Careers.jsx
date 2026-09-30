import { useState, useEffect } from "react";
import Footer from "../components/Footer/Footer";
import "./Careers.css";

const defaultJobs = [
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

const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

function Careers() {
  const [allJobs, setAllJobs] = useState(defaultJobs);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/careers`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success" && Array.isArray(data.data?.careers) && data.data.careers.length > 0) {
          setAllJobs(data.data.careers);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch careers from backend, using default positions:", err);
      });
  }, []);

  const countries = [
  { name: "Afghanistan", code: "+93" },
  { name: "Albania", code: "+355" },
  { name: "Algeria", code: "+213" },
  { name: "Andorra", code: "+376" },
  { name: "Angola", code: "+244" },
  { name: "Antigua and Barbuda", code: "+1-268" },
  { name: "Argentina", code: "+54" },
  { name: "Armenia", code: "+374" },
  { name: "Australia", code: "+61" },
  { name: "Austria", code: "+43" },
  { name: "Azerbaijan", code: "+994" },
  { name: "Bahamas", code: "+1-242" },
  { name: "Bahrain", code: "+973" },
  { name: "Bangladesh", code: "+880" },
  { name: "Barbados", code: "+1-246" },
  { name: "Belarus", code: "+375" },
  { name: "Belgium", code: "+32" },
  { name: "Belize", code: "+501" },
  { name: "Benin", code: "+229" },
  { name: "Bhutan", code: "+975" },
  { name: "Bolivia", code: "+591" },
  { name: "Bosnia and Herzegovina", code: "+387" },
  { name: "Botswana", code: "+267" },
  { name: "Brazil", code: "+55" },
  { name: "Brunei", code: "+673" },
  { name: "Bulgaria", code: "+359" },
  { name: "Burkina Faso", code: "+226" },
  { name: "Burundi", code: "+257" },
  { name: "Cambodia", code: "+855" },
  { name: "Cameroon", code: "+237" },
  { name: "Canada", code: "+1" },
  { name: "Cape Verde", code: "+238" },
  { name: "Central African Republic", code: "+236" },
  { name: "Chad", code: "+235" },
  { name: "Chile", code: "+56" },
  { name: "China", code: "+86" },
  { name: "Colombia", code: "+57" },
  { name: "Comoros", code: "+269" },
  { name: "Congo", code: "+242" },
  { name: "Costa Rica", code: "+506" },
  { name: "Croatia", code: "+385" },
  { name: "Cuba", code: "+53" },
  { name: "Cyprus", code: "+357" },
  { name: "Czech Republic", code: "+420" },
  { name: "Denmark", code: "+45" },
  { name: "Djibouti", code: "+253" },
  { name: "Dominica", code: "+1-767" },
  { name: "Dominican Republic", code: "+1-809" },
  { name: "Ecuador", code: "+593" },
  { name: "Egypt", code: "+20" },
  { name: "El Salvador", code: "+503" },
  { name: "Equatorial Guinea", code: "+240" },
  { name: "Eritrea", code: "+291" },
  { name: "Estonia", code: "+372" },
  { name: "Eswatini", code: "+268" },
  { name: "Ethiopia", code: "+251" },
  { name: "Fiji", code: "+679" },
  { name: "Finland", code: "+358" },
  { name: "France", code: "+33" },
  { name: "Gabon", code: "+241" },
  { name: "Gambia", code: "+220" },
  { name: "Georgia", code: "+995" },
  { name: "Germany", code: "+49" },
  { name: "Ghana", code: "+233" },
  { name: "Greece", code: "+30" },
  { name: "Grenada", code: "+1-473" },
  { name: "Guatemala", code: "+502" },
  { name: "Guinea", code: "+224" },
  { name: "Guyana", code: "+592" },
  { name: "Haiti", code: "+509" },
  { name: "Honduras", code: "+504" },
  { name: "Hungary", code: "+36" },
  { name: "Iceland", code: "+354" },
  { name: "India", code: "+91" },
  { name: "Indonesia", code: "+62" },
  { name: "Iran", code: "+98" },
  { name: "Iraq", code: "+964" },
  { name: "Ireland", code: "+353" },
  { name: "Israel", code: "+972" },
  { name: "Italy", code: "+39" },
  { name: "Jamaica", code: "+1-876" },
  { name: "Japan", code: "+81" },
  { name: "Jordan", code: "+962" },
  { name: "Kazakhstan", code: "+7" },
  { name: "Kenya", code: "+254" },
  { name: "Kiribati", code: "+686" },
  { name: "Kuwait", code: "+965" },
  { name: "Kyrgyzstan", code: "+996" },
  { name: "Laos", code: "+856" },
  { name: "Latvia", code: "+371" },
  { name: "Lebanon", code: "+961" },
  { name: "Lesotho", code: "+266" },
  { name: "Liberia", code: "+231" },
  { name: "Libya", code: "+218" },
  { name: "Liechtenstein", code: "+423" },
  { name: "Lithuania", code: "+370" },
  { name: "Luxembourg", code: "+352" },
  { name: "Madagascar", code: "+261" },
  { name: "Malawi", code: "+265" },
  { name: "Malaysia", code: "+60" },
  { name: "Maldives", code: "+960" },
  { name: "Mali", code: "+223" },
  { name: "Malta", code: "+356" },
  { name: "Marshall Islands", code: "+692" },
  { name: "Mauritania", code: "+222" },
  { name: "Mauritius", code: "+230" },
  { name: "Mexico", code: "+52" },
  { name: "Micronesia", code: "+691" },
  { name: "Moldova", code: "+373" },
  { name: "Monaco", code: "+377" },
  { name: "Mongolia", code: "+976" },
  { name: "Montenegro", code: "+382" },
  { name: "Morocco", code: "+212" },
  { name: "Mozambique", code: "+258" },
  { name: "Myanmar", code: "+95" },
  { name: "Namibia", code: "+264" },
  { name: "Nauru", code: "+674" },
  { name: "Nepal", code: "+977" },
  { name: "Netherlands", code: "+31" },
  { name: "New Zealand", code: "+64" },
  { name: "Nicaragua", code: "+505" },
  { name: "Niger", code: "+227" },
  { name: "Nigeria", code: "+234" },
  { name: "North Korea", code: "+850" },
  { name: "North Macedonia", code: "+389" },
  { name: "Norway", code: "+47" },
  { name: "Oman", code: "+968" },
  { name: "Pakistan", code: "+92" },
  { name: "Palau", code: "+680" },
  { name: "Palestine", code: "+970" },
  { name: "Panama", code: "+507" },
  { name: "Papua New Guinea", code: "+675" },
  { name: "Paraguay", code: "+595" },
  { name: "Peru", code: "+51" },
  { name: "Philippines", code: "+63" },
  { name: "Poland", code: "+48" },
  { name: "Portugal", code: "+351" },
  { name: "Qatar", code: "+974" },
  { name: "Romania", code: "+40" },
  { name: "Russia", code: "+7" },
  { name: "Rwanda", code: "+250" },
  { name: "Saint Kitts and Nevis", code: "+1-869" },
  { name: "Saint Lucia", code: "+1-758" },
  { name: "Samoa", code: "+685" },
  { name: "San Marino", code: "+378" },
  { name: "Saudi Arabia", code: "+966" },
  { name: "Senegal", code: "+221" },
  { name: "Serbia", code: "+381" },
  { name: "Seychelles", code: "+248" },
  { name: "Singapore", code: "+65" },
  { name: "Slovakia", code: "+421" },
  { name: "Slovenia", code: "+386" },
  { name: "Solomon Islands", code: "+677" },
  { name: "Somalia", code: "+252" },
  { name: "South Africa", code: "+27" },
  { name: "South Korea", code: "+82" },
  { name: "South Sudan", code: "+211" },
  { name: "Spain", code: "+34" },
  { name: "Sri Lanka", code: "+94" },
  { name: "Sudan", code: "+249" },
  { name: "Suriname", code: "+597" },
  { name: "Sweden", code: "+46" },
  { name: "Switzerland", code: "+41" },
  { name: "Syria", code: "+963" },
  { name: "Taiwan", code: "+886" },
  { name: "Tajikistan", code: "+992" },
  { name: "Tanzania", code: "+255" },
  { name: "Thailand", code: "+66" },
  { name: "Togo", code: "+228" },
  { name: "Tonga", code: "+676" },
  { name: "Trinidad and Tobago", code: "+1-868" },
  { name: "Tunisia", code: "+216" },
  { name: "Turkey", code: "+90" },
  { name: "Turkmenistan", code: "+993" },
  { name: "Tuvalu", code: "+688" },
  { name: "Uganda", code: "+256" },
  { name: "Ukraine", code: "+380" },
  { name: "United Arab Emirates", code: "+971" },
  { name: "United Kingdom", code: "+44" },
  { name: "United States", code: "+1" },
  { name: "Uruguay", code: "+598" },
  { name: "Uzbekistan", code: "+998" },
  { name: "Vanuatu", code: "+678" },
  { name: "Vatican City", code: "+39" },
  { name: "Venezuela", code: "+58" },
  { name: "Vietnam", code: "+84" },
  { name: "Yemen", code: "+967" },
  { name: "Zambia", code: "+260" },
  { name: "Zimbabwe", code: "+263" },
];

  /* --------------------------------------------------
     Application modal
  -------------------------------------------------- */

  const [selectedJob, setSelectedJob] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneCode: "+91",
    phone: "",
    location: "",
    qualification: "",
    experience: "",
    linkedin: "",
    resume: null,
    coverLetter: "",
  });

  const [submitted, setSubmitted] = useState(false);

  /* --------------------------------------------------
     Open application form
  -------------------------------------------------- */

  const handleApply = (job) => {
    setSelectedJob(job);
    setSubmitted(false);

    setFormData({
      name: "",
      email: "",
      phoneCode: "+91",
      phone: "",
      location: "",
      qualification: "",
      experience: "",
      linkedin: "",
      resume: null,
      coverLetter: "",
    });
  };

  /* --------------------------------------------------
     Close application form
  -------------------------------------------------- */

  const handleCloseApplication = () => {
    setSelectedJob(null);
    setSubmitted(false);
  };

  /* --------------------------------------------------
     Form input
  -------------------------------------------------- */

  const handleChange = (event) => {
    const { name, value, files } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: files ? files[0] : value,
    }));
  };

  /* --------------------------------------------------
     Submit application with Cloudinary upload
  -------------------------------------------------- */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedJob) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const data = new FormData();
      data.append("jobId", selectedJob._id || selectedJob.id || "");
      data.append("jobTitle", selectedJob.title);
      data.append("jobLocation", selectedJob.location || "India");
      data.append("jobType", selectedJob.type || "Full Time");
      data.append("jobExperience", selectedJob.experience || "");

      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("phone", `${formData.phoneCode} ${formData.phone}`);
      data.append("location", formData.location);
      data.append("qualification", formData.qualification);
      data.append("experience", formData.experience);
      data.append("linkedin", formData.linkedin);
      data.append("coverLetter", formData.coverLetter);

      if (formData.resume) {
        data.append("resume", formData.resume);
      }

      const res = await fetch(`${API_BASE}/api/applications`, {
        method: "POST",
        body: data,
      });

      const result = await res.json();

      if (!res.ok || result.status !== "success") {
        throw new Error(result.message || "Application submission failed.");
      }

      setSubmitted(true);
      setIsSubmitting(false);

      setTimeout(() => {
        handleCloseApplication();
      }, 2500);
    } catch (error) {
      console.error("Unable to save application:", error);
      setSubmitError(error.message || "Failed to submit application. Please try again.");
      setIsSubmitting(false);
    }
  };
  /* --------------------------------------------------
     Scroll to open positions
  -------------------------------------------------- */

  const handleViewPositions = () => {
    const positionsSection =
      document.getElementById("open-positions");

    if (positionsSection) {
      positionsSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <>
      <main className="careers-page">

        {/* ==================================================
            HERO
        ================================================== */}

        <section className="careers-hero">
          <div className="careers-container">
            <span className="careers-label">
              CAREERS
            </span>

            <h1>
              Build relationships.
              <br />
              Drive growth.
            </h1>

            <p>
              Join Kaindra and help us build meaningful
              relationships, create new opportunities, and
              drive the next generation of fashion and
              mobility businesses.
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
                      onClick={() => handleApply(job)}
                      aria-label={`Apply for ${job.title}`}
                    >
                      Apply
                      <span aria-hidden="true">
                        →
                      </span>
                    </button>

                  </article>
                ))
              ) : (
                <div className="no-jobs">
                  <h3>
                    No open positions available
                  </h3>

                  <p>
                    Please check back later for new
                    opportunities.
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

                <h3>
                  Growth Mindset
                </h3>

                <p>
                  Learn continuously, take ownership and
                  grow your career with real responsibilities.
                </p>
              </article>


              <article className="why-card">
                <span>02</span>

                <h3>
                  Real Impact
                </h3>

                <p>
                  Work directly with customers and businesses
                  and see the impact of your work.
                </p>
              </article>


              <article className="why-card">
                <span>03</span>

                <h3>
                  Team Culture
                </h3>

                <p>
                  Work with a collaborative team where
                  ideas, communication and initiative matter.
                </p>
              </article>


              <article className="why-card">
                <span>04</span>

                <h3>
                  Career Opportunities
                </h3>

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

            <h2>
              Ready to grow with us?
            </h2>

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


      {/* ==================================================
          APPLICATION MODAL
      ================================================== */}

      {selectedJob && (
        <div
          className="application-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              handleCloseApplication();
            }
          }}
        >

          <div className="application-modal">

            <button
              type="button"
              className="application-close"
              onClick={handleCloseApplication}
              aria-label="Close application form"
            >
              ×
            </button>


            {!submitted ? (
              <>

                <div className="application-header">

                  <span className="careers-label">
                    APPLICATION
                  </span>

                  <h2>
                    Apply for this role
                  </h2>

                  <div className="selected-job">
                    <strong>
                      {selectedJob.title}
                    </strong>

                    <span>
                      {selectedJob.location}
                      {" • "}
                      {selectedJob.type}
                      {" • "}
                      {selectedJob.experience}
                    </span>
                  </div>

                </div>


                <form
                  className="application-form"
                  onSubmit={handleSubmit}
                >

                  <div className="form-row">

                    <div className="form-group">
                      <label htmlFor="name">
                        Full Name *
                      </label>

                      <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>


                    <div className="form-group">
                      <label htmlFor="email">
                        Email *
                      </label>

                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>

                  </div>


                  <div className="form-row">

                   <div className="form-group">
  <label htmlFor="phone">
    Phone *
  </label>

  <div className="phone-input-wrapper">
    <select
      id="phoneCode"
      name="phoneCode"
      className="phone-country-code"
      value={formData.phoneCode}
      onChange={handleChange}
      aria-label="Country calling code"
    >
      {countries.map((country) => (
        <option
          key={`${country.name}-${country.code}`}
          value={country.code}
        >
          {country.name} ({country.code})
        </option>
      ))}
    </select>

    <input
      id="phone"
      name="phone"
      type="tel"
      placeholder="Enter phone number"
      value={formData.phone}
      onChange={handleChange}
      required
    />
  </div>
</div>


                    <div className="form-group">
                      <label htmlFor="location">
                        Current Location *
                      </label>

                      <input
                        id="location"
                        name="location"
                        type="text"
                        placeholder="City, Country"
                        value={formData.location}
                        onChange={handleChange}
                        required
                      />
                    </div>

                  </div>


                  <div className="form-row">

                    <div className="form-group">
                      <label htmlFor="qualification">
                        Highest Qualification *
                      </label>

                      <input
                        id="qualification"
                        name="qualification"
                        type="text"
                        placeholder="e.g. BBA, MBA"
                        value={formData.qualification}
                        onChange={handleChange}
                        required
                      />
                    </div>


                    <div className="form-group">
                      <label htmlFor="experience">
                        Experience
                      </label>

                      <input
                        id="experience"
                        name="experience"
                        type="text"
                        placeholder="e.g. Fresher / 2 Years"
                        value={formData.experience}
                        onChange={handleChange}
                      />
                    </div>

                  </div>


                  <div className="form-group">

                    <label htmlFor="linkedin">
                      LinkedIn Profile
                    </label>

                    <input
                      id="linkedin"
                      name="linkedin"
                      type="url"
                      placeholder="https://linkedin.com/in/yourname"
                      value={formData.linkedin}
                      onChange={handleChange}
                    />

                  </div>


                  <div className="form-group">

                    <label htmlFor="resume">
                      Resume *
                    </label>

                    <div className="resume-input">

                      <input
                        id="resume"
                        name="resume"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleChange}
                        required
                      />

                      <span>
                        PDF, DOC or DOCX
                      </span>

                    </div>

                    {formData.resume && (
                      <small className="file-name">
                        Selected: {formData.resume.name}
                      </small>
                    )}

                  </div>


                  <div className="form-group">

                    <label htmlFor="coverLetter">
                      Cover Letter
                    </label>

                    <textarea
                      id="coverLetter"
                      name="coverLetter"
                      rows="5"
                      placeholder="Tell us briefly why you are a good fit for this role..."
                      value={formData.coverLetter}
                      onChange={handleChange}
                    />

                  </div>


                  {submitError && (
                    <div style={{ color: "#e53e3e", marginBottom: "1rem", fontSize: "0.9rem" }}>
                      {submitError}
                    </div>
                  )}

                  <div className="application-actions">

                    <button
                      type="button"
                      className="application-cancel"
                      onClick={handleCloseApplication}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="application-submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Uploading Resume..." : "Submit Application"}
                    </button>

                  </div>

                </form>

              </>
            ) : (

              <div className="application-success">

                <div className="success-icon">
                  ✓
                </div>

                <span className="careers-label">
                  APPLICATION RECEIVED
                </span>

                <h2>
                  Thank you for applying.
                </h2>

                <p>
                  Your application for{" "}
                  <strong>
                    {selectedJob.title}
                  </strong>{" "}
                  has been submitted successfully.
                </p>

              </div>

            )}

          </div>

        </div>
      )}

      <Footer />
    </>
  );
}

export default Careers;