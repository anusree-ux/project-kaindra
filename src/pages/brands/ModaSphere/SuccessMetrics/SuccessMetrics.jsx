import "./SuccessMetrics.css";

const metrics = [
  ["10K+", "Fashion Professionals"],
  ["5K+", "Businesses Connected"],
  ["100K+", "Products & Services"],
  ["50+", "Markets Reached"]
];

export default function SuccessMetrics() {
  return (
    <section className="success-metrics">
      <div className="metrics-container">
        <p>11 — SUCCESS METRICS</p>

        <h2>Measure the<br />movement.</h2>

        <div className="metrics-grid">
          {metrics.map(([number, label]) => (
            <div key={label}>
              <strong>{number}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="metrics-footer">
          <h3>ModaSphere</h3>
          <p>Connecting the future of fashion.</p>
        </div>
      </div>
    </section>
  );
}