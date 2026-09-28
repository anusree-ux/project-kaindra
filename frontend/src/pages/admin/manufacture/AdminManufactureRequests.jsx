import { useCallback, useEffect, useState } from "react";
import {
  Factory,
  Package,
  X,
  Trash2,
  CheckCircle2,
  Clock3,
  FileText,
  CalendarDays,
} from "lucide-react";

import "./AdminManufactureRequests.css";

function AdminManufactureRequests() {
  /* =========================================================
     INITIAL REQUESTS
  ========================================================= */

  const [requests, setRequests] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("modaManufactureRequests") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [selectedRequest, setSelectedRequest] = useState(null);


  /* =========================================================
     LOAD REQUESTS
  ========================================================= */

  const loadRequests = useCallback(() => {
    try {
      const storedRequests = JSON.parse(
        localStorage.getItem("modaManufactureRequests") || "[]"
      );

      setRequests(storedRequests);
    } catch {
      setRequests([]);
    }
  }, []);


  /* =========================================================
     LISTEN FOR NEW REQUESTS
  ========================================================= */

  useEffect(() => {
    window.addEventListener(
      "modaManufactureRequestsUpdated",
      loadRequests
    );

    window.addEventListener(
      "storage",
      loadRequests
    );

    return () => {
      window.removeEventListener(
        "modaManufactureRequestsUpdated",
        loadRequests
      );

      window.removeEventListener(
        "storage",
        loadRequests
      );
    };
  }, [loadRequests]);


  /* =========================================================
     UPDATE STATUS
  ========================================================= */

  const updateStatus = (id, status) => {
    setRequests((currentRequests) => {
      const updatedRequests = currentRequests.map((request) =>
        request.id === id
          ? {
              ...request,
              status,
            }
          : request
      );

      localStorage.setItem(
        "modaManufactureRequests",
        JSON.stringify(updatedRequests)
      );

      window.dispatchEvent(
        new Event("modaManufactureRequestsUpdated")
      );

      return updatedRequests;
    });

    setSelectedRequest((currentRequest) => {
      if (!currentRequest || currentRequest.id !== id) {
        return currentRequest;
      }

      return {
        ...currentRequest,
        status,
      };
    });
  };


  /* =========================================================
     DELETE REQUEST
  ========================================================= */

  const deleteRequest = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this production request?"
    );

    if (!confirmed) {
      return;
    }

    setRequests((currentRequests) => {
      const updatedRequests = currentRequests.filter(
        (request) => request.id !== id
      );

      localStorage.setItem(
        "modaManufactureRequests",
        JSON.stringify(updatedRequests)
      );

      window.dispatchEvent(
        new Event("modaManufactureRequestsUpdated")
      );

      return updatedRequests;
    });

    setSelectedRequest(null);
  };


  /* =========================================================
     COUNTS
  ========================================================= */

  const newCount = requests.filter(
    (request) => request.status === "New"
  ).length;

  const processingCount = requests.filter(
    (request) => request.status === "Processing"
  ).length;

  const completedCount = requests.filter(
    (request) => request.status === "Completed"
  ).length;


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main className="admin-manufacture-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="admin-manufacture-header">

        <div>
          <span className="admin-manufacture-label">
            MODAMANUFACTURE
          </span>

          <h1>
            Production Requests
          </h1>

          <p>
            Manage production requests submitted through
            ModaManufacture.
          </p>
        </div>

      </div>


      {/* =====================================================
          STATS
      ===================================================== */}

      <section className="admin-manufacture-stats">

        <div className="admin-manufacture-stat">

          <div className="admin-stat-icon">
            <FileText size={20} />
          </div>

          <div>
            <strong>
              {requests.length}
            </strong>

            <span>
              Total Requests
            </span>
          </div>

        </div>


        <div className="admin-manufacture-stat">

          <div className="admin-stat-icon">
            <Clock3 size={20} />
          </div>

          <div>
            <strong>
              {newCount}
            </strong>

            <span>
              New Requests
            </span>
          </div>

        </div>


        <div className="admin-manufacture-stat">

          <div className="admin-stat-icon">
            <Factory size={20} />
          </div>

          <div>
            <strong>
              {processingCount}
            </strong>

            <span>
              Processing
            </span>
          </div>

        </div>


        <div className="admin-manufacture-stat">

          <div className="admin-stat-icon">
            <CheckCircle2 size={20} />
          </div>

          <div>
            <strong>
              {completedCount}
            </strong>

            <span>
              Completed
            </span>
          </div>

        </div>

      </section>


      {/* =====================================================
          REQUESTS
      ===================================================== */}

      <section className="admin-manufacture-content">

        <div className="admin-manufacture-table-header">

          <div>
            <h2>
              Submitted Requests
            </h2>

            <span>
              {requests.length} request
              {requests.length !== 1 ? "s" : ""}
            </span>
          </div>

        </div>


        {/* ===================================================
            EMPTY STATE
        =================================================== */}

        {requests.length === 0 ? (

          <div className="admin-manufacture-empty">

            <Factory size={42} />

            <h3>
              No production requests yet
            </h3>

            <p>
              When someone submits a production request
              from ModaManufacture, it will appear here.
            </p>

          </div>

        ) : (

          /* =================================================
             TABLE
          ================================================= */

          <div className="admin-manufacture-table-wrapper">

            <table className="admin-manufacture-table">

              <thead>

                <tr>
                  <th>Product</th>
                  <th>Manufacturer</th>
                  <th>Quantity</th>
                  <th>Category</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>

              </thead>


              <tbody>

                {requests.map((request) => (

                  <tr key={request.id}>

                    {/* PRODUCT */}

                    <td>

                      <div className="admin-product-cell">

                        <div className="admin-product-icon">
                          <Package size={17} />
                        </div>

                        <div>

                          <strong>
                            {request.product || "Untitled Product"}
                          </strong>

                          <small>
                            {request.submittedAt}
                          </small>

                        </div>

                      </div>

                    </td>


                    {/* MANUFACTURER */}

                    <td>

                      <span className="admin-manufacturer-name">
                        {request.manufacturer || "Open to manufacturers"}
                      </span>

                    </td>


                    {/* QUANTITY */}

                    <td>
                      {request.quantity || "-"}
                    </td>


                    {/* CATEGORY */}

                    <td>

                      <span className="admin-category">
                        {request.category || "-"}
                      </span>

                    </td>


                    {/* DEADLINE */}

                    <td>
                      {request.deadline || "-"}
                    </td>


                    {/* STATUS */}

                    <td>

                      <select
                        value={request.status || "New"}
                        onChange={(event) =>
                          updateStatus(
                            request.id,
                            event.target.value
                          )
                        }
                        className={`request-status-select ${
                          (request.status || "New")
                            .toLowerCase()
                            .replace(/\s+/g, "-")
                        }`}
                      >

                        <option value="New">
                          New
                        </option>

                        <option value="Processing">
                          Processing
                        </option>

                        <option value="Completed">
                          Completed
                        </option>

                        <option value="Rejected">
                          Rejected
                        </option>

                      </select>

                    </td>


                    {/* ACTION */}

                    <td>

                      <div className="admin-request-actions">

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedRequest(request)
                          }
                        >
                          View
                        </button>


                        <button
                          type="button"
                          className="delete-request"
                          onClick={() =>
                            deleteRequest(request.id)
                          }
                          aria-label="Delete request"
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

        )}

      </section>


      {/* =====================================================
          REQUEST DETAILS MODAL
      ===================================================== */}

      {selectedRequest && (

        <div
          className="admin-request-modal-backdrop"
          onMouseDown={() =>
            setSelectedRequest(null)
          }
        >

          <div
            className="admin-request-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="admin-request-modal-header">

              <div>

                <span>
                  PRODUCTION REQUEST
                </span>

                <h2>
                  Request Details
                </h2>

              </div>


              <button
                type="button"
                onClick={() =>
                  setSelectedRequest(null)
                }
                aria-label="Close"
              >
                <X size={20} />
              </button>

            </div>


            {/* DETAILS */}

            <div className="admin-request-detail-grid">

              <div className="admin-request-detail">

                <small>
                  PRODUCT / COLLECTION
                </small>

                <strong>
                  {selectedRequest.product || "-"}
                </strong>

              </div>


              <div className="admin-request-detail">

                <small>
                  MANUFACTURER
                </small>

                <strong>
                  {selectedRequest.manufacturer ||
                    "Open to manufacturers"}
                </strong>

              </div>


              <div className="admin-request-detail">

                <small>
                  QUANTITY
                </small>

                <strong>
                  {selectedRequest.quantity || "-"}
                </strong>

              </div>


              <div className="admin-request-detail">

                <small>
                  CATEGORY
                </small>

                <strong>
                  {selectedRequest.category || "-"}
                </strong>

              </div>


              <div className="admin-request-detail">

                <small>
                  REQUIRED BY
                </small>

                <strong>

                  <CalendarDays size={15} />

                  {selectedRequest.deadline || "-"}

                </strong>

              </div>


              <div className="admin-request-detail">

                <small>
                  SUBMITTED
                </small>

                <strong>
                  {selectedRequest.submittedAt || "-"}
                </strong>

              </div>

            </div>


            {/* MESSAGE */}

            <div className="admin-request-message">

              <span>
                PROJECT DETAILS
              </span>

              <p>
                {selectedRequest.message ||
                  "No additional details provided."}
              </p>

            </div>


            {/* FOOTER */}

            <div className="admin-request-modal-footer">

              <div>

                <span>
                  CURRENT STATUS
                </span>

                <select
                  value={selectedRequest.status || "New"}
                  onChange={(event) =>
                    updateStatus(
                      selectedRequest.id,
                      event.target.value
                    )
                  }
                >

                  <option value="New">
                    New
                  </option>

                  <option value="Processing">
                    Processing
                  </option>

                  <option value="Completed">
                    Completed
                  </option>

                  <option value="Rejected">
                    Rejected
                  </option>

                </select>

              </div>


              <button
                type="button"
                className="admin-modal-delete"
                onClick={() =>
                  deleteRequest(selectedRequest.id)
                }
              >

                <Trash2 size={16} />

                Delete Request

              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}

export default AdminManufactureRequests;