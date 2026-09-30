import {
  ShoppingBag,
  Sparkles,
  Palette,
  Factory,
  Truck,
  CreditCard,
  Megaphone,
  PlayCircle,
  GraduationCap,
  BarChart3,
  ArrowRight,
} from "lucide-react";

import { Link } from "react-router-dom";

import "./Businesses.css";

const businesses = [
  {
    id: "modamart",
    name: "ModaMart",
    category: "COMMERCE",
    title: "Global Fashion Marketplace",
    description:
      "A connected marketplace where consumers, designers, brands and retailers discover, buy and sell fashion.",
    icon: ShoppingBag,
  },

  {
    id: "modadrop",
    name: "ModaDrop",
    category: "LAUNCH & PRE-ORDER",
    title: "Drops & Pre-order Platform",
    description:
      "A launch platform for limited collections, exclusive drops and pre-order based fashion businesses.",
    icon: Sparkles,
  },

  {
    id: "modastudio",
    name: "ModaStudio",
    category: "CREATION",
    title: "Design & Creation Hub",
    description:
      "A creative environment connecting designers, creators and fashion businesses from concept to product.",
    icon: Palette,
  },

  {
    id: "modamanufacture",
    name: "ModaManufacture",
    category: "PRODUCTION",
    title: "Manufacturing Network",
    description:
      "A production network connecting fashion businesses with manufacturers and suppliers.",
    icon: Factory,
  },

  {
    id: "modalogix",
    name: "ModaLogix",
    category: "LOGISTICS",
    title: "Logistics & Fulfillment",
    description:
      "Infrastructure for inventory, warehousing, shipping, order fulfillment and returns.",
    icon: Truck,
  },

  {
    id: "modapay",
    name: "ModaPay",
    category: "FINTECH",
    title: "Payments & Fashion Commerce",
    description:
      "Payment infrastructure supporting transactions, settlements, refunds and financial flows across ModaSphere.",
    icon: CreditCard,
  },

  {
    id: "modainfluence",
    name: "ModaInfluence",
    category: "CREATOR ECONOMY",
    title: "Influencer & Affiliate Hub",
    description:
      "A platform connecting brands, creators and influencers through campaigns and affiliate opportunities.",
    icon: Megaphone,
  },

  {
    id: "modatales",
    name: "ModaTales",
    category: "MEDIA",
    title: "Content & Media Network",
    description:
      "A fashion storytelling network for articles, interviews, videos, podcasts and creator content.",
    icon: PlayCircle,
  },

  {
    id: "modaacademy",
    name: "ModaAcademy",
    category: "EDUCATION",
    title: "Learning & Education",
    description:
      "Fashion education, courses, mentorship and skills development for creators and professionals.",
    icon: GraduationCap,
  },

  {
    id: "modainsights",
    name: "ModaInsights",
    category: "DATA & AI",
    title: "Data & AI Intelligence",
    description:
      "Data, analytics and AI-powered insights helping fashion businesses understand markets, customers and growth.",
    icon: BarChart3,
  },
];

function Businesses() {
  return (
    <main className="businesses-page">

      {/* HERO */}
      <section className="businesses-hero">
        <div className="businesses-container">

          <span className="businesses-label">
            MODASPHERE BUSINESSES
          </span>

          <h1>
            Ten businesses.
            <br />
            One connected ecosystem.
          </h1>

          <p className="businesses-hero-text">
            ModaSphere brings commerce, creation, production,
            logistics, payments, creators, media, education and
            intelligence together into one connected fashion ecosystem.
          </p>

          <a
            href="#businesses-list"
            className="businesses-hero-button"
          >
            Explore Businesses
            <ArrowRight size={18} />
          </a>

        </div>
      </section>

      {/* BUSINESS FLOW */}
      <section className="business-flow">
        <div className="businesses-container">

          <div className="business-section-heading">
            <span>HOW MODASPHERE WORKS</span>

            <h2>
              From idea to impact.
            </h2>
          </div>

          <div className="business-flow-grid">

            <div className="flow-item">
              <span>01</span>
              <h3>Create</h3>
              <p>ModaStudio</p>
            </div>

            <div className="flow-item">
              <span>02</span>
              <h3>Produce</h3>
              <p>ModaManufacture</p>
            </div>

            <div className="flow-item">
              <span>03</span>
              <h3>Launch</h3>
              <p>ModaDrop</p>
            </div>

            <div className="flow-item">
              <span>04</span>
              <h3>Sell</h3>
              <p>ModaMart</p>
            </div>

            <div className="flow-item">
              <span>05</span>
              <h3>Pay</h3>
              <p>ModaPay</p>
            </div>

            <div className="flow-item">
              <span>06</span>
              <h3>Deliver</h3>
              <p>ModaLogix</p>
            </div>

            <div className="flow-item">
              <span>07</span>
              <h3>Promote</h3>
              <p>ModaInfluence</p>
            </div>

            <div className="flow-item">
              <span>08</span>
              <h3>Understand</h3>
              <p>ModaInsights</p>
            </div>

          </div>

        </div>
      </section>

      {/* BUSINESSES */}
      <section
        className="businesses-list-section"
        id="businesses-list"
      >
        <div className="businesses-container">

          <div className="business-section-heading centered">

            <span>
              OUR BUSINESS VERTICALS
            </span>

            <h2>
              Explore the ModaSphere businesses.
            </h2>

            <p>
              Each business serves a specific part of the fashion
              value chain while remaining connected to the wider ecosystem.
            </p>

          </div>

          <div className="businesses-grid">

            {businesses.map((business, index) => {

              const Icon = business.icon;

              return (
                <article
                  className="business-card"
                  key={business.id}
                >

                  <div className="business-card-top">

                    <span className="business-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="business-icon">
                      <Icon
                        size={27}
                        strokeWidth={1.5}
                      />
                    </div>

                  </div>

                  <div className="business-card-content">

                    <span className="business-category">
                      {business.category}
                    </span>

                    <h3>
                      {business.name}
                    </h3>

                    <h4>
                      {business.title}
                    </h4>

                    <p>
                      {business.description}
                    </p>

                  </div>

                  {/* React Router navigation */}
                  <Link
                    to={`/businesses/${business.id}`}
                    className="business-card-link"
                  >
                    Explore {business.name}
                    <ArrowRight size={17} />
                  </Link>

                </article>
              );
            })}

          </div>

        </div>
      </section>

      {/* ECOSYSTEM CONNECTION */}
      <section className="business-connection">
        <div className="businesses-container">

          <div className="business-connection-content">

            <span className="businesses-label">
              ONE CONNECTED SYSTEM
            </span>

            <h2>
              Every business strengthens
              <br />
              the next.
            </h2>

            <p>
              Creation can lead to production. Production can lead
              to commerce. Commerce creates transactions and logistics.
              Creators and media create discovery, while data and
              education help the entire ecosystem grow.
            </p>

          </div>

          <div className="connection-flow">

            <div>CREATE</div>

            <span>→</span>

            <div>PRODUCE</div>

            <span>→</span>

            <div>SELL</div>

            <span>→</span>

            <div>DELIVER</div>

          </div>

        </div>
      </section>

    </main>
  );
}

export default Businesses;