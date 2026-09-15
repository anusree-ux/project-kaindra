import { Users, CheckCircle } from "lucide-react";
import "./Stakeholders.css";

const stakeholders = [
  "Designers & Creators",
  "Brands & Retailers",
  "Manufacturers & Suppliers",
  "Influencers & Content Creators",
  "Consumers & Fashion Enthusiasts",
  "Investors & Business Partners",
];

export default function Stakeholders() {
  return (
    <section
      className="stakeholders-section"
      id="stakeholders"
    >
      <div className="stakeholders-container">

        {/* HEADING */}
        <div className="stakeholders-heading">

          <div className="stakeholders-label">
            TARGET STAKEHOLDERS
          </div>

          <h2>
            Built for everyone
            <br />
            in the fashion ecosystem.
          </h2>

          <p>
            ModaSphere brings together the people and businesses
            that shape, create, distribute, and experience fashion.
          </p>

        </div>


        {/* ICON */}
        <div className="stakeholders-icon">
          <Users size={30} strokeWidth={1.5} />
        </div>


        {/* STAKEHOLDER GRID */}
        <div className="stakeholders-grid">

          {stakeholders.map((item) => (
            <div
              className="stakeholder-card"
              key={item}
            >
              <div className="stakeholder-check">
                <CheckCircle
                  size={18}
                  strokeWidth={1.6}
                />
              </div>

              <span>{item}</span>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}