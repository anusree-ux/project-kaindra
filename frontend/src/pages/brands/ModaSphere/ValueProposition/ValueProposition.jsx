import { Diamond, Check } from "lucide-react";
import "./ValueProposition.css";

const values = [
  "One Platform. Unlimited Possibilities.",
  "End-to-End Fashion Ecosystem",
  "Global Reach, Local Relevance",
  "AI & Technology Driven",
  "Empowering Creators & Businesses",
  "Sustainable & Future-Ready",
  "Data-Driven Decisions & Growth",
];

export default function ValueProposition() {
  return (
    <section
      className="value-section"
      id="value-proposition"
    >
      <div className="value-container">

        {/* Heading */}
        <div className="value-heading">
          <div className="value-label">
            UNIQUE VALUE PROPOSITION
          </div>

          <h2>
            Why ModaSphere
            <br />
            is different.
          </h2>

          <p>
            A connected fashion ecosystem designed to create
            opportunities, simplify collaboration, and accelerate
            sustainable growth.
          </p>
        </div>

        {/* Main Content */}
        <div className="value-content">

          {/* Left */}
          <div className="value-intro">
            <div className="value-icon">
              <Diamond size={30} strokeWidth={1.5} />
            </div>

            <h3>
              Built for the
              <br />
              future of fashion.
            </h3>

            <p>
              ModaSphere brings creators, businesses, technology,
              consumers, and opportunities together through one
              integrated platform.
            </p>
          </div>

          {/* Right */}
          <div className="value-list">
            {values.map((value) => (
              <div
                className="value-item"
                key={value}
              >
                <div className="value-check">
                  <Check size={16} strokeWidth={2} />
                </div>

                <span>{value}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}