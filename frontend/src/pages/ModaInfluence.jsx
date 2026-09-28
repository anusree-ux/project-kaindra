import { useState } from "react";
import {
  Users,
  Megaphone,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import "./ModaInfluence.css";

const creators = [
  {
    name: "Fashion Creators",
    description:
      "Discover creators across fashion, lifestyle and culture.",
    count: "2,500+",
  },
  {
    name: "Brand Partners",
    description:
      "Connect brands with relevant creator communities.",
    count: "850+",
  },
  {
    name: "Affiliate Network",
    description:
      "Build measurable affiliate and referral campaigns.",
    count: "4,000+",
  },
];

function ModaInfluence() {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);

  const campaign = {
    id: `MI-${Date.now()}`,
    brand: formData.get("brand"),
    email: formData.get("email"),
    campaignType: formData.get("campaignType"),
    message: formData.get("message"),
    submittedAt: new Date().toLocaleString(),
    status: "New",
  };

  const existingCampaigns = JSON.parse(
    localStorage.getItem("modaInfluenceCampaigns") || "[]"
  );

  const updatedCampaigns = [
    ...existingCampaigns,
    campaign,
  ];

  localStorage.setItem(
    "modaInfluenceCampaigns",
    JSON.stringify(updatedCampaigns)
  );

  window.dispatchEvent(
    new Event("modaInfluenceCampaignsUpdated")
  );

  setSubmitted(true);
};

  return (
    <div className="modainfluence-page">

      {/* Hero */}
      <section className="modainfluence-hero">
        <div className="modainfluence-container">
          <span className="modainfluence-eyebrow">
            CREATOR ECONOMY
          </span>

          <h1>
            Influence that
            <br />
            <span>moves fashion.</span>
          </h1>

          <p>
            ModaInfluence connects fashion brands, creators and
            influencers through meaningful campaigns, partnerships
            and affiliate opportunities.
          </p>

          <button
            className="modainfluence-primary-btn"
            onClick={() => setShowForm(true)}
          >
            Start a Campaign
            <ArrowRight size={17} />
          </button>
        </div>
      </section>

      {/* Ecosystem */}
      <section className="modainfluence-section">
        <div className="modainfluence-container">

          <div className="modainfluence-heading">
            <span>THE NETWORK</span>
            <h2>One platform. Multiple possibilities.</h2>
            <p>
              Build relationships between brands, creators and
              audiences across the fashion ecosystem.
            </p>
          </div>

          <div className="modainfluence-grid">
            {creators.map((item, index) => {
              const icons = [Users, Megaphone, TrendingUp];
              const Icon = icons[index];

              return (
                <div
                  className="modainfluence-card"
                  key={item.name}
                >
                  <div className="modainfluence-card-icon">
                    <Icon size={22} />
                  </div>

                  <strong>{item.count}</strong>

                  <h3>{item.name}</h3>

                  <p>{item.description}</p>

                  <span className="modainfluence-card-line" />
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* How it works */}
      <section className="modainfluence-process">
        <div className="modainfluence-container">

          <div className="modainfluence-heading">
            <span>HOW IT WORKS</span>
            <h2>From idea to influence.</h2>
          </div>

          <div className="modainfluence-steps">

            <div>
              <span>01</span>
              <h3>Create</h3>
              <p>
                Define your campaign, audience and objectives.
              </p>
            </div>

            <div>
              <span>02</span>
              <h3>Connect</h3>
              <p>
                Discover creators and partners that fit your brand.
              </p>
            </div>

            <div>
              <span>03</span>
              <h3>Launch</h3>
              <p>
                Collaborate, publish and reach your target audience.
              </p>
            </div>

            <div>
              <span>04</span>
              <h3>Measure</h3>
              <p>
                Track campaign performance and conversions.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="modainfluence-cta">
        <div className="modainfluence-container">
          <span>MODAINFLUENCE</span>

          <h2>
            Turn creativity
            <br />
            into impact.
          </h2>

          <button
            className="modainfluence-primary-btn"
            onClick={() => setShowForm(true)}
          >
            Work With Us
            <ArrowRight size={17} />
          </button>
        </div>
      </section>

      {/* Campaign Form */}
      {showForm && (
        <div
          className="modainfluence-modal"
          onClick={() => setShowForm(false)}
        >
          <div
            className="modainfluence-form"
            onClick={(e) => e.stopPropagation()}
          >
            {!submitted ? (
              <>
                <button
                  className="modainfluence-close"
                  onClick={() => setShowForm(false)}
                >
                  ×
                </button>

                <span>START A CAMPAIGN</span>
                <h2>Tell us about your campaign</h2>

                <form onSubmit={handleSubmit}>
                  <input
  type="text"
  name="brand"
  placeholder="Brand / Company"
  required
/>

<input
  type="email"
  name="email"
  placeholder="Email address"
  required
/>

<input
  type="text"
  name="campaignType"
  placeholder="Campaign type"
  required
/>

<textarea
  name="message"
  placeholder="Tell us about your campaign"
  rows="4"
  required
/>
                  <button type="submit">
                    Submit Campaign
                    <ArrowRight size={16} />
                  </button>
                </form>
              </>
            ) : (
              <div className="modainfluence-success">
                <CheckCircle2 size={42} />

                <h2>Campaign request received</h2>

                <p>
                  Thank you. Our team will review your campaign
                  and get back to you.
                </p>

                <button
                  onClick={() => {
                    setSubmitted(false);
                    setShowForm(false);
                  }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ModaInfluence;