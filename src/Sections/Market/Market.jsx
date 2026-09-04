import "./Market.css";

const marketData = [
  {
    title: "New opportunities",
    text: "Exploring ideas that connect people, products and businesses.",
    image:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Growing together",
    text: "Building stronger relationships between businesses and communities.",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Ideas in motion",
    text: "Technology and creativity working together to create experiences.",
    image:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=80",
  },
];

function Market() {
  return (
    <section className="market">
      <div className="container">

        <div className="market-heading">
          <div>
            <p className="section-label">MARKET</p>
            <h2 className="section-title">
              Ideas moving forward.
            </h2>
          </div>
        </div>

        <div className="market-grid">
          {marketData.map((item) => (
            <article className="market-card" key={item.title}>

              <img src={item.image} alt={item.title} />

              <div className="market-card-body">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <button>Read more →</button>
              </div>

            </article>
          ))}
        </div>

      </div>
    </section>
  );
}

export default Market;