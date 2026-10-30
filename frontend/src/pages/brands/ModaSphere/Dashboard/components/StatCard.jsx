const StatCard = ({
  title,
  value,
  icon: Icon,
  change,
  description,
}) => (
  <article className="dashboard-card">
    <div className="dashboard-card-body">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 15,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              color: "#737373",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {title}
          </p>

          <h3
            style={{
              margin: "10px 0 5px",
              fontSize: 26,
            }}
          >
            {value}
          </h3>

          {description && (
            <span
              style={{
                color: "#999",
                fontSize: 11,
              }}
            >
              {description}
            </span>
          )}

          {change && (
            <div
              style={{
                marginTop: 8,
                color: "#15803d",
                fontSize: 11,
              }}
            >
              {change}
            </div>
          )}
        </div>

        {Icon && (
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: "#f5f5f5",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  </article>
);

export default StatCard;