import StatusBadge from "../components/StatusBadge";

const drops = [
  {
    id: 1,
    name: "Autumn Essentials",
    status: "active",
  },
  {
    id: 2,
    name: "Streetwear Edit",
    status: "scheduled",
  },
  {
    id: 3,
    name: "Winter Capsule",
    status: "draft",
  },
];

const DropsSummary = () => (
  <div className="dashboard-card">
    <div className="dashboard-card-header">
      <h2>Product drops</h2>
    </div>

    <div className="dashboard-card-body">
      {drops.map((drop) => (
        <div
          key={drop.id}
          style={{
            padding: "13px 0",
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
            gap: 15,
          }}
        >
          <span style={{ fontSize: 13 }}>
            {drop.name}
          </span>

          <StatusBadge status={drop.status} />
        </div>
      ))}
    </div>
  </div>
);

export default DropsSummary;