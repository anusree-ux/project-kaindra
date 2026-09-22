import { useEffect, useState } from "react";
import { ArrowLeft, FileText, Mail, Phone, MapPin, ExternalLink, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import "./AdminApplications.css";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/applications`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success" && Array.isArray(data.data?.applications)) {
          setApplications(data.data.applications);
        }
      })
      .catch((err) => {
        console.error("Error loading applications from backend:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/applications/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setApplications((prev) => prev.filter((a) => (a._id || a.id) !== id));
      } else {
        alert("Failed to delete application.");
      }
    } catch (err) {
      console.error("Error deleting application:", err);
    }
  };

  return (
    <div className="admin-applications">
      <div className="admin-applications-container">

        {/* Header */}
        <div className="admin-applications-header">
          <div>
            <Link to="/admin" className="back-link">
              <ArrowLeft size={18} />
              Back to Dashboard
            </Link>

            <h1>Applications</h1>

            <p>
              Review applications submitted by candidates for Kaindra positions.
            </p>
          </div>

          <div className="applications-total">
            <FileText size={22} />

            <span>{applications.length}</span>

            <small>Total Applications</small>
          </div>
        </div>

        {/* No applications */}
        {applications.length === 0 && !loading ? (
          <div className="no-applications">
            <FileText size={50} />

            <h2>No Applications Yet</h2>

            <p>
              Applications submitted through the Careers page will appear here.
            </p>

            <Link to="/careers" className="view-careers-btn">
              View Careers
            </Link>
          </div>
        ) : (
          <div className="applications-list">

            {applications.map((application) => {
              const appKey = application._id || application.id;
              const resumeLink = application.resumeUrl || application.resume;

              return (
                <div
                  className="application-card"
                  key={appKey}
                >

                  {/* Application Header */}
                  <div className="application-card-header">

                    <div>
                      <h2>
                        {application.name || "Unnamed Candidate"}
                      </h2>

                      <p className="application-job">
                        Applied for:{" "}
                        <strong>
                          {application.jobTitle || "Position not specified"}
                        </strong>
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span className="application-date">
                        {application.submittedAt
                          ? new Date(application.submittedAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : ""}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDelete(appKey)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          padding: "4px",
                        }}
                        title="Delete Application"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                  </div>

                  {/* Candidate Details */}
                  <div className="application-details">

                    <div className="application-detail">
                      <Mail size={18} />

                      <div>
                        <span>Email</span>
                        <p>
                          {application.email || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="application-detail">
                      <Phone size={18} />

                      <div>
                        <span>Phone</span>
                        <p>
                          {application.phone || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="application-detail">
                      <MapPin size={18} />

                      <div>
                        <span>Location</span>
                        <p>
                          {application.location || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="application-detail">
                      <FileText size={18} />

                      <div>
                        <span>Qualification</span>
                        <p>
                          {application.qualification || "Not provided"}
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* Extra Details */}
                  <div className="application-extra">

                    <div>
                      <strong>Experience</strong>
                      <p>
                        {application.experience || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <strong>LinkedIn</strong>
                      <p>
                        {application.linkedin ? (
                          <a
                            href={application.linkedin.startsWith("http") ? application.linkedin : `https://${application.linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#d97706", textDecoration: "underline" }}
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
                        {resumeLink && resumeLink.startsWith("http") ? (
                          <>
                            <a
                              href={`https://docs.google.com/gview?url=${encodeURIComponent(resumeLink)}&embedded=true`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                color: "#0284c7",
                                fontWeight: "600",
                                textDecoration: "underline",
                                marginRight: "12px",
                              }}
                            >
                              View Resume
                              <ExternalLink size={14} />
                            </a>
                            <a
                              href={resumeLink}
                              download
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                color: "#16a34a",
                                fontWeight: "600",
                                textDecoration: "underline",
                              }}
                            >
                              Download
                            </a>
                          </>
                        ) : (
                          resumeLink || "Not uploaded"
                        )}
                      </p>
                    </div>

                  </div>

                  {/* Cover Letter */}
                  <div className="application-cover-letter">

                    <strong>Cover Letter</strong>

                    <p>
                      {application.coverLetter || "No cover letter provided."}
                    </p>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}

export default AdminApplications;