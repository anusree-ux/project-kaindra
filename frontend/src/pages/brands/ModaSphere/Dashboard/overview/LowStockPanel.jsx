const products = [
  {
    id: 1,
    name: "Classic Linen Shirt",
    stock: 4,
  },
  {
    id: 2,
    name: "Oversized Cotton Tee",
    stock: 6,
  },
  {
    id: 3,
    name: "Essential Hoodie",
    stock: 8,
  },
];

const LowStockPanel = () => (
  <div className="dashboard-card">
    <div className="dashboard-card-header">
      <h2>Low stock</h2>
      <span style={{ color: "#b45309", fontSize: 12 }}>
        Needs attention
      </span>
    </div>

    <div className="dashboard-card-body">
      {products.map((product) => (
        <div
          key={product.id}
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
            {product.stock} left
          </strong>
        </div>
      ))}
    </div>
  </div>
);

export default LowStockPanel;