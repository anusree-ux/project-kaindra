import { useEffect, useState } from "react";
import "./Navigation.css";

const NAVIGATION_STEPS = [
  {
    id: 1,
    direction: "STRAIGHT",
    instruction: "Continue straight on the main route",
    distance: "1.8 km",
    duration: "3 min",
  },
  {
    id: 2,
    direction: "RIGHT",
    instruction: "Turn right toward the next checkpoint",
    distance: "4.2 km",
    duration: "7 min",
  },
  {
    id: 3,
    direction: "LEFT",
    instruction: "Turn left and continue toward the fuel stop",
    distance: "8.6 km",
    duration: "12 min",
  },
  {
    id: 4,
    direction: "STRAIGHT",
    instruction: "Continue straight for the next section",
    distance: "16.4 km",
    duration: "21 min",
  },
  {
    id: 5,
    direction: "RIGHT",
    instruction: "Turn right toward the final destination",
    distance: "9.7 km",
    duration: "14 min",
  },
];

function getDirectionSymbol(direction) {
  if (direction === "RIGHT") {
    return "→";
  }

  if (direction === "LEFT") {
    return "←";
  }

  return "↑";
}

function Navigation({ ride }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [notice, setNotice] = useState("");

  const currentInstruction =
    NAVIGATION_STEPS[currentStep];

  useEffect(() => {
    if (!isNavigating) {
      return;
    }

    const timer = setInterval(() => {
      setCurrentStep((previousStep) => {
        if (
          previousStep >=
          NAVIGATION_STEPS.length - 1
        ) {
          setIsNavigating(false);
          setNotice(
            "Navigation route completed."
          );

          return previousStep;
        }

        return previousStep + 1;
      });
    }, 12000);

    return () => clearInterval(timer);
  }, [isNavigating]);

  const startNavigation = () => {
    setCurrentStep(0);
    setIsNavigating(true);
    setNotice(
      "Navigation started."
    );
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setNotice(
      "Navigation paused."
    );
  };

  const nextInstruction = () => {
    setCurrentStep((previousStep) => {
      if (
        previousStep >=
        NAVIGATION_STEPS.length - 1
      ) {
        setIsNavigating(false);
        setNotice(
          "You have reached the final navigation step."
        );

        return previousStep;
      }

      return previousStep + 1;
    });
  };

  const previousInstruction = () => {
    setCurrentStep((previousStep) =>
      Math.max(0, previousStep - 1)
    );

    setNotice("");
  };

  return (
    <section className="mototribe-navigation">
      <div className="mototribe-navigation-header">
        <div>
          <span className="mototribe-navigation-eyebrow">
            LIVE RIDE / NAVIGATION
          </span>

          <h2>ROUTE INSTRUCTIONS</h2>

          <p>
            Follow the active route and monitor the
            next navigation instruction.
          </p>
        </div>

        <div
          className={`mototribe-navigation-status ${
            isNavigating
              ? "active"
              : "paused"
          }`}
        >
          <span />

          {isNavigating
            ? "NAVIGATING"
            : "READY"}
        </div>
      </div>

      <div className="mototribe-navigation-ride">
        <span>ACTIVE RIDE</span>

        <strong>
          {ride?.name ||
            "MotoTribe Live Ride"}
        </strong>
      </div>

      <div className="mototribe-navigation-current">
        <div className="mototribe-navigation-direction">
          <span>
            {getDirectionSymbol(
              currentInstruction.direction
            )}
          </span>

          <small>
            {currentInstruction.direction}
          </small>
        </div>

        <div className="mototribe-navigation-instruction">
          <span>NEXT INSTRUCTION</span>

          <h3>
            {currentInstruction.instruction}
          </h3>

          <div className="mototribe-navigation-distance">
            <strong>
              {currentInstruction.distance}
            </strong>

            <span>
              {currentInstruction.duration}
            </span>
          </div>
        </div>
      </div>

      <div className="mototribe-navigation-progress">
        <div className="mototribe-navigation-progress-top">
          <span>
            STEP {currentStep + 1} OF{" "}
            {NAVIGATION_STEPS.length}
          </span>

          <strong>
            {Math.round(
              ((currentStep + 1) /
                NAVIGATION_STEPS.length) *
                100
            )}
            %
          </strong>
        </div>

        <div className="mototribe-navigation-progress-bar">
          <div
            style={{
              width: `${
                ((currentStep + 1) /
                  NAVIGATION_STEPS.length) *
                100
              }%`,
            }}
          />
        </div>
      </div>

      <div className="mototribe-navigation-controls">
        {!isNavigating ? (
          <button
            type="button"
            className="primary"
            onClick={startNavigation}
          >
            START NAVIGATION
          </button>
        ) : (
          <button
            type="button"
            className="danger"
            onClick={stopNavigation}
          >
            PAUSE NAVIGATION
          </button>
        )}

        <button
          type="button"
          onClick={previousInstruction}
          disabled={currentStep === 0}
        >
          PREVIOUS
        </button>

        <button
          type="button"
          onClick={nextInstruction}
          disabled={
            currentStep ===
            NAVIGATION_STEPS.length - 1
          }
        >
          NEXT
        </button>
      </div>

      <div className="mototribe-navigation-route">
        <div className="mototribe-navigation-route-heading">
          <div>
            <span>01</span>

            <h3>UPCOMING INSTRUCTIONS</h3>
          </div>
        </div>

        <div className="mototribe-navigation-list">
          {NAVIGATION_STEPS.map(
            (step, index) => (
              <button
                type="button"
                key={step.id}
                className={`mototribe-navigation-step ${
                  index === currentStep
                    ? "current"
                    : ""
                } ${
                  index < currentStep
                    ? "completed"
                    : ""
                }`}
                onClick={() =>
                  setCurrentStep(index)
                }
              >
                <span className="mototribe-navigation-step-number">
                  {index < currentStep
                    ? "✓"
                    : step.id}
                </span>

                <span className="mototribe-navigation-step-direction">
                  {getDirectionSymbol(
                    step.direction
                  )}
                </span>

                <span className="mototribe-navigation-step-content">
                  <strong>
                    {step.instruction}
                  </strong>

                  <small>
                    {step.distance} ·{" "}
                    {step.duration}
                  </small>
                </span>

                <span className="mototribe-navigation-step-status">
                  {index === currentStep
                    ? "CURRENT"
                    : index < currentStep
                      ? "DONE"
                      : "UPCOMING"}
                </span>
              </button>
            )
          )}
        </div>
      </div>

      {notice && (
        <div className="mototribe-navigation-notice">
          <span>✦</span>

          <p>{notice}</p>
        </div>
      )}

      <div className="mototribe-navigation-footer">
        <span>ROUTE DATA</span>

        <p>
          Navigation instructions are currently
          displayed in frontend demo mode.
        </p>
      </div>
    </section>
  );
}

export default Navigation;