import { useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  ShoppingBag,
  Globe2,
  Sparkles,
  ArrowUpRight,
  ArrowRight,
  Filter,
  X,
  Search,
  Target,
  Activity,
} from "lucide-react";

import "./ModaInsights.css";

const insightData = {
  All: {
    marketGrowth: "+18.6%",
    customerGrowth: "+24.2%",
    salesGrowth: "+21.4%",
    engagement: "+32.8%",
  },
  Luxury: {
    marketGrowth: "+16.8%",
    customerGrowth: "+19.4%",
    salesGrowth: "+17.9%",
    engagement: "+27.5%",
  },
  Sustainable: {
    marketGrowth: "+23.7%",
    customerGrowth: "+31.6%",
    salesGrowth: "+28.3%",
    engagement: "+41.2%",
  },
  Streetwear: {
    marketGrowth: "+21.4%",
    customerGrowth: "+26.8%",
    salesGrowth: "+24.7%",
    engagement: "+35.6%",
  },
  Technology: {
    marketGrowth: "+29.5%",
    customerGrowth: "+34.1%",
    salesGrowth: "+31.8%",
    engagement: "+46.3%",
  },
};

const trendData = [
  {
    title: "Sustainable Materials",
    category: "SUSTAINABILITY",
    growth: "+34%",
    description:
      "Growing interest in recycled, low-impact and circular fashion materials.",
  },
  {
    title: "AI-Assisted Design",
    category: "TECHNOLOGY",
    growth: "+41%",
    description:
      "Design teams are increasingly exploring AI for concept development and creative workflows.",
  },
  {
    title: "Direct-to-Consumer",
    category: "COMMERCE",
    growth: "+27%",
    description:
      "Independent fashion brands continue building direct relationships with customers.",
  },
  {
    title: "Cultural Fashion",
    category: "CULTURE",
    growth: "+29%",
    description:
      "Consumers are showing stronger interest in fashion connected to cultural identity and heritage.",
  },
];

const customerSegments = [
  {
    name: "Gen Z Creators",
    percentage: 82,
    description: "Digital-first consumers and emerging creators.",
  },
  {
    name: "Conscious Buyers",
    percentage: 68,
    description: "Customers prioritizing sustainable and ethical products.",
  },
  {
    name: "Fashion Explorers",
    percentage: 74,
    description: "Consumers actively discovering new brands and trends.",
  },
  {
    name: "Luxury Consumers",
    percentage: 56,
    description: "Customers interested in premium and designer fashion.",
  },
];

function ModaInsights() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const currentData = insightData[selectedCategory];

  const filteredTrends = useMemo(() => {
    if (!searchTerm.trim()) return trendData;

    return trendData.filter(
      (trend) =>
        trend.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        trend.category
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleInsightRequest = (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const request = {
      id: `MI-${Date.now()}`,
      name: formData.get("name"),
      email: formData.get("email"),
      business: formData.get("business"),
      topic: formData.get("topic"),
      message: formData.get("message"),
      submittedAt: new Date().toLocaleString(),
      status: "New",
    };

    try {
      const existingRequests = JSON.parse(
        localStorage.getItem("modaInsightsRequests") || "[]"
      );

      const updatedRequests = [
        ...(Array.isArray(existingRequests)
          ? existingRequests
          : []),
        request,
      ];

      localStorage.setItem(
        "modaInsightsRequests",
        JSON.stringify(updatedRequests)
      );

      window.dispatchEvent(
        new Event("modaInsightsRequestsUpdated")
      );

      alert(
        "Your ModaInsights request has been submitted successfully."
      );

      setShowRequestModal(false);
    } catch (error) {
      console.error(
        "Unable to save insight request:",
        error
      );
    }
  };

  return (
    <main className="modainsights-page">

      {/* HERO */}
      <section className="modainsights-hero">
        <div className="modainsights-container">
          <div className="modainsights-hero-content">

            <span className="modainsights-label">
              MODASPHERE DATA & AI
            </span>

            <h1>
              Understand fashion.
              <br />
              Predict what comes next.
            </h1>

            <p>
              ModaInsights transforms fashion data,
              customer behavior and market signals into
              practical intelligence for brands, creators
              and fashion businesses.
            </p>

            <div className="modainsights-hero-actions">
              <a
                href="#dashboard"
                className="modainsights-primary-button"
              >
                Explore Insights
                <ArrowRight size={18} />
              </a>

              <button
                type="button"
                className="modainsights-secondary-button"
                onClick={() => setShowRequestModal(true)}
              >
                Request Analysis
              </button>
            </div>

          </div>

          <div className="modainsights-hero-visual">

            <div className="insights-orbit insights-orbit-one">
              <span>DATA</span>
            </div>

            <div className="insights-orbit insights-orbit-two">
              <span>AI</span>
            </div>

            <div className="insights-orbit insights-orbit-three">
              <span>TRENDS</span>
            </div>

            <div className="insights-center">
              <BarChart3 size={46} />

              <span>MODA</span>
              <strong>INSIGHTS</strong>
            </div>

          </div>
        </div>
      </section>

      {/* DASHBOARD */}
      <section
        className="modainsights-dashboard"
        id="dashboard"
      >
        <div className="modainsights-container">

          <div className="modainsights-section-heading">
            <div>
              <span>LIVE ANALYTICS VIEW</span>

              <h2>
                Fashion intelligence
                <br />
                at a glance.
              </h2>
            </div>

            <p>
              Explore different fashion categories and
              compare their current growth indicators.
            </p>
          </div>

          {/* FILTER */}
          <div className="modainsights-toolbar">

            <div className="modainsights-filter">
              <Filter size={17} />

              <select
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(event.target.value)
                }
              >
                <option value="All">All Fashion</option>
                <option value="Luxury">Luxury</option>
                <option value="Sustainable">
                  Sustainable
                </option>
                <option value="Streetwear">
                  Streetwear
                </option>
                <option value="Technology">
                  Technology
                </option>
              </select>
            </div>

            <div className="modainsights-search">
              <Search size={17} />

              <input
                type="text"
                placeholder="Search trends..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
              />
            </div>

          </div>

          {/* METRICS */}
          <div className="modainsights-metrics">

            <article className="modainsights-metric-card">
              <div className="metric-icon">
                <TrendingUp size={21} />
              </div>

              <span>MARKET GROWTH</span>

              <strong>
                {currentData.marketGrowth}
              </strong>

              <small>
                Current category indicator
              </small>
            </article>

            <article className="modainsights-metric-card">
              <div className="metric-icon">
                <Users size={21} />
              </div>

              <span>CUSTOMER GROWTH</span>

              <strong>
                {currentData.customerGrowth}
              </strong>

              <small>
                Consumer activity indicator
              </small>
            </article>

            <article className="modainsights-metric-card">
              <div className="metric-icon">
                <ShoppingBag size={21} />
              </div>

              <span>SALES GROWTH</span>

              <strong>
                {currentData.salesGrowth}
              </strong>

              <small>
                Commerce activity indicator
              </small>
            </article>

            <article className="modainsights-metric-card">
              <div className="metric-icon">
                <Activity size={21} />
              </div>

              <span>ENGAGEMENT</span>

              <strong>
                {currentData.engagement}
              </strong>

              <small>
                Audience engagement indicator
              </small>
            </article>

          </div>

        </div>
      </section>

      {/* TRENDS */}
      <section className="modainsights-trends">
        <div className="modainsights-container">

          <div className="modainsights-section-heading centered">
            <span>FASHION TRENDS</span>

            <h2>
              Signals worth watching.
            </h2>

            <p>
              Track emerging movements across the fashion
              ecosystem.
            </p>
          </div>

          <div className="modainsights-trend-grid">

            {filteredTrends.length === 0 ? (
              <div className="modainsights-no-results">
                <Search size={34} />

                <h3>No trends found</h3>

                <p>
                  Try another search term.
                </p>
              </div>
            ) : (
              filteredTrends.map((trend) => (
                <article
                  className="modainsights-trend-card"
                  key={trend.title}
                >
                  <div className="trend-card-top">
                    <span>{trend.category}</span>

                    <ArrowUpRight size={20} />
                  </div>

                  <h3>{trend.title}</h3>

                  <p>{trend.description}</p>

                  <div className="trend-growth">
                    <strong>{trend.growth}</strong>

                    <span>Growth signal</span>
                  </div>
                </article>
              ))
            )}

          </div>

        </div>
      </section>

      {/* CUSTOMER INTELLIGENCE */}
      <section className="modainsights-customers">
        <div className="modainsights-container">

          <div className="modainsights-section-heading">
            <div>
              <span>CUSTOMER INTELLIGENCE</span>

              <h2>
                Understand the people
                <br />
                behind the numbers.
              </h2>
            </div>

            <p>
              Identify audience groups and understand the
              behaviors shaping modern fashion.
            </p>
          </div>

          <div className="modainsights-customer-grid">

            {customerSegments.map((segment) => (
              <article
                className="modainsights-customer-card"
                key={segment.name}
              >
                <div className="customer-card-header">
                  <div>
                    <span>AUDIENCE</span>
                    <h3>{segment.name}</h3>
                  </div>

                  <Target size={21} />
                </div>

                <p>{segment.description}</p>

                <div className="customer-progress-top">
                  <span>Interest Index</span>
                  <strong>{segment.percentage}%</strong>
                </div>

                <div className="customer-progress">
                  <span
                    style={{
                      width: `${segment.percentage}%`,
                    }}
                  />
                </div>
              </article>
            ))}

          </div>

        </div>
      </section>

      {/* AI */}
      <section className="modainsights-ai">
        <div className="modainsights-container">

          <div className="modainsights-ai-box">

            <div className="ai-icon">
              <Sparkles size={27} />
            </div>

            <span>AI-POWERED INTELLIGENCE</span>

            <h2>
              Turn fashion data
              <br />
              into useful decisions.
            </h2>

            <p>
              ModaInsights can combine market signals,
              customer behavior, product performance and
              trend data to help fashion businesses identify
              opportunities.
            </p>

            <button
              type="button"
              className="modainsights-ai-button"
              onClick={() => setShowRequestModal(true)}
            >
              Request Custom Analysis
              <ArrowRight size={17} />
            </button>

          </div>

        </div>
      </section>

      {/* GLOBAL */}
      <section className="modainsights-global">
        <div className="modainsights-container">

          <div className="global-content">
            <span>GLOBAL FASHION INTELLIGENCE</span>

            <h2>
              From local signals
              <br />
              to global opportunities.
            </h2>

            <p>
              Connect market intelligence, cultural
              movements and customer behavior across
              fashion markets.
            </p>
          </div>

          <div className="global-icon">
            <Globe2 size={75} strokeWidth={1} />
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="modainsights-cta">
        <div className="modainsights-container">

          <span>START WITH DATA</span>

          <h2>
            See what your fashion
            <br />
            data can reveal.
          </h2>

          <p>
            Request an analysis for your fashion business.
          </p>

          <button
            type="button"
            className="modainsights-cta-button"
            onClick={() => setShowRequestModal(true)}
          >
            Request Analysis
            <ArrowRight size={18} />
          </button>

        </div>
      </section>

      {/* REQUEST MODAL */}
      {showRequestModal && (
        <div
          className="modainsights-modal-overlay"
          onClick={() => setShowRequestModal(false)}
        >
          <div
            className="modainsights-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modainsights-modal-header">
              <div>
                <span>MODAINSIGHTS</span>

                <h2>Request Analysis</h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowRequestModal(false)
                }
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="modainsights-form"
              onSubmit={handleInsightRequest}
            >

              <div className="modainsights-form-row">

                <div className="modainsights-form-group">
                  <label>Name</label>

                  <input
                    name="name"
                    type="text"
                    placeholder="Your name"
                    required
                  />
                </div>

                <div className="modainsights-form-group">
                  <label>Email</label>

                  <input
                    name="email"
                    type="email"
                    placeholder="Your email"
                    required
                  />
                </div>

              </div>

              <div className="modainsights-form-group">
                <label>Business / Brand</label>

                <input
                  name="business"
                  type="text"
                  placeholder="Business or brand name"
                  required
                />
              </div>

              <div className="modainsights-form-group">
                <label>Analysis Topic</label>

                <select name="topic" required>
                  <option value="">
                    Select analysis topic
                  </option>

                  <option value="Market Trends">
                    Market Trends
                  </option>

                  <option value="Customer Intelligence">
                    Customer Intelligence
                  </option>

                  <option value="Product Performance">
                    Product Performance
                  </option>

                  <option value="Sustainability">
                    Sustainability
                  </option>

                  <option value="AI & Technology">
                    AI & Technology
                  </option>
                </select>
              </div>

              <div className="modainsights-form-group">
                <label>What do you want to understand?</label>

                <textarea
                  name="message"
                  rows="4"
                  placeholder="Describe your analysis requirement..."
                  required
                />
              </div>

              <button
                type="submit"
                className="modainsights-submit-button"
              >
                Submit Request
                <ArrowRight size={17} />
              </button>

            </form>

          </div>
        </div>
      )}

    </main>
  );
}

export default ModaInsights;