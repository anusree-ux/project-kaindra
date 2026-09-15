import {
  Users,
  BarChart3,
  UserRound,
  ShoppingBag,
  Globe,
  Heart,
  Star,
  Leaf,
} from "lucide-react";

import "./SuccessMetrics.css";

const metrics = [
  ["Platform Users", "MAU & Growth", Users],
  ["GMV & Revenue", "Growth", BarChart3],
  ["Active Designers", "& Brands", UserRound],
  ["Orders & Transactions", "Volume", ShoppingBag],
  ["Global Reach", "Countries & Markets", Globe],
  ["Community Engagement", "& Creator Growth", Heart],
  ["Customer Satisfaction", "& Retention", Star],
  ["Sustainability Impact", "& Initiatives", Leaf],
];

export default function SuccessMetrics() {
  return (
    <section className="success-section" id="success-metrics">
      <div className="success-container">
        <div className="success-heading">
          <div className="success-label">SUCCESS METRICS</div>

          <h2>
            Measuring meaningful
            <br />
            growth and impact.
          </h2>

          <p>
            Key indicators that help measure the growth of the
            platform, strength of the community, customer success,
            and long-term sustainability impact.
          </p>
        </div>

        <div className="metrics-grid">
          {metrics.map(([title, subtitle, Icon]) => (
            <article className="metric-card" key={title}>
              <div className="metric-icon">
                <Icon size={24} strokeWidth={1.5} />
              </div>

              <div className="metric-content">
                <h3>{title}</h3>
                <p>{subtitle}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}