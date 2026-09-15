import "./Market.css";

const kaindraHighlights = [
  {
    number: "01",
    title: "Innovation",
    text: "We explore new ideas, technologies and opportunities that shape the future.",
  },
  {
    number: "02",
    title: "Connection",
    text: "We connect businesses, communities and people through meaningful experiences.",
  },
  {
    number: "03",
    title: "Impact",
    text: "We build platforms and ecosystems designed to create lasting value.",
  },
];

function Market() {
  return (
    <section className="market" id="about">
      <div className="container">

        <div className="market-intro">
          <div className="market-intro-label">
            <span>01</span>
            <p>ABOUT KAINDRA</p>
          </div>

          <div className="market-intro-content">
            <h2>
              Building ideas that
              <br />
              <span>move the future.</span>
            </h2>

            <p>
              Kaindra is an innovation-driven platform focused on building
              businesses, communities and experiences that connect people,
              creativity, technology and opportunity.
            </p>

            <p>
              Our vision is to create meaningful ecosystems where different
              industries and communities can come together, evolve and grow.
            </p>
          </div>
        </div>

        <div className="market-highlights">
          {kaindraHighlights.map((item) => (
            <article className="market-highlight" key={item.number}>
              <span className="market-number">{item.number}</span>

              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="market-moda">
          <p className="section-label">OUR FLAGSHIP INITIATIVE</p>

          <h3>
            ModaSphere
          </h3>

          <p>
            A global fashion ecosystem bringing heritage, innovation,
            sustainability and technology together.
          </p>

          <a href="#modasphere">
            Explore ModaSphere →
          </a>
        </div>

      </div>
    </section>
  );
}

export default Market;