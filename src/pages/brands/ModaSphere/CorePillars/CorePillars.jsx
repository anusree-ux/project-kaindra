import "./CorePillars.css";

const pillars = [
  ["01", "Discovery", "Connect people, products and opportunities."],
  ["02", "Collaboration", "Make partnerships and creative collaboration easier."],
  ["03", "Commerce", "Turn ideas and relationships into business."],
  ["04", "Community", "Build a powerful global fashion network."],
  ["05", "Intelligence", "Use technology and data to make better decisions."]
];

export default function CorePillars() {
  return (
    <section className="core-pillars" id="pillars">
      <div className="pillars-container">
        <p className="section-number">03 — CORE PILLARS</p>

        <h2>The foundation<br />of ModaSphere.</h2>

        <div className="pillars-grid">
          {pillars.map(([number, title, text]) => (
            <div className="pillar-card" key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}