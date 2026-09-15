import { useEffect, useMemo, useState } from "react";
import "./CommunityGuide.css";

const defaultGuides = [
  {
    id: 1,
    ride: "Araku Valley Escape",
    route: "Visakhapatnam → Araku Valley",
    author: "Verified Rider",
    difficulty: "MODERATE",
    roadCondition: "GOOD",
    warning: "Watch for sharp mountain bends after sunset.",
    fuel: "Fuel available before entering the ghat section.",
    food: "Several local food stops near Araku.",
    stay: "Multiple budget stays available near destination.",
    scenic: "Excellent valley viewpoints.",
    tip: "Start early to avoid traffic and enjoy cooler roads.",
    privacy: "COMMUNITY",
    published: true,
    date: "2026-08-29",
  },
];

const emptyGuide = {
  ride: "",
  route: "",
  difficulty: "MODERATE",
  roadCondition: "GOOD",
  warning: "",
  fuel: "",
  food: "",
  stay: "",
  scenic: "",
  tip: "",
  privacy: "COMMUNITY",
};

function CommunityGuide() {
  const [guides, setGuides] = useState(() => {
    const saved = localStorage.getItem("mototribeCommunityGuides");

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultGuides;
      }
    }

    return defaultGuides;
  });

  const [form, setForm] = useState(emptyGuide);
  const [selectedGuide, setSelectedGuide] = useState(
    defaultGuides[0]
  );
  const [activeTab, setActiveTab] = useState("CREATE");
  const [published, setPublished] = useState(false);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    localStorage.setItem(
      "mototribeCommunityGuides",
      JSON.stringify(guides)
    );
  }, [guides]);

  const filteredGuides = useMemo(() => {
    if (filter === "ALL") {
      return guides;
    }

    return guides.filter(
      (guide) => guide.difficulty === filter
    );
  }, [guides, filter]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePublish = (event) => {
    event.preventDefault();

    if (!form.ride || !form.route) {
      alert("Please enter the ride name and route.");
      return;
    }

    const newGuide = {
      id: Date.now(),
      ...form,
      author: "Verified Rider",
      published: true,
      date: new Date().toISOString().split("T")[0],
    };

    setGuides((current) => [newGuide, ...current]);
    setSelectedGuide(newGuide);
    setPublished(true);
    setActiveTab("EXPLORE");

    setForm(emptyGuide);
  };

  const handleReset = () => {
    setForm(emptyGuide);
    setPublished(false);
  };

  return (
    <section
      className="community-guide-section"
      id="community-guide"
    >
      <div className="community-guide-container">

        {/* HEADER */}
        <div className="guide-heading">

          <div>
            <span className="guide-eyebrow">
              SHARE → GUIDE
            </span>

            <h2>
              Your experience
              <br />
              <strong>guides the next rider.</strong>
            </h2>

            <p>
              Turn completed rides into useful community
              intelligence. Share what you actually experienced,
              not just what the map predicts.
            </p>
          </div>

          <div className="trust-layer">
            <span className="trust-icon">✓</span>

            <div>
              <strong>RIDER COMPLETED</strong>
              <small>
                Experience-based information
              </small>
            </div>
          </div>

        </div>

        {/* TABS */}
        <div className="guide-tabs">

          <button
            className={activeTab === "CREATE" ? "active" : ""}
            onClick={() => setActiveTab("CREATE")}
          >
            CREATE GUIDE
          </button>

          <button
            className={activeTab === "EXPLORE" ? "active" : ""}
            onClick={() => setActiveTab("EXPLORE")}
          >
            COMMUNITY GUIDES
          </button>

        </div>

        {activeTab === "CREATE" && (
          <div className="guide-builder">

            {/* FORM */}
            <form
              className="guide-form"
              onSubmit={handlePublish}
            >

              <div className="form-section-title">
                <span>01</span>
                RIDE INFORMATION
              </div>

              <div className="input-grid">

                <label>
                  RIDE NAME
                  <input
                    name="ride"
                    value={form.ride}
                    onChange={handleChange}
                    placeholder="Example: Araku Valley Escape"
                  />
                </label>

                <label>
                  ROUTE
                  <input
                    name="route"
                    value={form.route}
                    onChange={handleChange}
                    placeholder="Example: Vizag → Araku"
                  />
                </label>

              </div>

              <div className="input-grid">

                <label>
                  DIFFICULTY

                  <select
                    name="difficulty"
                    value={form.difficulty}
                    onChange={handleChange}
                  >
                    <option>EASY</option>
                    <option>MODERATE</option>
                    <option>HARD</option>
                    <option>EXTREME</option>
                  </select>
                </label>

                <label>
                  ROAD CONDITION

                  <select
                    name="roadCondition"
                    value={form.roadCondition}
                    onChange={handleChange}
                  >
                    <option>GOOD</option>
                    <option>MODERATE</option>
                    <option>ROUGH</option>
                    <option>POOR</option>
                  </select>
                </label>

              </div>

              <div className="form-section-title">
                <span>02</span>
                ROUTE INTELLIGENCE
              </div>

              <label>
                ⚠ WARNINGS
                <textarea
                  name="warning"
                  value={form.warning}
                  onChange={handleChange}
                  placeholder="Mention dangerous turns, traffic, construction, weather risks..."
                />
              </label>

              <label>
                ⛽ FUEL INFORMATION
                <textarea
                  name="fuel"
                  value={form.fuel}
                  onChange={handleChange}
                  placeholder="Where can riders refuel?"
                />
              </label>

              <label>
                🍴 FOOD STOPS
                <textarea
                  name="food"
                  value={form.food}
                  onChange={handleChange}
                  placeholder="Useful food or refreshment stops..."
                />
              </label>

              <label>
                🛏 ACCOMMODATION
                <textarea
                  name="stay"
                  value={form.stay}
                  onChange={handleChange}
                  placeholder="Recommended stays or rest locations..."
                />
              </label>

              <label>
                ⛰ SCENIC LOCATIONS
                <textarea
                  name="scenic"
                  value={form.scenic}
                  onChange={handleChange}
                  placeholder="Viewpoints, photography locations, interesting places..."
                />
              </label>

              <div className="form-section-title">
                <span>03</span>
                RIDER EXPERIENCE
              </div>

              <label>
                RIDING TIP
                <textarea
                  name="tip"
                  value={form.tip}
                  onChange={handleChange}
                  placeholder="What would you tell the next rider?"
                />
              </label>

              <div className="privacy-box">

                <div>
                  <span>VISIBILITY</span>
                  <p>
                    Choose who can use your guide.
                  </p>
                </div>

                <select
                  name="privacy"
                  value={form.privacy}
                  onChange={handleChange}
                >
                  <option>PRIVATE</option>
                  <option>CONNECTIONS</option>
                  <option>RIDE GROUP</option>
                  <option>COMMUNITY</option>
                </select>

              </div>

              <div className="form-actions">

                <button
                  type="button"
                  className="reset-button"
                  onClick={handleReset}
                >
                  RESET
                </button>

                <button
                  type="submit"
                  className="publish-button"
                >
                  PUBLISH GUIDE →
                </button>

              </div>

            </form>

            {/* PREVIEW */}
            <aside className="guide-preview">

              <div className="preview-header">
                <span>LIVE PREVIEW</span>
                <small>
                  COMMUNITY INTELLIGENCE
                </small>
              </div>

              <div className="preview-card">

                <div className="preview-trust">
                  <span>✓</span>
                  RIDER COMPLETED
                </div>

                <h3>
                  {form.ride || "Your Ride"}
                </h3>

                <p className="preview-route">
                  {form.route ||
                    "Your route will appear here"}
                </p>

                <div className="preview-tags">

                  <span>{form.difficulty}</span>
                  <span>{form.roadCondition}</span>
                  <span>{form.privacy}</span>

                </div>

                <div className="preview-divider"></div>

                <div className="preview-item">
                  <span>⚠ WARNING</span>
                  <p>
                    {form.warning ||
                      "No warning added yet."}
                  </p>
                </div>

                <div className="preview-item">
                  <span>⛽ FUEL</span>
                  <p>
                    {form.fuel ||
                      "Fuel information will appear here."}
                  </p>
                </div>

                <div className="preview-item">
                  <span>🍴 FOOD</span>
                  <p>
                    {form.food ||
                      "Food stops will appear here."}
                  </p>
                </div>

                <div className="preview-item">
                  <span>⛰ SCENIC</span>
                  <p>
                    {form.scenic ||
                      "Scenic information will appear here."}
                  </p>
                </div>

                <div className="preview-item">
                  <span>RIDER TIP</span>
                  <p>
                    {form.tip ||
                      "Your personal riding advice will appear here."}
                  </p>
                </div>

              </div>

              <div className="knowledge-note">
                <span>KNOWLEDGE LAYER</span>

                <p>
                  Your contribution can help another rider
                  plan a safer and better journey.
                </p>
              </div>

            </aside>

          </div>
        )}

        {activeTab === "EXPLORE" && (
          <div className="guide-explore">

            <div className="explore-toolbar">

              <div>
                <span>COMMUNITY KNOWLEDGE</span>
                <h3>
                  Guides from riders who completed the ride.
                </h3>
              </div>

              <div className="explore-filters">

                {[
                  "ALL",
                  "EASY",
                  "MODERATE",
                  "HARD",
                  "EXTREME",
                ].map((item) => (
                  <button
                    key={item}
                    className={
                      filter === item ? "active" : ""
                    }
                    onClick={() => setFilter(item)}
                  >
                    {item}
                  </button>
                ))}

              </div>

            </div>

            <div className="guide-list">

              {filteredGuides.map((guide) => (
                <article
                  className={`guide-card ${
                    selectedGuide?.id === guide.id
                      ? "selected"
                      : ""
                  }`}
                  key={guide.id}
                  onClick={() => setSelectedGuide(guide)}
                >

                  <div className="guide-card-top">

                    <span className="completed-label">
                      ✓ RIDER COMPLETED
                    </span>

                    <span className="guide-date">
                      {guide.date}
                    </span>

                  </div>

                  <h3>{guide.ride}</h3>

                  <p className="guide-card-route">
                    {guide.route}
                  </p>

                  <div className="guide-card-tags">
                    <span>{guide.difficulty}</span>
                    <span>{guide.roadCondition}</span>
                  </div>

                  <div className="guide-card-content">

                    <div>
                      <span>WARNING</span>
                      <p>
                        {guide.warning ||
                          "No warning reported."}
                      </p>
                    </div>

                    <div>
                      <span>FUEL</span>
                      <p>
                        {guide.fuel ||
                          "No fuel information."}
                      </p>
                    </div>

                    <div>
                      <span>RIDER TIP</span>
                      <p>
                        {guide.tip ||
                          "No riding tip added."}
                      </p>
                    </div>

                  </div>

                  <button className="view-guide">
                    VIEW GUIDE →
                  </button>

                </article>
              ))}

            </div>

            {filteredGuides.length === 0 && (
              <div className="no-guides">
                No guides available for this difficulty.
              </div>
            )}

          </div>
        )}

        {published && (
          <div className="publish-success">
            ✓ YOUR EXPERIENCE HAS BEEN ADDED TO
            MOTOTRIBE COMMUNITY KNOWLEDGE
          </div>
        )}

      </div>
    </section>
  );
}

export default CommunityGuide;