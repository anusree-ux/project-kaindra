import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import QuoteForm from "./QuoteForm";
import { getProductionRequestById } from "../services/dashboardApi";

const RequestDetail = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getProductionRequestById(requestId)
      .then((data) => {
        if (!isMounted) return;
        setRequest(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load production request:", err);
        setError(err.response?.data?.message || err.message || "Failed to load request details.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [requestId]);

  const displayId = requestId && requestId.length > 8 ? `REQ-${requestId.slice(-6).toUpperCase()}` : requestId;

  if (loading) {
    return (
      <div className="dashboard-page">
        <div style={{ padding: "60px 0", textAlign: "center", color: "#666" }}>
          <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
          <p style={{ marginTop: 12 }}>Loading request details...</p>
        </div>
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="dashboard-page">
        <button
          className="dashboard-btn dashboard-btn-secondary"
          onClick={() => navigate(-1)}
          style={{ marginBottom: 20 }}
        >
          <ArrowLeft size={16} />
          Back to Requests
        </button>
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #ef4444",
            color: "#b91c1c",
            borderRadius: 8,
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <AlertCircle size={20} />
          <div>{error}</div>
        </div>
      </div>
    );
  }

  const design = request?.designId;
  const manufacturer = request?.manufacturerId;

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <button
            className="dashboard-btn dashboard-btn-secondary"
            onClick={() => navigate(-1)}
            style={{ marginBottom: 12 }}
          >
            <ArrowLeft size={16} />
            Requests
          </button>

          <h1>{displayId}</h1>
          <p>Production request details.</p>
        </div>

        <StatusBadge status={request?.status || "open"} />
      </div>

      <div className="dashboard-two-column">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>Request information</h2>
          </div>

          <div className="dashboard-card-body">
            <p>
              <strong>Product / Design:</strong>{" "}
              {design?.title || request?.product || "Apparel Item"}
            </p>

            <p>
              <strong>Quantity:</strong> {request?.quantity || "-"}
            </p>

            <p>
              <strong>Manufacturer:</strong>{" "}
              {manufacturer?.companyName || "Pending Assignment"}
            </p>

            {request?.targetPricePerUnit && (
              <p>
                <strong>Target price / unit:</strong> ₹{request.targetPricePerUnit}
              </p>
            )}

            {request?.targetDeliveryDate && (
              <p>
                <strong>Required by:</strong>{" "}
                {new Date(request.targetDeliveryDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}

            {request?.notes && (
              <p>
                <strong>Notes:</strong> {request.notes}
              </p>
            )}
          </div>
        </div>

        <QuoteForm quoteData={request?.quote} />
      </div>
    </div>
  );
};

export default RequestDetail;