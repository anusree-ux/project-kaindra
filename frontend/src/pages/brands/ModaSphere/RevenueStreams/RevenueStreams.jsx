import {
  Coins,
  ShoppingBag,
  CreditCard,
  Megaphone,
  Truck,
  GraduationCap,
  BarChart3,
  Handshake,
} from "lucide-react";

import "./RevenueStreams.css";

const streams = [
  {
    title: "Marketplace Commissions",
    icon: ShoppingBag,
  },
  {
    title: "Subscription Plans",
    icon: CreditCard,
  },
  {
    title: "Premium Listings & Promotions",
    icon: Megaphone,
  },
  {
    title: "Transaction & Payment Fees",
    icon: Coins,
  },
  {
    title: "Logistics & Fulfillment Fees",
    icon: Truck,
  },
  {
    title: "Courses & Learning Programs",
    icon: GraduationCap,
  },
  {
    title: "Data & Analytics Services",
    icon: BarChart3,
  },
  {
    title: "Advertising & Brand Collaborations",
    icon: Handshake,
  },
];

export default function RevenueStreams() {
  return (
    <section
      className="revenue-section"
      id="revenue"
    >
      <div className="revenue-container">

        <div className="revenue-heading">
          <div className="revenue-label">
            REVENUE STREAMS
          </div>

          <h2>
            Multiple ways
            <br />
            to create value.
          </h2>

          <p>
            A diversified business model designed to generate
            sustainable revenue across the ModaSphere ecosystem.
          </p>
        </div>

        <div className="revenue-icon">
          <Coins size={30} strokeWidth={1.5} />
        </div>

        <div className="revenue-grid">
          {streams.map((stream) => {
            const Icon = stream.icon;

            return (
              <article
                className="revenue-card"
                key={stream.title}
              >
                <div className="revenue-card-icon">
                  <Icon
                    size={24}
                    strokeWidth={1.5}
                  />
                </div>

                <h3>{stream.title}</h3>
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
}