import { useEffect, useState } from "react";
import "./CommunityGuide.css";

const guideCategories = [
  {
    id: "group-rides",
    number: "01",
    title: "GROUP RIDES",
    description:
      "Understand how to ride safely and confidently as part of a group.",
    items: [
      "Maintain a safe riding distance.",
      "Follow the lead rider and route instructions.",
      "Do not overtake aggressively within the group.",
      "Signal hazards clearly to riders behind you.",
    ],
  },
  {
    id: "ride-etiquette",
    number: "02",
    title: "RIDE ETIQUETTE",
    description:
      "Simple riding practices that keep the community respectful.",
    items: [
      "Respect other riders and road users.",
      "Avoid unnecessary noise in residential areas.",
      "Keep shared riding spaces clean.",
      "Support new riders instead of pressuring them.",
    ],
  },
  {
    id: "community-safety",
    number: "03",
    title: "COMMUNITY SAFETY",
    description:
      "Build safer riding groups through preparation and awareness.",
    items: [
      "Carry emergency contact information.",
      "Check your motorcycle before every long ride.",
      "Share your planned route with trusted contacts.",
      "Take regular breaks during long-distance journeys.",
    ],
  },
  {
    id: "road-knowledge",
    number: "04",
    title: "ROAD KNOWLEDGE",
    description:
      "Useful community knowledge for better journey preparation.",
    items: [
      "Check weather and road conditions before departure.",
      "Know the fuel stations along your route.",
      "Identify service points before remote sections.",
      "Keep basic emergency equipment accessible.",
    ],
  },
];

function CommunityGuide() {
  const [activeCategory, setActiveCategory] =
    useState("group-rides");

  const [savedGuides, setSavedGuides] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("mototribeSavedGuides") ||
          "[]"
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
    <section
      className="community-guide-section"
      id="community-guide"
    >
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
              A shared knowledge space for riders who
              believe that better journeys begin with
              better communities.
            </p>
          </div>

          <div className="community-guide-mark">
            <span>COMMUNITY</span>
            <strong>KNOWLEDGE / 01</strong>
          </div>

        </div>

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
                  activeCategory === category.id
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActiveCategory(category.id)
                }
              >

                <span className="guide-category-number">
                  {category.number}
                </span>

                <span className="guide-category-content">
                  <strong>{category.title}</strong>
                  <small>
                    {category.description}
                  </small>
                </span>

                <span className="guide-category-arrow">
                  →
                </span>

              </button>
            ))}

          </div>

          {/* DETAIL */}

          <div className="community-guide-detail">

            {activeGuide && (
              <>
                <div className="guide-detail-top">

                  <div>
                    <span>
                      GUIDE / {activeGuide.number}
                    </span>

                    <h3>
                      {activeGuide.title}
                    </h3>
                  </div>

                  <button
                    className={`guide-save ${
                      savedGuides.includes(
                        activeGuide.id
                      )
                        ? "saved"
                        : ""
                    }`}
                    onClick={() =>
                      toggleSave(activeGuide.id)
                    }
                  >
                    {savedGuides.includes(
                      activeGuide.id
                    )
                      ? "SAVED ✓"
                      : "SAVE GUIDE"}
                  </button>

                </div>

                <div className="guide-detail-line"></div>

                <p className="guide-detail-description">
                  {activeGuide.description}
                </p>

                <div className="guide-items">

                  {activeGuide.items.map(
                    (item, index) => (
                      <div
                        className="guide-item"
                        key={item}
                      >

                        <span>
                          {String(index + 1).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <p>{item}</p>

                        <strong>+</strong>

                      </div>
                    )
                  )}

                </div>

                <div className="guide-detail-footer">

                  <span>
                    MOTOTRIBE COMMUNITY STANDARD
                  </span>

                  <p>
                    Good riding is not only about the
                    motorcycle. It is about how we
                    treat the road and each other.
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
                Respect riders, pedestrians and every
                community you travel through.
              </p>
            </div>

            <div className="principle-card">
              <span>02</span>
              <strong>RESPONSIBILITY</strong>
              <p>
                Prepare properly and make decisions
                that protect yourself and your group.
              </p>
            </div>

            <div className="principle-card">
              <span>03</span>
              <strong>CONNECTION</strong>
              <p>
                Share useful knowledge and help other
                riders discover better journeys.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

export default CommunityGuide;