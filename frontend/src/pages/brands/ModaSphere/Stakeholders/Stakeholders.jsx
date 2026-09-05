import "./Stakeholders.css";

const stakeholders = [
  {
    title: "Designers",
    text: "Build visibility and find new collaboration opportunities."
  },
  {
    title: "Manufacturers",
    text: "Find clients and increase production opportunities."
  },
  {
    title: "Brands",
    text: "Discover talent, products and business partners."
  },
  {
    title: "Retailers",
    text: "Access innovative products and fashion businesses."
  },
  {
    title: "Influencers",
    text: "Create partnerships and monetize influence."
  },
  {
    title: "Consumers",
    text: "Discover and experience the future of fashion."
  }
];

export default function Stakeholders() {
  return (
    <section className="stakeholders">
      <div className="stake-container">
        <p>06 — TARGET STAKEHOLDERS</p>

        <h2>Built for the<br />entire fashion chain.</h2>

        <div className="stake-grid">
          {stakeholders.map((item) => (
            <article key={item.title}>
              <div className="stake-icon">✦</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}