import { useEffect, useMemo, useState } from "react";
import { Plus, Loader2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import DropTabs from "./DropTabs";
import { getSellerDrops } from "../services/dashboardApi";

const DropList = () => {
  const navigate = useNavigate();
  const [drops, setDrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getSellerDrops()
      .then((data) => {
        if (!isMounted) return;
        const mapped = (data || []).map((drop) => {
          const rawStatus = drop.status || "upcoming";
          let normalizedStatus = rawStatus;
          if (rawStatus === "live") normalizedStatus = "active";
          if (rawStatus === "upcoming") normalizedStatus = "scheduled";
          if (rawStatus === "ended") normalizedStatus = "completed";

          const releaseDate = drop.startTime
            ? new Date(drop.startTime).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "TBD";

          const totalStock = Array.isArray(drop.productIds)
            ? drop.productIds.reduce(
                (sum, p) => sum + (typeof p === "object" ? (p.dropStock ?? p.stock ?? 0) : 0),
                0
              )
            : drop.stock || 0;

          return {
            id: drop._id || drop.id,
            name: drop.title || drop.name || "Untitled Drop",
            release: releaseDate,
            stock: totalStock || "-",
            status: normalizedStatus,
            rawStatus,
          };
        });
        setDrops(mapped);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load drops:", err);
        setError(err.message || "Failed to load product drops.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      tab === "all"
        ? drops
        : drops.filter(
            (drop) => drop.status === tab || drop.rawStatus === tab
          ),
    [drops, tab]
  );

  const columns = [
    { key: "name", label: "Drop" },
    { key: "release", label: "Release" },
    { key: "stock", label: "Drop stock" },
    {
      key: "status",
      label: "Status",
      render: (status) => (
        <StatusBadge status={status} />
      ),
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <h1>Product Drops</h1>
          <p>
            Plan limited releases and manage drop inventory.
          </p>
        </div>

        <button
          className="dashboard-btn dashboard-btn-primary"
          onClick={() =>
            navigate(
              "/businesses/modasphere/dashboard/drops/new"
            )
          }
        >
          <Plus size={16} />
          Create drop
        </button>
      </div>

      <DropTabs value={tab} onChange={setTab} />

      {error && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #ef4444",
            color: "#b91c1c",
            borderRadius: 8,
            padding: "12px 16px",
            marginTop: 16,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <div className="dashboard-card" style={{ marginTop: 18 }}>
        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#666" }}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ marginTop: 10, fontSize: 14 }}>Loading drops...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#666" }}>
            <Sparkles size={36} style={{ color: "#9ca3af", marginBottom: 12 }} />
            <p style={{ fontWeight: 500, fontSize: 16, margin: 0 }}>No product drops found</p>
            <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
              Schedule a new limited-edition drop to generate buzz and manage high-demand releases.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
          />
        )}
      </div>
    </div>
  );
};

export default DropList;