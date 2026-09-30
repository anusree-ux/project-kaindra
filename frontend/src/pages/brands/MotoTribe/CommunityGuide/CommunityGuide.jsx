import { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import "./CommunityGuide.css";

const guideCategories = [
  {
    id: "group-rides",
    number: "01",
    title: "GROUP RIDES",
    description:
      "Understand how to ride safely and confidently as part of a group.",
    items: [
      "Maintain a safe riding distance and staggered formation.",
      "Follow the lead rider and pay attention to route instructions.",
      "Do not overtake aggressively within the group formation.",
      "Signal hazards clearly to riders behind you using hand or lamp signals.",
    ],
  },
  {
    id: "ride-etiquette",
    number: "02",
    title: "RIDE ETIQUETTE",
    description:
      "Simple riding practices that keep the community respectful.",
    items: [
      "Respect fellow riders, pedestrians, and local communities.",
      "Avoid excessive engine revving in quiet residential zones.",
      "Keep shared pit-stops and scenic viewpoints clean.",
      "Support beginner riders instead of pressuring them to ride beyond limits.",
    ],
  },
  {
    id: "community-safety",
    number: "03",
    title: "COMMUNITY SAFETY",
    description:
      "Build safer riding groups through preparation and awareness.",
    items: [
      "Carry emergency contact and blood group information.",
      "Inspect tyres, brakes, and fluid levels before long journeys.",
      "Share your live location or planned route with trusted contacts.",
      "Take 15-minute rest breaks every 90 minutes of riding.",
    ],
  },
  {
    id: "road-knowledge",
    number: "04",
    title: "ROAD KNOWLEDGE",
    description:
      "Useful community knowledge for better journey preparation.",
    items: [
      "Check weather and mountain pass road conditions before departure.",
      "Identify verified fuel stations along your planned route.",
      "Locate repair shops before entering remote or ghat sections.",
      "Keep basic puncture repair kits and emergency gear accessible.",
    ],
  },
];

function CommunityGuide() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [activeCategory, setActiveCategory] = useState("group-rides");

  const [savedGuides, setSavedGuides] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("mototribeSavedGuides") || "[]"
      );
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(
      "mototribeSavedGuides",
      JSON.stringify(savedGuides)
    );
  }, [savedGuides]);

  const activeGuide = guideCategories.find(
    (category) => category.id === activeCategory
  );

  const toggleSave = (id) => {
    setSavedGuides((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  return (
    <section className="community-guide-section" id="community-guide">
      <div className="community-guide-container">

        {/* HEADER */}
        <div className="community-guide-header">
          <div>
            <span className="community-guide-eyebrow">
              MOTOTRIBE / COMMUNITY GUIDE
            </span>

            <h2>
              Ride
              <br />
              together.
            </h2>

            <p>
              A shared knowledge space for riders who believe that better journeys begin with better communities.
            </p>
          </div>

          <div className="community-guide-mark">
            <span>COMMUNITY</span>
            <strong>KNOWLEDGE / 01</strong>
          </div>
        </div>

        {!isAuthenticated ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px dashed rgba(212, 160, 62, 0.3)",
              borderRadius: "12px",
              margin: "40px 0",
            }}
          >
            <div style={{ fontSize: "36px", marginBottom: "16px" }}>🔒</div>
            <h3 style={{ fontSize: "16px", fontWeight: "800", letterSpacing: "2px", color: "#d4a03e", marginBottom: "8px" }}>
              AUTHENTICATION REQUIRED
            </h3>
            <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)", maxWidth: "480px", margin: "0 auto 20px" }}>
              Please log in to access community riding guides, save route knowledge, and view safety protocols.
            </p>
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              style={{
                padding: "12px 28px",
                background: "linear-gradient(135deg, #d4a03e 0%, #b88328 100%)",
                color: "#07080a",
                fontWeight: "800",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                letterSpacing: "1.5px",
                fontSize: "12px",
              }}
            >
              LOGIN / SIGN UP TO UNLOCK
            </button>
          </div>
        ) : (
          <>
            {/* MAIN GUIDE */}
            <div className="community-guide-layout">

              {/* CATEGORY LIST */}
              <div className="guide-category-list">
                <div className="guide-list-heading">
                  <span>EXPLORE GUIDE</span>
                  <span>04 CATEGORIES</span>
                </div>

                {guideCategories.map((category) => (
                  <button
                    key={category.id}
                    className={`guide-category ${
                      activeCategory === category.id ? "active" : ""
                    }`}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    <span className="guide-category-number">
                      {category.number}
                    </span>

                    <span className="guide-category-content">
                      <strong>{category.title}</strong>
                      <small>{category.description}</small>
                    </span>

                    <span className="guide-category-arrow">→</span>
                  </button>
                ))}
              </div>

              {/* DETAIL */}
              <div className="community-guide-detail">
                {activeGuide && (
                  <>
                    <div className="guide-detail-top">
                      <div>
                        <span>GUIDE / {activeGuide.number}</span>
                        <h3>{activeGuide.title}</h3>
                      </div>

                      <button
                        className={`guide-save ${
                          savedGuides.includes(activeGuide.id) ? "saved" : ""
                        }`}
                        onClick={() => toggleSave(activeGuide.id)}
                      >
                        {savedGuides.includes(activeGuide.id)
                          ? "SAVED ✓"
                          : "SAVE GUIDE"}
                      </button>
                    </div>

                    <div className="guide-detail-line"></div>

                    <p className="guide-detail-description">
                      {activeGuide.description}
                    </p>

                    <div className="guide-items">
                      {activeGuide.items.map((item, index) => (
                        <div className="guide-item" key={item}>
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <p>{item}</p>
                          <strong>+</strong>
                        </div>
                      ))}
                    </div>

                    <div className="guide-detail-footer">
                      <span>MOTOTRIBE COMMUNITY STANDARD</span>
                      <p>
                        Good riding is not only about the motorcycle. It is about how we treat the road and each other.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* COMMUNITY PRINCIPLES */}
            <div className="community-principles">
              <div className="principle-heading">
                <span>OUR PRINCIPLES</span>
                <h3>
                  Strong riders.
                  <br />
                  Stronger community.
                </h3>
              </div>

              <div className="principle-grid">
                <div className="principle-card">
                  <span>01</span>
                  <strong>RESPECT</strong>
                  <p>
                    Respect riders, pedestrians and every community you travel through.
                  </p>
                </div>

                <div className="principle-card">
                  <span>02</span>
                  <strong>RESPONSIBILITY</strong>
                  <p>
                    Prepare properly and make decisions that protect yourself and your group.
                  </p>
                </div>

                <div className="principle-card">
                  <span>03</span>
                  <strong>CONNECTION</strong>
                  <p>
                    Share useful knowledge and help other riders discover better journeys.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </section>
  );
}

export default CommunityGuide;