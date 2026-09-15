import {
  Users,
  Factory,
  ShoppingBag,
  Palette,
  HeartHandshake,
  UserRound,
} from "lucide-react";

import "./Ecosystem.css";

const ecosystemItems = [
  {
    title: "Designers",
    subtitle: "& Creators",
    icon: Palette,
  },
  {
    title: "Manufacturers",
    subtitle: "& Suppliers",
    icon: Factory,
  },
  {
    title: "Retailers",
    subtitle: "& Brands",
    icon: ShoppingBag,
  },
  {
    title: "Influencers",
    subtitle: "& Affiliates",
    icon: UserRound,
  },
  {
    title: "Consumers",
    subtitle: "& Community",
    icon: Users,
  },
  {
    title: "Investors",
    subtitle: "& Partners",
    icon: HeartHandshake,
  },
];

export default function Ecosystem() {
  return (
    <section className="ecosystem-section" id="ecosystem">
      <div className="ecosystem-container">

        {/* Heading */}
        <div className="ecosystem-heading">
          <div className="ecosystem-label">
            THE MODASPHERE ECOSYSTEM
          </div>

          <h2>
            One ecosystem.
            <br />
            Every connection.
          </h2>

          <p>
            ModaSphere connects every major participant in the
            fashion value chain through one technology-powered
            ecosystem.
          </p>
        </div>

        {/* Ecosystem Wheel */}
        <div className="ecosystem-wheel-wrapper">
          <div className="ecosystem-wheel">

            <div className="ecosystem-wheel-ring ring-one"></div>
            <div className="ecosystem-wheel-ring ring-two"></div>

            <div className="ecosystem-center">
              <span>M</span>
              <small>MODASPHERE</small>
            </div>

            {ecosystemItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  className={`ecosystem-node ecosystem-node-${index + 1}`}
                  key={item.title}
                >
                  <div className="ecosystem-icon">
                    <Icon size={22} strokeWidth={1.5} />
                  </div>

                  <div className="ecosystem-node-text">
                    <strong>{item.title}</strong>
                    <span>{item.subtitle}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Technology Engine */}
        <div className="ecosystem-engine">
          <span>TECHNOLOGY & DATA ENGINE</span>

          <p>
            AI • DATA • ANALYTICS • AUTOMATION • BLOCKCHAIN
          </p>
        </div>

      </div>
    </section>
  );
}