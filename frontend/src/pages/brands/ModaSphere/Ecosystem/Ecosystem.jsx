import { useState } from "react";
import {
  Palette,
  Factory,
  ShoppingBag,
  Users,
  UserRound,
  Handshake,
  ArrowRight,
  X,
} from "lucide-react";
import "./Ecosystem.css";

const ecosystemData = [
  {
    id: "designers",
    title: "Designers & Creators",
    shortTitle: "Designers",
    icon: Palette,
    tagline: "Turn ideas into fashion experiences.",
    description:
      "ModaSphere gives designers and creators a connected environment to develop, showcase, collaborate and bring fashion concepts to life.",
    role:
      "Designers form the creative foundation of the ModaSphere ecosystem. They introduce new concepts, collections, cultural expressions and innovative fashion experiences.",
    activities: [
      "Create and develop fashion collections",
      "Collaborate with brands and manufacturers",
      "Showcase creative work to global audiences",
      "Explore sustainable and technology-driven fashion",
    ],
    connects: [
      "Manufacturers",
      "Retailers & Brands",
      "Influencers",
      "Consumers",
    ],
  },

  {
    id: "manufacturers",
    title: "Manufacturers & Suppliers",
    shortTitle: "Manufacturers",
    icon: Factory,
    tagline: "Transform concepts into products.",
    description:
      "Manufacturers and suppliers connect creative ideas with production capabilities, materials, technology and scalable fashion manufacturing.",
    role:
      "They provide the production infrastructure that enables designers and brands to transform concepts into high-quality fashion products.",
    activities: [
      "Source fabrics and materials",
      "Support fashion production",
      "Enable sustainable manufacturing",
      "Connect with designers and brands",
    ],
    connects: [
      "Designers",
      "Retailers & Brands",
      "Investors",
      "Technology Partners",
    ],
  },

  {
    id: "retailers",
    title: "Retailers & Brands",
    shortTitle: "Retailers",
    icon: ShoppingBag,
    tagline: "Bring fashion closer to consumers.",
    description:
      "Retailers and brands connect products with customers through physical, digital and omnichannel fashion experiences.",
    role:
      "Retailers and brands create the commercial bridge between fashion creators and consumers by bringing products, collections and experiences to market.",
    activities: [
      "Discover emerging fashion brands",
      "Launch and distribute collections",
      "Build customer experiences",
      "Connect products with new audiences",
    ],
    connects: [
      "Designers",
      "Manufacturers",
      "Influencers",
      "Consumers",
    ],
  },

  {
    id: "influencers",
    title: "Influencers & Affiliates",
    shortTitle: "Influencers",
    icon: UserRound,
    tagline: "Shape conversations around fashion.",
    description:
      "Influencers and affiliates help fashion brands and creators reach communities through authentic content, storytelling and digital influence.",
    role:
      "They amplify fashion stories and connect brands with communities through content, discovery and meaningful digital engagement.",
    activities: [
      "Create fashion-focused content",
      "Promote new collections",
      "Build community engagement",
      "Support brand discovery",
    ],
    connects: [
      "Brands",
      "Designers",
      "Consumers",
      "Communities",
    ],
  },

  {
    id: "consumers",
    title: "Consumers & Community",
    shortTitle: "Consumers",
    icon: Users,
    tagline: "Experience and influence the future of fashion.",
    description:
      "Consumers are at the center of ModaSphere. Their preferences, creativity and participation help shape the evolution of the fashion ecosystem.",
    role:
      "Consumers are not simply buyers. They participate in discovery, community, feedback and the creation of future fashion trends.",
    activities: [
      "Discover fashion and emerging brands",
      "Engage with creators and communities",
      "Share preferences and feedback",
      "Participate in fashion experiences",
    ],
    connects: [
      "Designers",
      "Brands",
      "Influencers",
      "Communities",
    ],
  },

  {
    id: "investors",
    title: "Investors & Partners",
    shortTitle: "Investors",
    icon: Handshake,
    tagline: "Fuel innovation and ecosystem growth.",
    description:
      "Investors and strategic partners provide the resources, expertise and connections required to accelerate innovation across the fashion ecosystem.",
    role:
      "They support businesses, technologies and initiatives that contribute to the growth and transformation of ModaSphere.",
    activities: [
      "Support emerging fashion businesses",
      "Enable technology innovation",
      "Build strategic partnerships",
      "Accelerate ecosystem expansion",
    ],
    connects: [
      "Designers",
      "Brands",
      "Manufacturers",
      "Technology Partners",
    ],
  },
];

function Ecosystem() {
  const [selected, setSelected] = useState(null);

  const selectedData = ecosystemData.find(
    (item) => item.id === selected
  );

  const handleExplore = () => {
    document
      .getElementById("ecosystem-details")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <section className="ecosystem-section">

      {/* HERO */}
      <div className="ecosystem-hero">

        <span className="ecosystem-label">
          THE MODASPHERE ECOSYSTEM
        </span>

        <h1>
          One ecosystem.
          <br />
          Every connection.
        </h1>

        <p>
          ModaSphere connects every major participant in the
          fashion value chain through one technology-powered
          ecosystem.
        </p>

        <button
          className="ecosystem-explore-button"
          onClick={handleExplore}
        >
          Explore Ecosystem
          <ArrowRight size={18} />
        </button>
      </div>

      {/* ECOSYSTEM DIAGRAM */}
      <div className="ecosystem-diagram-wrapper">

        <div className="ecosystem-diagram">

          <div className="ecosystem-ring ring-one"></div>
          <div className="ecosystem-ring ring-two"></div>
          <div className="ecosystem-ring ring-three"></div>

          <div className="ecosystem-center">
            <span className="ecosystem-center-letter">M</span>
            <span>MODASPHERE</span>
          </div>

          {ecosystemData.map((item, index) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={`ecosystem-node node-${index}`}
                onClick={() => setSelected(item.id)}
              >
                <span className="ecosystem-node-icon">
                  <Icon size={22} strokeWidth={1.7} />
                </span>

                <span className="ecosystem-node-text">
                  <strong>{item.shortTitle}</strong>
                  <small>
                    {item.id === "designers" &&
                      "& Creators"}

                    {item.id === "manufacturers" &&
                      "& Suppliers"}

                    {item.id === "retailers" &&
                      "& Brands"}

                    {item.id === "influencers" &&
                      "& Affiliates"}

                    {item.id === "consumers" &&
                      "& Community"}

                    {item.id === "investors" &&
                      "& Partners"}
                  </small>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DETAILS */}
      <div
        id="ecosystem-details"
        className="ecosystem-details-section"
      >
        <div className="ecosystem-details-header">
          <span className="ecosystem-label">
            ECOSYSTEM PARTICIPANTS
          </span>

          <h2>
            Explore how every participant
            <br />
            connects with ModaSphere.
          </h2>

          <p>
            Select any participant to understand their role,
            activities and connections within the ModaSphere
            ecosystem.
          </p>
        </div>

        {/* PARTICIPANT SELECTOR */}
        <div className="ecosystem-selector">
          {ecosystemData.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={`ecosystem-selector-card ${
                  selected === item.id ? "active" : ""
                }`}
                onClick={() => setSelected(item.id)}
              >
                <span className="selector-icon">
                  <Icon size={21} />
                </span>

                <span>
                  <strong>{item.title}</strong>
                  <small>{item.tagline}</small>
                </span>
              </button>
            );
          })}
        </div>

        {/* SELECTED CONTENT */}
        {selectedData && (
          <div className="ecosystem-detail-card">

            <button
              className="ecosystem-detail-close"
              onClick={() => setSelected(null)}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="ecosystem-detail-top">

              <div className="ecosystem-detail-icon">
                {(() => {
                  const Icon = selectedData.icon;
                  return <Icon size={32} />;
                })()}
              </div>

              <div>
                <span className="ecosystem-detail-label">
                  MODASPHERE PARTICIPANT
                </span>

                <h3>{selectedData.title}</h3>

                <p className="ecosystem-detail-tagline">
                  {selectedData.tagline}
                </p>
              </div>

            </div>

            <div className="ecosystem-detail-grid">

              <div className="detail-column">
                <span className="detail-heading">
                  OVERVIEW
                </span>

                <p>{selectedData.description}</p>
              </div>

              <div className="detail-column">
                <span className="detail-heading">
                  ROLE IN MODASPHERE
                </span>

                <p>{selectedData.role}</p>
              </div>

              <div className="detail-column">
                <span className="detail-heading">
                  KEY ACTIVITIES
                </span>

                <ul>
                  {selectedData.activities.map((activity) => (
                    <li key={activity}>{activity}</li>
                  ))}
                </ul>
              </div>

              <div className="detail-column">
                <span className="detail-heading">
                  CONNECTS WITH
                </span>

                <div className="connection-list">
                  {selectedData.connects.map((connection) => (
                    <span key={connection}>
                      {connection}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </section>
  );
}

export default Ecosystem;