import { useState, useEffect } from "react";
import { Eye, Loader2, Factory } from "lucide-react";
import { useNavigate } from "react-router-dom";

import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import VerificationBanner from "./VerificationBanner";
import { getProductionRequestsSent } from "../services/dashboardApi";

const RequestList = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getProductionRequestsSent()
      .then((data) => {
        if (!isMounted) return;
        const mapped = (data || []).map((req) => {
          const rawId = req._id || req.id;
          const displayId = rawId && rawId.length > 8 ? `REQ-${rawId.slice(-6).toUpperCase()}` : rawId;
          const productName = req.designId?.title || req.product || "Design";
          const manufacturerName = req.manufacturerId?.companyName || req.manufacturer || "Pending assignment";

          return {
            id: displayId,
            rawId,
            product: productName,
            quantity: req.quantity || "-",
            manufacturer: manufacturerName,
            status: req.status || "requested",
          };
        });
        setRequests(mapped);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load production requests:", err);
        setError(err.message || "Failed to load production requests.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const columns = [
    { key: "id", label: "Request" },
    { key: "product", label: "Product" },
    { key: "quantity", label: "Quantity" },
    {
      key: "manufacturer",
      label: "Manufacturer",
    },
    {
      key: "status",
      label: "Status",
      render: (status) => (
        <StatusBadge status={status} />
      ),
    },
    {
      key: "view",
      label: "",
      render: (_, request) => (
        <button
          className="dashboard-icon-button"
          onClick={() =>
            navigate(
              `/businesses/modasphere/dashboard/production-requests/${request.rawId || request.id}`
            )
          }
          title="View request details"
        >
          <Eye size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <h1>Production Requests</h1>
          <p>
            Track manufacturing requests, quotes and production.
          </p>
        </div>
      </div>

      <VerificationBanner />

      {error && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #ef4444",
            color: "#b91c1c",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 20,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <div className="dashboard-card">
        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#666" }}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ marginTop: 10, fontSize: 14 }}>Loading production requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#666" }}>
            <Factory size={36} style={{ color: "#9ca3af", marginBottom: 12 }} />
            <p style={{ fontWeight: 500, fontSize: 16, margin: 0 }}>No production requests</p>
            <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
              When you submit production requests to verified apparel manufacturers, they will appear here.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={requests}
          />
        )}
      </div>
    </div>
  );
};

export default RequestList;