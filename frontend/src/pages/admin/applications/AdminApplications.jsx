import { useEffect, useState } from "react";
import { ArrowLeft, FileText, Mail, Phone, MapPin, ExternalLink, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import apiClient from "../../../services/apiClient";
import "./AdminApplications.css";

const getApplicationErrorMessage = (error) => {
  const status = error.response?.status;

  if (status === 401) {
    return "Your admin session has expired or you are not logged in. Please sign in again.";
  }
  if (status === 403) {
    return "You do not have permission to manage applications. Sign in with an admin account.";
  }

  return error.response?.data?.message || error.message || "Failed to load applications.";
};

function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchApplications = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get("/api/applications");
      const data = response.data;

      if (data.status !== "success" || !Array.isArray(data.data?.applications)) {
        throw new Error(data.message || "The server returned an invalid applications response.");
      }

      setApplications(data.data.applications);
    } catch (err) {
      console.error("Error loading applications from backend:", err);
      setError(getApplicationErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;

    try {
      setError("");
      const response = await apiClient.delete(`/api/applications/${id}`);

      if (response.data.status !== "success") {
        throw new Error(response.data.message || "Failed to delete application.");
      }
      setApplications((prev) => prev.filter((application) => (application._id || application.id) !== id));
    } catch (err) {
      console.error("Error deleting application:", err);
      setError(getApplicationErrorMessage(err));
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

            <span>{loading || error ? "—" : applications.length}</span>

            <small>Total Applications</small>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              background: "#fee2e2",
              border: "1px solid #ef4444",
              color: "#b91c1c",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 20,
            }}
          >
            {error}
            <button
              type="button"
              onClick={fetchApplications}
              style={{ marginLeft: 12 }}
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="no-applications" role="status">Loading applications...</div>
        ) : error ? null : applications.length === 0 ? (
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