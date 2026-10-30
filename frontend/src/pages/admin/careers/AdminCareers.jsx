
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Briefcase,
  X,
  Pencil,
  Trash2,
  ArrowLeft,
  FileText,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
} from "lucide-react";
import "./AdminCareers.css";

const API_BASE = "";

const emptyForm = {
  title: "",
  department: "",
  location: "",
  type: "",
  experience: "",
  description: "",
};

function AdminCareers() {
  const [showForm, setShowForm] = useState(false);
  const [careers, setCareers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loadingCareers, setLoadingCareers] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchCareers = async () => {
    setLoadingCareers(true);

    try {
      const res = await fetch(`${API_BASE}/api/careers`);
      const data = await res.json();

      if (!res.ok || data.status !== "success") {
        throw new Error(data.message || "Failed to load careers.");
      }

      setCareers(Array.isArray(data.data?.careers) ? data.data.careers : []);
    } catch (error) {
      console.error("Error loading careers:", error);
    } finally {
      setLoadingCareers(false);
    }
  };

  const fetchApplications = async () => {
    setLoadingApplications(true);

    try {
      const res = await fetch(`${API_BASE}/api/applications`);
      const data = await res.json();

      if (!res.ok || data.status !== "success") {
        throw new Error(data.message || "Failed to load applications.");
      }

      setApplications(
        Array.isArray(data.data?.applications)
          ? data.data.applications
          : []
      );
    } catch (error) {
      console.error("Error loading applications:", error);
    } finally {
      setLoadingApplications(false);
    }
  };

  useEffect(() => {
    fetchCareers();
    fetchApplications();
  }, []);

  const getCareerId = (career) => String(career?._id || career?.id || "");

  const getApplicationCareer = (application) => {
    const applicationJobId = String(application.jobId?._id || application.jobId || "");

    if (applicationJobId) {
      return careers.find((career) => getCareerId(career) === applicationJobId);
    }

    // Legacy applications may have a job title but no jobId.
    return careers.find(
      (career) =>
        career.title?.trim().toLowerCase() ===
        application.jobTitle?.trim().toLowerCase()
    );
  };

  const selectedApplications = useMemo(() => {
    if (!selectedCareer) return [];

    const selectedId = getCareerId(selectedCareer);

    return applications.filter((application) => {
      const applicationJobId = String(
        application.jobId?._id || application.jobId || ""
      );

      if (applicationJobId) {
        return applicationJobId === selectedId;
      }

      return (
        application.jobTitle?.trim().toLowerCase() ===
        selectedCareer.title?.trim().toLowerCase()
      );
    });
  }, [applications, selectedCareer]);

  const getApplicationCount = (career) =>
    applications.filter(
      (application) => getCareerId(getApplicationCareer(application)) === getCareerId(career)
    ).length;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/api/careers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          department: formData.department.trim(),
          location: formData.location.trim(),
          type: formData.type,
          experience: formData.experience.trim(),
          description: formData.description.trim(),
        }),
      });

      const result = await res.json();

      if (!res.ok || result.status !== "success") {
        throw new Error(result.message || "Failed to create career.");
      }

      setFormData(emptyForm);
      setShowForm(false);
      await fetchCareers();
    } catch (error) {
      console.error("Error creating career:", error);
      window.alert(error.message || "Failed to create career.");
    }
  };

  const handleDeleteCareer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this position?")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/careers/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete position.");
      }

      setCareers((previous) =>
        previous.filter((career) => getCareerId(career) !== String(id))
      );

      if (selectedCareer && getCareerId(selectedCareer) === String(id)) {
        setSelectedCareer(null);
      }
    } catch (error) {
      console.error("Error deleting career:", error);
      window.alert(error.message || "Failed to delete position.");
    }
  };

  const handleDeleteApplication = async (id) => {
    if (!window.confirm("Are you sure you want to delete this application?")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/applications/${id}`, {
        method: "DELETE",
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok || result.status !== "success") {
        throw new Error(result.message || "Failed to delete application.");
      }

      setApplications((previous) =>
        previous.filter(
          (application) => String(application._id || application.id) !== String(id)
        )
      );
    } catch (error) {
      console.error("Error deleting application:", error);
      window.alert(error.message || "Failed to delete application.");
    }
  };

  const formatDate = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
      ? ""
      : parsedDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  };

  const renderApplications = () => {
    if (loadingApplications) {
      return <div className="applications-status">Loading applications...</div>;
    }

    if (selectedApplications.length === 0) {
      return (
        <div className="no-applications">
          <FileText size={46} />
          <h2>No Applications Yet</h2>
          <p>Applications for this position will appear here when candidates apply.</p>
        </div>
      );
    }

    return (
      <div className="applications-list">
        {selectedApplications.map((application) => {
          const appKey = application._id || application.id;
          const resumeLink = application.resumeUrl || application.resume;

          return (
            <article className="application-card" key={appKey}>
              <div className="application-card-header">
                <div>
                  <h2>{application.name || "Unnamed Candidate"}</h2>
                  <p className="application-job">
                    Applied for: <strong>{application.jobTitle || selectedCareer.title}</strong>
                  </p>
                </div>

                <div className="application-card-actions">
                  <span className="application-date">
                    {formatDate(application.submittedAt || application.createdAt)}
                  </span>

                  <button
                    type="button"
                    className="application-delete-button"
                    onClick={() => handleDeleteApplication(appKey)}
                    title="Delete application"
                    aria-label={`Delete application from ${application.name || "candidate"}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="application-details">
                <div className="application-detail">
                  <Mail size={18} />
                  <div>
                    <span>Email</span>
                    <p>{application.email || "Not provided"}</p>
                  </div>
                </div>

                <div className="application-detail">
                  <Phone size={18} />
                  <div>
                    <span>Phone</span>
                    <p>{application.phone || "Not provided"}</p>
                  </div>
                </div>

                <div className="application-detail">
                  <MapPin size={18} />
                  <div>
                    <span>Location</span>
                    <p>{application.location || "Not provided"}</p>
                  </div>
                </div>

                <div className="application-detail">
                  <FileText size={18} />
                  <div>
                    <span>Qualification</span>
                    <p>{application.qualification || "Not provided"}</p>
                  </div>
                </div>
              </div>

              <div className="application-extra">
                <div>
                  <strong>Experience</strong>
                  <p>{application.experience || "Not provided"}</p>
                </div>

                <div>
                  <strong>LinkedIn</strong>
                  <p>
                    {application.linkedin ? (
                      <a
                        href={
                          application.linkedin.startsWith("http")
                            ? application.linkedin
                            : `https://${application.linkedin}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Profile
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </p>
                </div>

                <div>
                  <strong>Resume</strong>
                  <p>
                    {resumeLink && /^https?:\/\//i.test(resumeLink) ? (
                      <>
                        <a
                          href={`https://docs.google.com/gview?url=${encodeURIComponent(resumeLink)}&embedded=true`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="application-resume-view"
                        >
                          View Resume <ExternalLink size={14} />
                        </a>

                        <a
                          href={resumeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="application-resume-download"
                        >
                          Open / Download
                        </a>
                      </>
                    ) : (
                      resumeLink || "Not uploaded"
                    )}
                  </p>
                </div>
              </div>

              <div className="application-cover-letter">
                <strong>Cover Letter</strong>
                <p>{application.coverLetter || "No cover letter provided."}</p>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <div className="admin-careers">
      <div className="admin-careers-container">
        {selectedCareer ? (
          <>
            <div className="admin-careers-header">
              <div>
                <button
                  type="button"
                  className="career-back-button"
                  onClick={() => setSelectedCareer(null)}
                >
                  <ArrowLeft size={18} />
                  Back to Careers
                </button>

                <span className="admin-careers-label">CANDIDATE MANAGEMENT</span>
                <h1>{selectedCareer.title} Applications</h1>
                <p>Review candidates who applied for this position.</p>
              </div>

              <div className="career-application-total">
                <FileText size={22} />
                <span>{selectedApplications.length}</span>
                <small>Applications</small>
              </div>
            </div>

            {renderApplications()}
          </>
        ) : (
          <>
            <div className="admin-careers-header">
              <div>
                <span className="admin-careers-label">CAREERS MANAGEMENT</span>
                <h1>Careers</h1>
                <p>Manage job opportunities and review applications for each position.</p>
              </div>

              <button
                className="add-career-button"
                onClick={() => setShowForm(true)}
                type="button"
              >
                <Plus size={18} />
                Add Career
              </button>
            </div>

            {showForm && (
              <div className="career-form-card">
                <div className="career-form-header">
                  <div>
                    <span className="admin-careers-label">NEW POSITION</span>
                    <h2>Add Career</h2>
                  </div>

                  <button
                    type="button"
                    className="career-close-button"
                    onClick={() => setShowForm(false)}
                    aria-label="Close career form"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="career-form-group">
                    <label htmlFor="career-title">Job Title</label>
                    <input
                      id="career-title"
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. Frontend Developer"
                      required
                    />
                  </div>

                  <div className="career-form-row">
                    <div className="career-form-group">
                      <label htmlFor="career-department">Department</label>
                      <input
                        id="career-department"
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        placeholder="e.g. Technology"
                        required
                      />
                    </div>

                    <div className="career-form-group">
                      <label htmlFor="career-location">Location</label>
                      <input
                        id="career-location"
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g. Bengaluru, India"
                        required
                      />
                    </div>
                  </div>

                  <div className="career-form-row">
                    <div className="career-form-group">
                      <label htmlFor="career-type">Employment Type</label>
                      <select
                        id="career-type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                      >
                        <option value="" disabled>Select type</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Internship">Internship</option>
                        <option value="Contract">Contract</option>
                      </select>
                    </div>

                    <div className="career-form-group">
                      <label htmlFor="career-experience">Experience</label>
                      <input
                        id="career-experience"
                        type="text"
                        name="experience"
                        value={formData.experience}
                        onChange={handleChange}
                        placeholder="e.g. 0–2 years"
                        required
                      />
                    </div>
                  </div>

                  <div className="career-form-group">
                    <label htmlFor="career-description">Job Description</label>
                    <textarea
                      id="career-description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="6"
                      placeholder="Describe the role, responsibilities and requirements..."
                      required
                    />
                  </div>

                  <div className="career-form-actions">
                    <button
                      type="button"
                      className="career-cancel-button"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>

                    <button type="submit" className="career-save-button">
                      Save Career
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!showForm && loadingCareers && (
              <div className="applications-status">Loading careers...</div>
            )}

            {!showForm && !loadingCareers && careers.length > 0 && (
              <div className="career-list">
                {careers.map((career) => {
                  const careerId = getCareerId(career);
                  const applicationCount = getApplicationCount(career);

                  return (
                    <div className="career-list-card" key={careerId}>
                      <div className="career-list-icon">
                        <Briefcase size={24} />
                      </div>

                      <div className="career-list-content">
                        <h2>{career.title}</h2>

                        <div className="career-meta">
                          <span>{career.department}</span>
                          <span>{career.location}</span>
                          <span>{career.type}</span>
                          <span>{career.experience}</span>
                        </div>

                        <p>{career.description}</p>

                        <div className="career-application-summary">
                          <FileText size={17} />
                          <span>
                            {loadingApplications
                              ? "Loading application count..."
                              : `${applicationCount} ${applicationCount === 1 ? "application" : "applications"}`}
                          </span>

                          <button
                            type="button"
                            className="career-view-applications-button"
                            onClick={() => setSelectedCareer(career)}
                          >
                            View Applications
                          </button>
                        </div>
                      </div>

                      <div className="career-list-actions">
                        <button
                          type="button"
                          title="Edit"
                          className="career-edit-button"
                          onClick={() =>
                            window.alert("Career editing is not implemented yet.")
                          }
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          title="Delete"
                          className="career-delete-button"
                          onClick={() => handleDeleteCareer(careerId)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!showForm && !loadingCareers && careers.length === 0 && (
              <div className="careers-empty-state">
                <div className="careers-empty-icon">
                  <Briefcase size={30} />
                </div>

                <h2>No career positions yet</h2>
                <p>Add your first job position to start managing careers on the Kaindra website.</p>

                <button
                  type="button"
                  className="empty-add-button"
                  onClick={() => setShowForm(true)}
                >
                  <Plus size={18} />
                  Add First Career
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminCareers;