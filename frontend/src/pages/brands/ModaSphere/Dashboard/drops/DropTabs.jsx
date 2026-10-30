const tabs = [
  "all",
  "draft",
  "scheduled",
  "active",
  "completed",
];

const DropTabs = ({ value, onChange }) => (
  <div
    style={{
      display: "flex",
      gap: 7,
      flexWrap: "wrap",
    }}
  >
    {tabs.map((tab) => (
      <button
        key={tab}
        type="button"
        className={`dashboard-btn ${
          value === tab
            ? "dashboard-btn-primary"
            : "dashboard-btn-secondary"
        }`}
        onClick={() => onChange(tab)}
      >
        {tab.charAt(0).toUpperCase() +
          tab.slice(1)}
      </button>
    ))}
  </div>
);

export default DropTabs;