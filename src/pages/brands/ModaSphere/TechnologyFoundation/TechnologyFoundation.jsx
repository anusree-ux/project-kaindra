import "./TechnologyFoundation.css";

const technologies = [
  {
    title: "AI & Intelligence",
    text: "Smart recommendations, discovery and business insights."
  },
  {
    title: "Digital Marketplace",
    text: "A connected environment for fashion products and services."
  },
  {
    title: "Data Platform",
    text: "Structured data powering better decisions across the ecosystem."
  },
  {
    title: "Mobile Experiences",
    text: "Accessible digital experiences for every participant."
  },
  {
    title: "Secure Infrastructure",
    text: "Reliable technology designed to scale globally."
  },
  {
    title: "Analytics",
    text: "Measure trends, performance and ecosystem growth."
  }
];

export default function TechnologyFoundation() {
  return (
    <section className="technology-foundation" id="technology">
      <div className="tech-container">
        <p>08 — TECHNOLOGY FOUNDATION</p>

        <h2>Technology powering<br />fashion's future.</h2>

        <div className="tech-grid">
          {technologies.map((tech, index) => (
            <div className="tech-card" key={tech.title}>
              <span>0{index + 1}</span>
              <h3>{tech.title}</h3>
              <p>{tech.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}