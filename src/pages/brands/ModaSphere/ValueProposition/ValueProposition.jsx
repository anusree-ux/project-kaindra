import "./ValueProposition.css";

const values = [
  "One connected platform",
  "Faster discovery and collaboration",
  "Reduced fragmentation",
  "New revenue opportunities",
  "Data-driven fashion decisions",
  "Global market access"
];

export default function ValueProposition() {
  return (
    <section className="value-proposition">
      <div className="value-container">
        <div>
          <p>04 — VALUE PROPOSITION</p>
          <h2>More connection.<br />More opportunity.</h2>
        </div>

        <div className="value-list">
          {values.map((value, index) => (
            <div key={value}>
              <span>0{index + 1}</span>
              <h3>{value}</h3>
              <b>+</b>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}