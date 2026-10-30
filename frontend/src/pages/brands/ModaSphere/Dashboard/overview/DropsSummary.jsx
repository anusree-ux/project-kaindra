import StatusBadge from "../components/StatusBadge";

const DropsSummary = ({ drops = [] }) => {
  const displayDrops = Array.isArray(drops) ? drops : [];

  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header">
        <h2>Product drops</h2>
        <span style={{ fontSize: 12, color: "#888" }}>
          {displayDrops.length} total
        </span>
      </div>

      <div className="dashboard-card-body">
        {displayDrops.length === 0 ? (
          <p style={{ color: "#888", fontSize: 13, margin: "16px 0" }}>No product drops scheduled yet.</p>
        ) : (
          displayDrops.slice(0, 5).map((drop) => (
            <div
              key={drop._id || drop.id}
              style={{
                padding: "13px 0",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                gap: 15,
              }}
            >
              <span style={{ fontSize: 13 }}>
                {drop.title || drop.name}
              </span>

              <StatusBadge status={drop.status || "scheduled"} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DropsSummary;