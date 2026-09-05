import "./Ecosystem.css";

const ecosystemItems = [
  {
    number: "01",
    title: "Designers & Creators",
    text: "Discover opportunities, collaborate and bring new ideas to life."
  },
  {
    number: "02",
    title: "Manufacturers & Suppliers",
    text: "Connect production capabilities with fashion businesses."
  },
  {
    number: "03",
    title: "Retailers & Brands",
    text: "Source products, discover talent and reach new markets."
  },
  {
    number: "04",
    title: "Influencers & Affiliates",
    text: "Create influence-driven commerce and brand partnerships."
  },
  {
    number: "05",
    title: "Consumers",
    text: "Discover unique fashion products and experiences."
  }
];

export default function Ecosystem() {
  return (
    <section className="ecosystem" id="ecosystem">
      <div className="eco-container">
        <div className="eco-title">
          <p>02 — ECOSYSTEM</p>
          <h2>Everyone connected.<br />Everything in one place.</h2>
        </div>

        <div className="eco-list">
          {ecosystemItems.map((item) => (
            <div className="eco-item" key={item.number}>
              <span>{item.number}</span>

              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>

              <b>↗</b>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}