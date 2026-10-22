const SalesTrendChart = ({
  data = [],
  height = 260,
}) => {
  if (!data.length) {
    return (
      <div
        style={{
          height,
          display: "grid",
          placeItems: "center",
          color: "#999",
          fontSize: 13,
        }}
      >
        No sales data available
      </div>
    );
  }

  const width = 800;
  const paddingX = 40;
  const paddingY = 25;

  const values = data.map(
    (item) => Number(item.value ?? item.sales ?? 0)
  );

  const max = Math.max(...values, 1);

  const points = values
    .map((value, index) => {
      const x =
        paddingX +
        (index *
          (width - paddingX * 2)) /
          Math.max(values.length - 1, 1);

      const y =
        height -
        paddingY -
        (value / max) *
          (height - paddingY * 2);

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
      >
        <line
          x1={paddingX}
          y1={height - paddingY}
          x2={width - paddingX}
          y2={height - paddingY}
          stroke="#e5e5e5"
        />

        <polyline
          points={points}
          fill="none"
          stroke="#111111"
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
        />

        {values.map((value, index) => {
          const [x, y] = points
            .split(" ")[index]
            .split(",");

          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="4"
              fill="#ffffff"
              stroke="#111111"
              strokeWidth="2"
            />
          );
        })}
      </svg>
    </div>
  );
};

export default SalesTrendChart;