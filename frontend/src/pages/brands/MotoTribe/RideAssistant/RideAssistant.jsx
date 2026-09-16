import { useEffect, useState } from "react";
import "./RideAssistant.css";

const assistantOptions = [
  {
    id: "route",
    number: "01",
    title: "ROUTE ASSIST",
    shortTitle: "Route",
    icon: "↗",
    description:
      "Get quick guidance for planning and managing your riding route.",
    tips: [
      "Check the route before starting your ride.",
      "Identify fuel and rest stops in advance.",
      "Keep an alternate route available for unexpected road conditions.",
      "Share your planned route with a trusted contact.",
    ],
  },
  {
    id: "fuel",
    number: "02",
    title: "FUEL CHECK",
    shortTitle: "Fuel",
    icon: "◉",
    description:
      "Keep your motorcycle ready by planning fuel stops before the journey.",
    tips: [
      "Refuel before entering long remote sections.",
      "Do not rely on the last available fuel station.",
      "Monitor your motorcycle's average mileage.",
      "Keep enough fuel reserve for unexpected detours.",
    ],
  },
  {
    id: "service",
    number: "03",
    title: "SERVICE HELP",
    shortTitle: "Service",
    icon: "⚙",
    description:
      "Prepare for common motorcycle service requirements during a ride.",
    tips: [
      "Check tyre pressure before departure.",
      "Inspect chain condition and lubrication.",
      "Check engine oil and coolant levels.",
      "Know the nearest service points on long routes.",
    ],
  },
  {
    id: "safety",
    number: "04",
    title: "SAFETY CHECK",
    shortTitle: "Safety",
    icon: "✦",
    description:
      "Run through a simple safety checklist before getting on the road.",
    tips: [
      "Wear a certified helmet and protective gear.",
      "Carry your driving and vehicle documents.",
      "Keep emergency contacts accessible.",
      "Avoid riding when excessively tired.",
    ],
  },
];

function RideAssistant() {
  const [activeOption, setActiveOption] = useState("route");

  const [completedChecks, setCompletedChecks] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("mototribeAssistantChecks") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [assistantMode, setAssistantMode] = useState("READY");

  useEffect(() => {
    localStorage.setItem(
      "mototribeAssistantChecks",
      JSON.stringify(completedChecks)
    );
  }, [completedChecks]);

  const selectedOption = assistantOptions.find(
    (option) => option.id === activeOption
  );

  const toggleCheck = (index) => {
    const checkId = `${activeOption}-${index}`;

    setCompletedChecks((current) =>
      current.includes(checkId)
        ? current.filter((item) => item !== checkId)
        : [...current, checkId]
    );
  };

  const getCheckId = (index) => `${activeOption}-${index}`;

  const completedForCurrent =
    selectedOption?.tips.filter((_, index) =>
      completedChecks.includes(getCheckId(index))
    ).length || 0;

  const resetChecks = () => {
    setCompletedChecks((current) =>
      current.filter(
        (item) => !item.startsWith(`${activeOption}-`)
      )
    );
  };

  return (
    <section
      className="ride-assistant-section"
      id="ride-assistant"
    >
      <div className="ride-assistant-container">

        {/* HEADER */}

        <div className="ride-assistant-header">

          <div className="assistant-heading">

            <span className="assistant-eyebrow">
              MOTOTRIBE / RIDE ASSISTANT
            </span>

            <h2>
              Your ride.
              <br />
              Your co-pilot.
            </h2>

            <p>
              Practical guidance for every stage of
              your journey — from preparation to the
              road ahead.
            </p>

          </div>

          <div className="assistant-status">

            <span className="assistant-status-label">
              ASSISTANT STATUS
            </span>

            <button
              className={`assistant-status-button ${assistantMode.toLowerCase()}`}
              onClick={() =>
                setAssistantMode(
                  assistantMode === "READY"
                    ? "ACTIVE"
                    : "READY"
                )
              }
            >
              <span className="status-dot"></span>
              {assistantMode}
            </button>

          </div>

        </div>

        {/* ASSISTANT NAV */}

        <div className="assistant-navigation">

          {assistantOptions.map((option) => (
            <button
              key={option.id}
              className={`assistant-nav-item ${
                activeOption === option.id
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveOption(option.id)
              }
            >

              <span className="assistant-nav-number">
                {option.number}
              </span>

              <span className="assistant-nav-icon">
                {option.icon}
              </span>

              <span className="assistant-nav-title">
                {option.shortTitle}
              </span>

              <span className="assistant-nav-arrow">
                →
              </span>

            </button>
          ))}

        </div>

        {/* MAIN ASSISTANT PANEL */}

        <div className="assistant-main-panel">

          {/* LEFT */}

          <div className="assistant-panel-intro">

            <span className="assistant-panel-label">
              ACTIVE ASSISTANCE / {selectedOption?.number}
            </span>

            <div className="assistant-large-icon">
              {selectedOption?.icon}
            </div>

            <h3>
              {selectedOption?.title}
            </h3>

            <p>
              {selectedOption?.description}
            </p>

            <div className="assistant-progress">

              <div className="assistant-progress-header">
                <span>
                  CHECKLIST PROGRESS
                </span>

                <strong>
                  {completedForCurrent}/
                  {selectedOption?.tips.length}
                </strong>
              </div>

              <div className="assistant-progress-bar">
                <span
                  style={{
                    width: `${
                      selectedOption?.tips.length
                        ? (completedForCurrent /
                            selectedOption.tips.length) *
                          100
                        : 0
                    }%`,
                  }}
                ></span>
              </div>

            </div>

            <button
              className="assistant-reset"
              onClick={resetChecks}
            >
              RESET CHECKLIST
            </button>

          </div>

          {/* RIGHT CHECKLIST */}

          <div className="assistant-checklist">

            <div className="checklist-heading">
              <span>RECOMMENDED ACTIONS</span>
              <span>
                {selectedOption?.tips.length
                  .toString()
                  .padStart(2, "0")}
              </span>
            </div>

            {selectedOption?.tips.map(
              (tip, index) => {
                const checkId = getCheckId(index);
                const isComplete =
                  completedChecks.includes(checkId);

                return (
                  <button
                    key={tip}
                    className={`assistant-check-item ${
                      isComplete ? "completed" : ""
                    }`}
                    onClick={() =>
                      toggleCheck(index)
                    }
                  >

                    <span className="check-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="check-box">
                      {isComplete ? "✓" : ""}
                    </span>

                    <span className="check-text">
                      {tip}
                    </span>

                    <span className="check-arrow">
                      →
                    </span>

                  </button>
                );
              }
            )}

          </div>

        </div>

        {/* QUICK ASSISTANCE */}

        <div className="quick-assistance">

          <div className="quick-assistance-heading">

            <span>QUICK ASSISTANCE</span>

            <h3>
              Before you
              <br />
              ride.
            </h3>

          </div>

          <div className="quick-assistance-grid">

            <div className="quick-card">
              <span>01</span>
              <strong>DOCUMENTS</strong>
              <p>
                Keep your license, registration and
                insurance documents accessible.
              </p>
            </div>

            <div className="quick-card">
              <span>02</span>
              <strong>GEAR</strong>
              <p>
                Helmet, gloves, riding jacket and
                protective equipment should be ready.
              </p>
            </div>

            <div className="quick-card">
              <span>03</span>
              <strong>MOTORCYCLE</strong>
              <p>
                Inspect tyres, brakes, lights, chain
                and essential fluid levels.
              </p>
            </div>

            <div className="quick-card">
              <span>04</span>
              <strong>CONTACT</strong>
              <p>
                Let someone you trust know your
                planned route and expected arrival.
              </p>
            </div>

          </div>

        </div>

        {/* FOOTER */}

        <div className="assistant-footer">

          <span>
            MOTOTRIBE RIDE ASSISTANT
          </span>

          <p>
            Ride prepared. Ride aware. Ride together.
          </p>

        </div>

      </div>
    </section>
  );
}

export default RideAssistant;