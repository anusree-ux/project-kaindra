import {
  ShoppingBag,
  Tag,
  Scissors,
  Factory,
  Truck,
  CreditCard,
  Star,
  PlaySquare,
  BookOpen,
  BarChart3,
} from "lucide-react";

import "./SubEcosystems.css";

const businesses = [
  [
    "MODAMART",
    "Global Fashion Marketplace",
    "B2B, B2C, D2C marketplace for fashion.",
    ShoppingBag,
  ],
  [
    "MODADROP",
    "Drops & Pre-order Platform",
    "Exclusive drops and limited editions.",
    Tag,
  ],
  [
    "MODASTUDIO",
    "Design & Creation Hub",
    "Tools for designers and creators.",
    Scissors,
  ],
  [
    "MODAMANUFACTURE",
    "Manufacturing Network",
    "Verified manufacturers and suppliers.",
    Factory,
  ],
  [
    "MODALOGIX",
    "Logistics & Fulfillment",
    "Smart logistics, tracking and returns.",
    Truck,
  ],
  [
    "MODAPAY",
    "Payments & Fintech",
    "Secure payments and financial services.",
    CreditCard,
  ],
  [
    "MODAINFLUENCE",
    "Influencer & Affiliate Hub",
    "Creator collaborations and campaigns.",
    Star,
  ],
  [
    "MODATALES",
    "Content & Media Network",
    "Fashion videos, blogs and shows.",
    PlaySquare,
  ],
  [
    "MODAACademy",
    "Learning & Education",
    "Courses, certifications and mentorship.",
    BookOpen,
  ],
  [
    "MODAINSIGHTS",
    "Data & AI Insights",
    "Market analytics and AI recommendations.",
    BarChart3,
  ],
];

export default function SubEcosystems() {
  return (
    <section
      className="subecosystems-section"
      id="verticals"
    >
      <div className="subecosystems-container">

        {/* HEADING */}
        <div className="subecosystems-heading">
          <div className="subecosystems-label">
            MODASPHERE SUB-ECOSYSTEMS
          </div>

          <h2>
            One platform.
            <br />
            Ten business verticals.
          </h2>

          <p>
            A connected portfolio of fashion-focused businesses
            covering commerce, creation, manufacturing, logistics,
            finance, media, learning, and data.
          </p>
        </div>


        {/* BUSINESS GRID */}
        <div className="business-grid">
          {businesses.map(
            ([name, title, text, Icon]) => (
              <article
                className="business-card"
                key={name}
              >
                <div className="business-icon">
                  <Icon
                    size={25}
                    strokeWidth={1.5}
                  />
                </div>

                <span className="business-name">
                  {name}
                </span>

                <h3>
                  {title}
                </h3>

                <p>
                  {text}
                </p>
              </article>
            )
          )}
        </div>

      </div>
    </section>
  );
}