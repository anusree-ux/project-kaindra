import { useEffect, useMemo, useState } from "react";
import "./RidePlanner.css";

const defaultPlan = {
  start: "",
  destination: "",
  date: "",
  time: "06:00",
  style: "ADVENTURE",
  difficulty: "INTERMEDIATE",
  distance: "",
};

const locationDistances = {
  "Delhi-Leh": 1020,
  "Visakhapatnam-Kakinada": 310,
  "Bengaluru-Coorg": 270,
  "Hyderabad-Vijayawada": 275,
};

function RidePlanner() {
  const [plan, setPlan] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("mototribeRidePlan") ||
          JSON.stringify(defaultPlan)
      );
    } catch {
      return defaultPlan;
    }
  });

  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      "mototribeRidePlan",
      JSON.stringify(plan)
    );
  }, [plan]);

  const updateField = (field, value) => {
    setPlan((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
  };

  const calculatedDistance = useMemo(() => {
    const key = `${plan.start}-${plan.destination}`;

    if (locationDistances[key]) {
      return locationDistances[key];
    }

    return Number(plan.distance) || 0;
  }, [plan]);

  const fuelEstimate = useMemo(() => {
    if (!calculatedDistance) return 0;

    const mileage =
      plan.style === "ADVENTURE"
        ? 28
        : plan.style === "TOURING"
        ? 35
        : plan.style === "CRUISER"
        ? 32
        : 38;

    return Math.ceil(
      calculatedDistance / mileage
    );
  }, [calculatedDistance, plan.style]);

  const ridingHours = useMemo(() => {
    if (!calculatedDistance) return 0;

    const speed =
      plan.difficulty === "ADVANCED"
        ? 55
        : plan.difficulty === "INTERMEDIATE"
        ? 50
        : 45;

    return Math.ceil(
      calculatedDistance / speed
    );
  }, [calculatedDistance, plan.difficulty]);

  const restStops = useMemo(() => {
    if (!calculatedDistance) return 0;

    return Math.max(
      1,
      Math.ceil(calculatedDistance / 180)
    );
  }, [calculatedDistance]);

  const fuelStops = useMemo(() => {
    if (!calculatedDistance) return 0;

    return Math.max(
      1,
      Math.ceil(calculatedDistance / 300)
    );
  }, [calculatedDistance]);

  const estimatedBudget = useMemo(() => {
    if (!calculatedDistance) return 0;

    const fuelCost = fuelEstimate * 105;

    const foodCost =
      Math.max(1, Math.ceil(ridingHours / 4)) *
      450;

    const accommodation =
      ridingHours > 10 ? 1200 : 0;

    return fuelCost + foodCost + accommodation;
  }, [calculatedDistance, fuelEstimate, ridingHours]);

  const generatePlan = () => {
    if (!plan.start || !plan.destination) {
      alert(
        "Please enter both start location and destination."
      );
      return;
    }

    if (!calculatedDistance) {
      alert(
        "Please enter an estimated distance."
      );
      return;
    }

    setGeneratedPlan({
      ...plan,
      distance: calculatedDistance,
      fuel: fuelEstimate,
      ridingHours,
      restStops,
      fuelStops,
      budget: estimatedBudget,
    });

    setSaved(false);
  };

  const savePlan = () => {
    if (!generatedPlan) {
      alert(
        "Generate your ride plan before saving."
      );
      return;
    }

    localStorage.setItem(
      "mototribeSavedRidePlan",
      JSON.stringify(generatedPlan)
    );

    setSaved(true);
  };

  const resetPlan = () => {
    setPlan(defaultPlan);
    setGeneratedPlan(null);
    setSaved(false);

    localStorage.removeItem(
      "mototribeRidePlan"
    );
  };

  return (
    <section
      className="ride-planner-section"
      id="ride-planner"
    >
      <div className="ride-planner-container">

        {/* HEADER */}

        <div className="ride-planner-header">

          <div>
            <span className="ride-planner-eyebrow">
              MOTOTRIBE / JOURNEY PLANNER
            </span>

            <h2>
              Plan the ride.
            </h2>

            <p>
              Build your route, estimate the journey
              and prepare before you hit the road.
            </p>
          </div>

          <div className="planner-header-label">
            ROUTE
            <strong>PLANNING SYSTEM</strong>
          </div>

        </div>

        {/* PLANNER */}

        <div className="ride-planner-workspace">

          {/* INPUT PANEL */}

          <div className="ride-planner-form">

            <div className="planner-form-heading">
              <span>01</span>
              <div>
                <strong>ROUTE DETAILS</strong>
                <p>
                  Define your starting point and destination.
                </p>
              </div>
            </div>

            <div className="planner-fields">

              <label>
                START LOCATION
                <input
                  type="text"
                  placeholder="Example: Delhi"
                  value={plan.start}
                  onChange={(event) =>
                    updateField(
                      "start",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                DESTINATION
                <input
                  type="text"
                  placeholder="Example: Leh"
                  value={plan.destination}
                  onChange={(event) =>
                    updateField(
                      "destination",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                RIDE DATE
                <input
                  type="date"
                  value={plan.date}
                  onChange={(event) =>
                    updateField(
                      "date",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                DEPARTURE TIME
                <input
                  type="time"
                  value={plan.time}
                  onChange={(event) =>
                    updateField(
                      "time",
                      event.target.value
                    )
                  }
                />
              </label>

            </div>

            <div className="planner-form-heading second">
              <span>02</span>
              <div>
                <strong>RIDE PROFILE</strong>
                <p>
                  Choose the type of journey you want.
                </p>
              </div>
            </div>

            <div className="planner-fields">

              <label>
                RIDING STYLE
                <select
                  value={plan.style}
                  onChange={(event) =>
                    updateField(
                      "style",
                      event.target.value
                    )
                  }
                >
                  <option value="ADVENTURE">
                    ADVENTURE
                  </option>

                  <option value="TOURING">
                    TOURING
                  </option>

                  <option value="CRUISER">
                    CRUISER
                  </option>

                  <option value="SPORT">
                    SPORT
                  </option>
                </select>
              </label>

              <label>
                DIFFICULTY
                <select
                  value={plan.difficulty}
                  onChange={(event) =>
                    updateField(
                      "difficulty",
                      event.target.value
                    )
                  }
                >
                  <option value="EASY">
                    EASY
                  </option>

                  <option value="INTERMEDIATE">
                    INTERMEDIATE
                  </option>

                  <option value="ADVANCED">
                    ADVANCED
                  </option>
                </select>
              </label>

              <label>
                DISTANCE
                <input
                  type="number"
                  min="1"
                  placeholder="KM"
                  value={plan.distance}
                  onChange={(event) =>
                    updateField(
                      "distance",
                      event.target.value
                    )
                  }
                />
              </label>

            </div>

            <div className="planner-form-actions">

              <button
                className="planner-generate"
                onClick={generatePlan}
              >
                GENERATE RIDE PLAN
              </button>

              <button
                className="planner-reset"
                onClick={resetPlan}
              >
                RESET
              </button>

            </div>

          </div>

          {/* RESULT PANEL */}

          <div className="ride-planner-result">

            {!generatedPlan ? (
              <div className="planner-empty">

                <span>READY TO PLAN</span>

                <div className="planner-empty-mark">
                  +
                </div>

                <h3>
                  Your journey
                  starts here.
                </h3>

                <p>
                  Enter your route details and
                  generate a ride plan.
                </p>

              </div>
            ) : (
              <div className="planner-result-content">

                <div className="result-top">

                  <div>
                    <span>GENERATED ROUTE</span>

                    <h3>
                      {generatedPlan.start}
                      <b>→</b>
                      {generatedPlan.destination}
                    </h3>
                  </div>

                  <span className="result-style">
                    {generatedPlan.style}
                  </span>

                </div>

                <div className="result-route-line">
                  <span></span>
                  <div></div>
                  <span></span>
                </div>

                <div className="planner-result-stats">

                  <div>
                    <span>DISTANCE</span>
                    <strong>
                      {generatedPlan.distance}
                      <small> KM</small>
                    </strong>
                  </div>

                  <div>
                    <span>RIDING TIME</span>
                    <strong>
                      {generatedPlan.ridingHours}
                      <small> HRS</small>
                    </strong>
                  </div>

                  <div>
                    <span>FUEL</span>
                    <strong>
                      {generatedPlan.fuel}
                      <small> L</small>
                    </strong>
                  </div>

                  <div>
                    <span>BUDGET</span>
                    <strong>
                      ₹
                      {generatedPlan.budget.toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                </div>

                <div className="planner-stops">

                  <div>
                    <span>FUEL STOPS</span>
                    <strong>
                      {generatedPlan.fuelStops}
                    </strong>
                  </div>

                  <div>
                    <span>REST STOPS</span>
                    <strong>
                      {generatedPlan.restStops}
                    </strong>
                  </div>

                  <div>
                    <span>DEPARTURE</span>
                    <strong>
                      {generatedPlan.time}
                    </strong>
                  </div>

                </div>

                <div className="planner-notice">

                  <span>RIDE NOTE</span>

                  <p>
                    Plan regular breaks, check weather
                    conditions and inspect your motorcycle
                    before departure.
                  </p>

                </div>

                <button
                  className={`planner-save ${
                    saved ? "saved" : ""
                  }`}
                  onClick={savePlan}
                >
                  {saved
                    ? "PLAN SAVED ✓"
                    : "SAVE RIDE PLAN"}
                </button>

              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}

export default RidePlanner;