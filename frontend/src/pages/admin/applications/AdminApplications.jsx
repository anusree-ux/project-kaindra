import { useEffect, useState } from "react";
import { ArrowLeft, FileText, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import "./AdminApplications.css";

function getApplications() {
  try {
    return JSON.parse(
      localStorage.getItem("kaindraApplications") || "[]"
    );
  } catch {
    return [];
  }
}

function AdminApplications() {
  const [applications, setApplications] = useState(getApplications);

  useEffect(() => {
    const handleApplicationsUpdate = () => {
      setApplications(getApplications());
    };

    window.addEventListener("storage", handleApplicationsUpdate);
    window.addEventListener(
      "kaindraApplicationsUpdated",
      handleApplicationsUpdate
    );

    return () => {
      window.removeEventListener("storage", handleApplicationsUpdate);
      window.removeEventListener(
        "kaindraApplicationsUpdated",
        handleApplicationsUpdate
      );
    };
  }, []);

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
              Review applications submitted by candidates for Kaindra
              positions.
            </p>
          </div>

          <div className="applications-total">
            <FileText size={22} />

            <span>{applications.length}</span>

            <small>Total Applications</small>
          </div>
        </div>

        {/* No applications */}
        {applications.length === 0 ? (
          <div className="no-applications">
            <FileText size={50} />

            <h2>No Applications Yet</h2>

            <p>
              Applications submitted through the Careers page will
              appear here.
            </p>

            <Link to="/careers" className="view-careers-btn">
              View Careers
            </Link>
          </div>
        ) : (
          <div className="applications-list">

            {applications.map((application) => (
              <div
                className="application-card"
                key={application.id}
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

                  <span className="application-date">
                    {application.submittedAt || ""}
                  </span>

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
                      {application.linkedin || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <strong>Resume</strong>
                    <p>
                      {application.resume || "Not uploaded"}
                    </p>
                  </div>

                </div>

                {/* Cover Letter */}
                <div className="application-cover-letter">

                  <strong>Cover Letter</strong>

                  <p>
                    {application.coverLetter ||
                      "No cover letter provided."}
                  </p>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}

export default AdminApplications;