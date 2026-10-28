const LowStockPanel = ({ items = [] }) => {
  const displayItems = Array.isArray(items) ? items : [];

  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header">
        <h2>Low stock</h2>
        <span style={{ color: "#b45309", fontSize: 12 }}>
          {displayItems.length > 0 ? `${displayItems.length} items need attention` : "Inventory healthy"}
        </span>
      </div>

      <div className="dashboard-card-body">
        {displayItems.length === 0 ? (
          <p style={{ color: "#888", fontSize: 13, margin: "16px 0" }}>All products have sufficient stock levels.</p>
        ) : (
          displayItems.slice(0, 5).map((product) => (
            <div
              key={product._id || product.id}
              style={{
                padding: "13px 0",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 13 }}>
                {product.name}
              </span>

              <strong
                style={{
                  fontSize: 12,
                  color: "#b45309",
                }}
              >
                {product.stock ?? product.dropStock ?? 0} left
              </strong>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LowStockPanel;