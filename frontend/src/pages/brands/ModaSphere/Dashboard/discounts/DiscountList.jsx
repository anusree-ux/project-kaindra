import { useState, useEffect } from "react";
import { Plus, Loader2, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";

import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import { getDiscountCodes } from "../services/dashboardApi";

const DiscountList = () => {
  const navigate = useNavigate();
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getDiscountCodes()
      .then((data) => {
        if (!isMounted) return;
        const mapped = (data || []).map((d) => {
          const valDisplay = d.discountType === "percentage" ? `${d.discountValue}%` : `₹${d.discountValue}`;
          const usageDisplay = d.maxTotalUses ? `${d.usedCount || 0} / ${d.maxTotalUses}` : "Unlimited";
          const expiryDisplay = d.expiryDate
            ? new Date(d.expiryDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "No expiry";

          const creator =
            d.creatorName ||
            (d.creatorRole === "admin"
              ? "ModaSphere Admin"
              : d.createdBy?.name || "Seller Store");

          return {
            id: d._id || d.id,
            code: d.code,
            value: valDisplay,
            creator,
            creatorRole: d.creatorRole || "seller",
            usage: usageDisplay,
            expires: expiryDisplay,
            status: d.isActive ? "active" : "inactive",
          };
        });
        setDiscounts(mapped);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load discount codes:", err);
        setError(err.message || "Failed to load discount codes.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const columns = [
    { key: "code", label: "Code" },
    { key: "value", label: "Discount" },
    {
      key: "creator",
      label: "Created By",
      render: (creator, row) => (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: "12px",
            fontWeight: 500,
            padding: "3px 8px",
            borderRadius: "6px",
            background: row.creatorRole === "admin" ? "#f3e8ff" : "#f0fdf4",
            color: row.creatorRole === "admin" ? "#7e22ce" : "#15803d",
            border:
              row.creatorRole === "admin"
                ? "1px solid #e9d5ff"
                : "1px solid #bbf7d0",
          }}
        >
          {row.creatorRole === "admin" ? "🛡️ " : "🏬 "}
          {creator}
        </span>
      ),
    },
    { key: "usage", label: "Usage" },
    { key: "expires", label: "Expires" },
    {
      key: "status",
      label: "Status",
      render: (status) => <StatusBadge status={status} />,
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <h1>Discounts</h1>
          <p>
            Create and manage promotional discount codes.
          </p>
        </div>

        <button
          className="dashboard-btn dashboard-btn-primary"
          onClick={() =>
            navigate(
              "/businesses/modasphere/dashboard/discounts/new"
            )
          }
        >
          <Plus size={16} />
          New discount
        </button>
      </div>

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
            <p style={{ marginTop: 10, fontSize: 14 }}>Loading discounts...</p>
          </div>
        ) : discounts.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#666" }}>
            <Tag size={36} style={{ color: "#9ca3af", marginBottom: 12 }} />
            <p style={{ fontWeight: 500, fontSize: 16, margin: 0 }}>No discounts found</p>
            <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
              Create discount coupons for your marketing campaigns and seasonal promotions.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={discounts}
          />
        )}
      </div>
    </div>
  );
};

export default DiscountList;