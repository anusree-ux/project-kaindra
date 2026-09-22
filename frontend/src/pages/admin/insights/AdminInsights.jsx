import { useEffect, useState } from "react";
import {
  BarChart3,
  Eye,
  X,
  Mail,
  CalendarDays,
  Building2,
  Tag,
  Trash2,
} from "lucide-react";

import "./AdminInsights.css";

function AdminInsights() {
  const [requests, setRequests] = useState(() => {
    try {
      const savedRequests = JSON.parse(
        localStorage.getItem("modaInsightsRequests") || "[]"
      );

      return Array.isArray(savedRequests) ? savedRequests : [];
    } catch {
      return [];
    }
  });

  const [selectedRequest, setSelectedRequest] = useState(null);

  // =============================
  // Load Requests
  // =============================
  const loadRequests = () => {
    try {
      const savedRequests = JSON.parse(
        localStorage.getItem("modaInsightsRequests") || "[]"
      );

      setRequests(
        Array.isArray(savedRequests) ? savedRequests : []
      );
    } catch {
      setRequests([]);
    }
  };

  // =============================
  // Listen for Updates
  // =============================
  useEffect(() => {
    window.addEventListener(
      "modaInsightsRequestsUpdated",
      loadRequests
    );

    window.addEventListener("storage", loadRequests);

    return () => {
      window.removeEventListener(
        "modaInsightsRequestsUpdated",
        loadRequests
      );

      window.removeEventListener("storage", loadRequests);
    };
  }, []);

  // =============================
  // Delete Request
  // =============================
  const handleDelete = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this insight request?"
    );

    if (!confirmed) return;

    const updatedRequests = requests.filter(
      (request) => request.id !== id
    );

    localStorage.setItem(
      "modaInsightsRequests",
      JSON.stringify(updatedRequests)
    );

    setRequests(updatedRequests);

    if (selectedRequest?.id === id) {
      setSelectedRequest(null);
    }

    window.dispatchEvent(
      new Event("modaInsightsRequestsUpdated")
    );
  };

  // =============================
  // Statistics
  // =============================
  const newRequests = requests.filter(
    (request) => request.status === "New"
  ).length;

  const processedRequests = requests.filter(
    (request) => request.status === "Processed"
  ).length;

  return (
    <div className="admin-insights-page">
      <div className="admin-insights-container">

        {/* HEADER */}
        <div className="admin-insights-header">
          <div>
            <span className="admin-insights-eyebrow">
              KAINDRA ADMIN
            </span>

            <h1>ModaInsights Requests</h1>

            <p>
              View and manage data and intelligence
              requests submitted through ModaInsights.
            </p>
          </div>

          <div className="admin-insights-total">
            <span>Total Requests</span>
            <strong>{requests.length}</strong>
          </div>
        </div>

        {/* STATS */}
        <div className="admin-insights-stats">

          <div className="admin-insights-stat">
            <div className="admin-insights-stat-icon">
              <BarChart3 size={21} />
            </div>

            <div>
              <span>Total Requests</span>
              <strong>{requests.length}</strong>
            </div>
          </div>

          <div className="admin-insights-stat">
            <div className="admin-insights-stat-icon">
              <Tag size={21} />
            </div>

            <div>
              <span>New Requests</span>
              <strong>{newRequests}</strong>
            </div>
          </div>

          <div className="admin-insights-stat">
            <div className="admin-insights-stat-icon">
              <Building2 size={21} />
            </div>

            <div>
              <span>Processed</span>
              <strong>{processedRequests}</strong>
            </div>
          </div>

        </div>

        {/* REQUESTS */}
        {requests.length === 0 ? (
          <div className="admin-insights-empty">

            <BarChart3 size={42} />

            <h2>No insight requests yet</h2>

            <p>
              Requests submitted through ModaInsights
              will appear here.
            </p>

          </div>
        ) : (
          <div className="admin-insights-card">

            <div className="admin-insights-table-wrapper">

              <table className="admin-insights-table">

                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Business</th>
                    <th>Topic</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {requests.map((request) => (
                    <tr key={request.id}>

                      <td>
                        <strong className="admin-insights-request-id">
                          {request.id}
                        </strong>
                      </td>

                      <td>
                        {request.name || "—"}
                      </td>

                      <td>
                        <span className="admin-insights-email">
                          <Mail size={14} />
                          {request.email || "—"}
                        </span>
                      </td>

                      <td>
                        <span className="admin-insights-business">
                          <Building2 size={14} />
                          {request.business || "—"}
                        </span>
                      </td>

                      <td>
                        <span className="admin-insights-topic">
                          <Tag size={13} />
                          {request.topic || "—"}
                        </span>
                      </td>

                      <td>
                        <span className="admin-insights-date">
                          <CalendarDays size={13} />
                          {request.submittedAt || "—"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`admin-insights-status ${
                            request.status === "Processed"
                              ? "processed"
                              : ""
                          }`}
                        >
                          {request.status || "New"}
                        </span>
                      </td>

                      <td>
                        <div className="admin-insights-actions">

                          <button
                            type="button"
                            className="admin-insights-view-button"
                            onClick={() =>
                              setSelectedRequest(request)
                            }
                          >
                            <Eye size={15} />
                            View
                          </button>

                          <button
                            type="button"
                            className="admin-insights-delete-button"
                            onClick={() =>
                              handleDelete(request.id)
                            }
                          >
                            <Trash2 size={15} />
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          </div>
        )}

      </div>

      {/* VIEW MODAL */}
      {selectedRequest && (
        <div
          className="admin-insights-modal-overlay"
          onClick={() => setSelectedRequest(null)}
        >

          <div
            className="admin-insights-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="admin-insights-modal-header">

              <div>
                <span>INSIGHT REQUEST</span>

                <h2>
                  {selectedRequest.id}
                </h2>
              </div>

              <button
                type="button"
                className="admin-insights-close"
                onClick={() =>
                  setSelectedRequest(null)
                }
              >
                <X size={20} />
              </button>

            </div>

            <div className="admin-insights-details">

              <div>
                <span>NAME</span>
                <strong>
                  {selectedRequest.name || "—"}
                </strong>
              </div>

              <div>
                <span>EMAIL</span>
                <strong>
                  {selectedRequest.email || "—"}
                </strong>
              </div>

              <div>
                <span>BUSINESS</span>
                <strong>
                  {selectedRequest.business || "—"}
                </strong>
              </div>

              <div>
                <span>TOPIC</span>
                <strong>
                  {selectedRequest.topic || "—"}
                </strong>
              </div>

              <div>
                <span>SUBMITTED DATE</span>
                <strong>
                  {selectedRequest.submittedAt || "—"}
                </strong>
              </div>

              <div>
                <span>STATUS</span>
                <strong>
                  {selectedRequest.status || "New"}
                </strong>
              </div>

              <div className="admin-insights-detail-message">

                <span>REQUEST MESSAGE</span>

                <p>
                  {selectedRequest.message || "—"}
                </p>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default AdminInsights;