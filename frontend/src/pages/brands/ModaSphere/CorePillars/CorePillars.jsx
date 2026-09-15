import {
  ShoppingBag,
  Users,
  Cpu,
  GraduationCap,
  Leaf,
} from "lucide-react";

import "./CorePillars.css";

const pillars = [
  {
    title: "Fashion Commerce",
    text: "Unified marketplace for B2B, B2C, D2C, pre-order, drops and global trade.",
    icon: ShoppingBag,
  },
  {
    title: "Creator Economy",
    text: "Empowering designers, influencers and content creators to build, earn and grow.",
    icon: Users,
  },
  {
    title: "Technology & Innovation",
    text: "AI-driven design, virtual fitting, trend forecasting, supply-chain transparency and automation.",
    icon: Cpu,
  },
  {
    title: "Learning & Empowerment",
    text: "Fashion education, skills, courses and mentorship for the next generation.",
    icon: GraduationCap,
  },
  {
    title: "Sustainability & Impact",
    text: "Promoting ethical fashion, sustainable production and positive social impact.",
    icon: Leaf,
  },
];

export default function CorePillars() {
  return (
    <section className="core-pillars" id="pillars">

      <div className="core-pillars-container">

        <div className="core-pillars-heading">

          <div className="section-label">
            CORE PILLARS
          </div>

          <h2>
            The foundation
            <br />
            of ModaSphere.
          </h2>

          <p>
            Five powerful pillars connecting fashion, creators,
            technology, learning, and sustainable impact.
          </p>

        </div>

        <div className="pillars-grid">

          {pillars.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <article
                className="pillar-card"
                key={pillar.title}
              >

                <div className="pillar-icon">
                  <Icon
                    size={28}
                    strokeWidth={1.5}
                  />
                </div>

                <div className="pillar-content">

                  <h3>{pillar.title}</h3>

                  <p>{pillar.text}</p>

                </div>

              </article>
            );
          })}

        </div>

      </div>

    </section>
  );
}