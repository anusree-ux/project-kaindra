import { Link } from "react-router-dom";
import { ArrowRight, Clock, Package, ShoppingBag } from "lucide-react";
import "./ModaDrop.css";

const drops = [
  {
    id: 1,
    name: "Urban Future",
    category: "Streetwear",
    description:
      "Limited streetwear pieces designed for the next generation.",
    image:
      "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80",
    status: "Coming Soon",
  },
  {
    id: 2,
    name: "Heritage Reimagined",
    category: "Ethnic & Cultural",
    description:
      "Traditional craftsmanship redesigned for modern fashion.",
    image:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80",
    status: "Pre-order Open",
  },
  {
    id: 3,
    name: "Future Form",
    category: "Avant-Garde",
    description:
      "Experimental silhouettes combining technology and fashion.",
    image:
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1200&q=80",
    status: "Coming Soon",
  },
];

function ModaDrop() {
  return (
    <main className="modadrop-page">

      {/* HERO */}

      <section className="modadrop-hero">
        <div className="modadrop-hero-content">
          <p className="modadrop-eyebrow">
            MODASPHERE / MODADROP
          </p>

          <h1>
            Fashion Drops.
            <br />
            Before They’re Gone.
          </h1>

          <p className="modadrop-hero-text">
            Discover limited fashion releases, exclusive
            collections, and pre-order opportunities from
            emerging and established creators.
          </p>

          <div className="modadrop-hero-actions">
            <a href="#drops" className="modadrop-primary-button">
              Explore Drops
              <ArrowRight size={18} />
            </a>

            <Link
              to="/businesses"
              className="modadrop-secondary-button"
            >
              Back to Businesses
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}

      <section className="modadrop-how">
        <div className="modadrop-section-header">
          <p className="modadrop-label">HOW MODADROP WORKS</p>

          <h2>
            Discover. Reserve. Receive.
          </h2>

          <p>
            ModaDrop connects fashion creators with customers
            through limited releases and pre-orders.
          </p>
        </div>

        <div className="modadrop-process">

          <div className="modadrop-process-card">
            <div className="modadrop-process-icon">
              <ShoppingBag size={22} />
            </div>

            <span>01</span>

            <h3>Discover</h3>

            <p>
              Explore upcoming and active fashion drops
              from across the ModaSphere ecosystem.
            </p>
          </div>

          <div className="modadrop-process-card">
            <div className="modadrop-process-icon">
              <Clock size={22} />
            </div>

            <span>02</span>

            <h3>Pre-order</h3>

            <p>
              Reserve limited products before the production
              window closes.
            </p>
          </div>

          <div className="modadrop-process-card">
            <div className="modadrop-process-icon">
              <Package size={22} />
            </div>

            <span>03</span>

            <h3>Receive</h3>

            <p>
              Follow your order as it moves through
              production, fulfillment, and delivery.
            </p>
          </div>

        </div>
      </section>

      {/* DROPS */}

      <section className="modadrop-drops" id="drops">
        <div className="modadrop-section-header">
          <p className="modadrop-label">FEATURED DROPS</p>

          <h2>
            Limited releases.
            <br />
            One chance to get them.
          </h2>
        </div>

        <div className="modadrop-grid">
          {drops.map((drop) => (
            <article
              className="modadrop-card"
              key={drop.id}
            >
              <div className="modadrop-image-wrapper">
                <img
                  src={drop.image}
                  alt={drop.name}
                />

                <span
                  className={`modadrop-status ${
                    drop.status === "Pre-order Open"
                      ? "open"
                      : ""
                  }`}
                >
                  {drop.status}
                </span>
              </div>

              <div className="modadrop-card-content">
                <p>{drop.category}</p>

                <h3>{drop.name}</h3>

                <span>{drop.description}</span>

                <Link
  to={`/businesses/modadrop/drop/${drop.id}`}
  className="modadrop-view-button"
>
  View Drop
  <ArrowRight size={17} />
</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}

      <section className="modadrop-cta">
        <p className="modadrop-label">
          THE MODADROP EXPERIENCE
        </p>

        <h2>
          Limited fashion.
          <br />
          Built around anticipation.
        </h2>

        <p>
          Discover exclusive collections and reserve pieces
          before they enter production.
        </p>

        <a href="#drops" className="modadrop-primary-button">
          Explore Current Drops
          <ArrowRight size={18} />
        </a>
      </section>

    </main>
  );
}

export default ModaDrop;