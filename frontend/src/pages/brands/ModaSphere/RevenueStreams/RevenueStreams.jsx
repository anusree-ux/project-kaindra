import "./RevenueStreams.css";

const streams = [
  "Marketplace commissions",
  "Premium memberships",
  "Brand partnerships",
  "Advertising",
  "Subscription services",
  "Data & intelligence services"
];

export default function RevenueStreams() {
  return (
    <section className="revenue-streams">
      <div className="revenue-container">
        <div className="revenue-heading">
          <p>07 — REVENUE STREAMS</p>
          <h2>A scalable<br />business model.</h2>
        </div>

        <div className="revenue-list">
          {streams.map((stream, index) => (
            <div key={stream}>
              <span>0{index + 1}</span>
              <h3>{stream}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}