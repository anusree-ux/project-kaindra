import { useEffect, useState } from "react";
import "./RideAssistant.css";

const STORAGE_KEY = "mototribeAssistantChecks";

const assistantOptions = [
  {
    id: "route",
    number: "01",
    title: "ROUTE ASSIST",
    shortTitle: "Route",
    icon: "MAP",
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
    icon: "FUEL",
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
    icon: "SVC",
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
    icon: "SOS",
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

function getStoredChecks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function RideAssistant() {
  const [activeOption, setActiveOption] = useState("route");
  const [completedChecks, setCompletedChecks] = useState(getStoredChecks);
  const [assistantMode, setAssistantMode] = useState("READY");

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(completedChecks)
      );
    } catch {
      // Ignore localStorage errors.
    }
  }, [completedChecks]);

  const selectedOption =
    assistantOptions.find(
      (option) => option.id === activeOption
    ) || assistantOptions[0];

  const getCheckId = (index) =>
    `${activeOption}-${index}`;

  const toggleCheck = (index) => {
    const checkId = getCheckId(index);

    setCompletedChecks((current) =>
      current.includes(checkId)
        ? current.filter((item) => item !== checkId)
        : [...current, checkId]
    );
  };

  const completedForCurrent = selectedOption.tips.filter(
    (_, index) =>
      completedChecks.includes(getCheckId(index))
  ).length;

  const progressPercentage =
    selectedOption.tips.length > 0
      ? Math.round(
          (completedForCurrent /
            selectedOption.tips.length) *
            100
        )
      : 0;

  const resetChecks = () => {
    setCompletedChecks((current) =>
      current.filter(
        (item) => !item.startsWith(`${activeOption}-`)
      )
    );
  };

  const toggleAssistantMode = () => {
    setAssistantMode((current) =>
      current === "READY" ? "ACTIVE" : "READY"
    );
  };

  return (
    <section
      className="ride-assistant-section"
      id="ride-assistant"
      aria-labelledby="ride-assistant-title"
    >
      <div className="ride-assistant-container">
        {/* HEADER */}
        <div className="ride-assistant-header">
          <div className="assistant-heading">
            <span className="assistant-eyebrow">
              MOTOTRIBE / RIDE ASSISTANT
            </span>

            <h2 id="ride-assistant-title">
              Your ride.
              <br />
              Your co-pilot.
            </h2>

            <p>
              Practical guidance for every stage of your
              Practical guidance for every stage of your journey — from preparation to the road ahead.
            </p>
          </div>

          <div className="assistant-status">
            <span className="assistant-status-label">
              ASSISTANT STATUS
            </span>

            <button
              type="button"
              className={`assistant-status-button ${assistantMode.toLowerCase()}`}
              onClick={toggleAssistantMode}
              aria-pressed={assistantMode === "ACTIVE"}
              aria-label={`Ride assistant status: ${assistantMode}. Click to change.`}
            >
              <span
                className="status-dot"
                aria-hidden="true"
              />
              {assistantMode}
            </button>
          </div>
        </div>

        {/* ASSISTANT NAVIGATION */}
        <nav
          className="assistant-navigation"
          aria-label="Ride assistant categories"
        >
          {assistantOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`assistant-nav-item ${
                activeOption === option.id ? "active" : ""
              }`}
              onClick={() => setActiveOption(option.id)}
              aria-current={
                activeOption === option.id
                  ? "page"
                  : undefined
              }
            >
              <span className="assistant-nav-number">
                {option.number}
              </span>

              <span
                className="assistant-nav-icon"
                aria-hidden="true"
              > {option.shortTitle[0]} </span>

              <span className="assistant-nav-title">
                {option.shortTitle}
              </span>

              <span
                className="assistant-nav-arrow"
                aria-hidden="true"
              >
                &#8250;
              </span>
            </button>
          ))}
        </nav>

        {/* MAIN ASSISTANT PANEL */}
        <div className="assistant-main-panel">
          {/* LEFT PANEL */}
          <div className="assistant-panel-intro">
            <span className="assistant-panel-label">
              ACTIVE ASSISTANCE / {selectedOption.number}
            </span>

            <div
              className="assistant-large-icon"
              aria-hidden="true"
            >
              {selectedOption.number}
            </div>

            <h3>{selectedOption.title}</h3>

            <p>{selectedOption.description}</p>

            <div className="assistant-progress">
              <div className="assistant-progress-header">
                <span>CHECKLIST PROGRESS</span>

                <strong>
                  {completedForCurrent}/
                  {selectedOption.tips.length}
                </strong>
              </div>

              <div
                className="assistant-progress-bar"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={progressPercentage}
                aria-label="Checklist completion"
              >
                <span
                  style={{
                    width: `${progressPercentage}%`,
                  }}
                />
              </div>

              <span className="assistant-progress-percent">
                {progressPercentage}% COMPLETE
              </span>
            </div>

            <button
              type="button"
              className="assistant-reset"
              onClick={resetChecks}
              disabled={completedForCurrent === 0}
            >
              RESET CHECKLIST
            </button>
          </div>

          {/* RIGHT CHECKLIST */}
          <div className="assistant-checklist">
            <div className="checklist-heading">
              <span>RECOMMENDED ACTIONS</span>

              <span>
                {String(
                  selectedOption.tips.length
                ).padStart(2, "0")}
              </span>
            </div>

            <div className="assistant-checklist-items">
              {selectedOption.tips.map(
                (tip, index) => {
                  const checkId = getCheckId(index);

                  const isComplete =
                    completedChecks.includes(checkId);

                  return (
                    <button
                      key={checkId}
                      type="button"
                      className={`assistant-check-item ${
                        isComplete ? "completed" : ""
                      }`}
                      onClick={() =>
                        toggleCheck(index)
                      }
                      aria-pressed={isComplete}
                    >
                      <span className="check-number">
                        {String(index + 1).padStart(
                          2,
                          "0"
                        )}
                      </span>

                      <span
                        className="check-box"
                        aria-hidden="true"
                      >
                        {isComplete ? "✓" : ""}
                      </span>

                      <span className="check-text">
                        {tip}
                      </span>

                      <span
                        className="check-arrow"
                        aria-hidden="true"
                      >
                        &rsaquo;
                      </span>
                    </button>
                  );
                }
              )}
            </div>
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
                Let someone you trust know your planned
                route and expected arrival.
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="assistant-footer">
          <span>MOTOTRIBE RIDE ASSISTANT</span>

          <p>
            Ride prepared. Ride aware. Ride together.
          </p>
        </div>
      </div>
    </section>
  );
}

export default RideAssistant;


