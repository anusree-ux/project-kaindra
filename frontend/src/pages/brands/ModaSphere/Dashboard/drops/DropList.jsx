import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Eye,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import DropTabs from "./DropTabs";
import { deleteDrop, getSellerDrops } from "../services/dashboardApi";

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not set";

const DropList = () => {
  const navigate = useNavigate();
  const [drops, setDrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("all");
  const [selectedDrop, setSelectedDrop] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const refreshDrops = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getSellerDrops();
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
            details: drop,
          };
      });
      setDrops(mapped);
    } catch (err) {
      console.error("Failed to load drops:", err);
      setError(err.message || "Failed to load product drops.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDrops();
  }, [refreshDrops]);

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
    {
      key: "actions",
      label: "Actions",
      render: (_, drop) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <button
            type="button"
            className="dashboard-btn dashboard-btn-secondary"
            onClick={() => setSelectedDrop(drop.details)}
            aria-label={`View ${drop.name} details`}
            title="View details"
          >
            <Eye size={15} /> View
          </button>
          <button
            type="button"
            className="dashboard-btn dashboard-btn-secondary"
            onClick={() =>
              navigate(`/businesses/modasphere/dashboard/drops/${drop.id}/edit`)
            }
            disabled={drop.rawStatus !== "upcoming"}
            title={
              drop.rawStatus === "upcoming"
                ? "Edit drop"
                : "Only scheduled drops can be edited"
            }
            aria-label={`Edit ${drop.name}`}
          >
            <Pencil size={15} /> Edit
          </button>
          <button
            type="button"
            className="dashboard-btn dashboard-btn-secondary"
            onClick={() => handleDelete(drop)}
            disabled={drop.rawStatus !== "upcoming" || deletingId === drop.id}
            title={
              drop.rawStatus === "upcoming"
                ? "Delete drop"
                : "Only scheduled drops can be deleted"
            }
            aria-label={`Delete ${drop.name}`}
          >
            {deletingId === drop.id ? (
              <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Trash2 size={15} />
            )}
            Delete
          </button>
        </div>
      ),
    },
  ];

  async function handleDelete(drop) {
    if (
      !window.confirm(
        `Delete "${drop.name}"? This is only allowed for scheduled drops without orders or waitlist activity.`,
      )
    ) {
      return;
    }

    setDeletingId(drop.id);
    setError(null);
    try {
      await deleteDrop(drop.id);
      await refreshDrops();
    } catch (err) {
      console.error("Failed to delete drop:", err);
      setError(err.response?.data?.message || err.message || "Failed to delete drop.");
    } finally {
      setDeletingId(null);
    }
  }

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

      {selectedDrop && (
        <div
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelectedDrop(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="drop-details-title"
            className="dashboard-card"
            style={{ width: "min(640px, 100%)", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div
              className="dashboard-card-header"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <h2 id="drop-details-title">{selectedDrop.title || "Drop details"}</h2>
              <button
                type="button"
                className="dashboard-btn dashboard-btn-secondary"
                onClick={() => setSelectedDrop(null)}
                aria-label="Close drop details"
              >
                <X size={16} />
              </button>
            </div>
            <div className="dashboard-card-body">
              <p><strong>Status:</strong> <StatusBadge status={selectedDrop.status === "live" ? "active" : selectedDrop.status === "upcoming" ? "scheduled" : "completed"} /></p>
              <p><strong>Release:</strong> {formatDateTime(selectedDrop.startTime)}</p>
              <p><strong>End:</strong> {formatDateTime(selectedDrop.endTime)}</p>
              <p><strong>Purchase limit:</strong> {selectedDrop.maxPerUser ?? "—"} per customer</p>
              <h3>Linked products and drop stock</h3>
              <ul>
                {(selectedDrop.productIds || []).map((product, index) => (
                  <li key={product._id || index}>
                    {product.name || "Product"} — {product.dropStock ?? product.stock ?? 0} in drop stock
                  </li>
                ))}
              </ul>
              {selectedDrop.description && <p>{selectedDrop.description}</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default DropList;