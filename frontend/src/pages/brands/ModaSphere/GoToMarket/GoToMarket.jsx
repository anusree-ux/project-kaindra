import {
  Rocket,
  Hammer,
  Users,
  Globe,
  Sparkles,
} from "lucide-react";

import "./GoToMarket.css";

const steps = [
  {
    title: "Build",
    text: "Launch the core platform and marketplace.",
    icon: Hammer,
  },
  {
    title: "Engage",
    text: "Onboard designers, brands, and creators.",
    icon: Users,
  },
  {
    title: "Expand",
    text: "Add services, tools, and global markets.",
    icon: Globe,
  },
  {
    title: "Elevate",
    text: "Drive innovation, partnerships, and community impact.",
    icon: Sparkles,
  },
];

export default function GoToMarket() {
  return (
    <section
      className="gtm-section"
      id="go-to-market"
    >
      <div className="gtm-container">

        <div className="gtm-heading">
          <div className="gtm-label">
            GO-TO-MARKET STRATEGY
          </div>

          <h2>
            From building
            <br />
            to global impact.
          </h2>

          <p>
            A phased strategy focused on building the platform,
            growing the ecosystem, expanding globally, and creating
            long-term impact.
          </p>
        </div>

        <div className="gtm-icon">
          <Rocket size={30} strokeWidth={1.5} />
        </div>

        <div className="gtm-grid">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                className="gtm-card"
                key={step.title}
              >
                <div className="gtm-card-icon">
                  <Icon
                    size={24}
                    strokeWidth={1.5}
                  />
                </div>

                <h3>{step.title}</h3>

                <p>{step.text}</p>
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
}