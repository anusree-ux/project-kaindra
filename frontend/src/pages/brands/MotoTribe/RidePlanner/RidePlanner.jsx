import { useMemo, useState } from "react";
import "./RidePlanner.css";

const routeOptions = [
  {
    id: 1,
    name: "Mountain Explorer",
    distance: "186 KM",
    duration: "4H 32M",
    difficulty: "MODERATE",
    fuel: "₹620",
    score: 94,
    terrain: "MOUNTAIN",
    description: "Balanced route with scenic mountain roads and reliable stops.",
  },
  {
    id: 2,
    name: "Scenic Adventure",
    distance: "214 KM",
    duration: "5H 05M",
    difficulty: "ADVENTURE",
    fuel: "₹710",
    score: 91,
    terrain: "MIXED",
    description: "Longer route with viewpoints, curves and fewer highways.",
  },
  {
    id: 3,
    name: "Fast Highway",
    distance: "162 KM",
    duration: "3H 48M",
    difficulty: "EASY",
    fuel: "₹540",
    score: 87,
    terrain: "HIGHWAY",
    description: "Fastest option with more highway riding and fewer stops.",
  },
];

const riderOptions = [
  {
    id: 1,
    name: "ARJUN",
    bike: "HIMALAYAN",
    experience: "ADVANCED",
  },
  {
    id: 2,
    name: "MEERA",
    bike: "BMW G 310 GS",
    experience: "EXPERIENCED",
  },
  {
    id: 3,
    name: "KARTHIK",
    bike: "KTM 390",
    experience: "ADVANCED",
  },
  {
    id: 4,
    name: "RIYA",
    bike: "SPEED 400",
    experience: "INTERMEDIATE",
  },
];

const motorcycles = [
  "ROYAL ENFIELD HIMALAYAN",
  "KTM 390 ADVENTURE",
  "BMW G 310 GS",
  "TRIUMPH TIGER",
  "YAMAHA MT-15",
];

function RidePlanner() {
  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");
  const [rideDate, setRideDate] = useState("");
  const [rideType, setRideType] = useState("ADVENTURE");
  const [motorcycle, setMotorcycle] = useState(motorcycles[0]);
  const [riders, setRiders] = useState(1);
  const [budget, setBudget] = useState("5000");
  const [mileage, setMileage] = useState("28");
  const [distancePreference, setDistancePreference] = useState("BALANCED");
  const [accommodation, setAccommodation] = useState(false);
  const [foodStops, setFoodStops] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState(routeOptions[0]);
  const [selectedRiders, setSelectedRiders] = useState([]);
  const [stops, setStops] = useState([]);
  const [newStop, setNewStop] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [planned, setPlanned] = useState(false);

  const estimatedFuel = useMemo(() => {
    const distance = parseInt(selectedRoute.distance, 10);
    const mileageValue = Number(mileage) || 1;

    return Math.ceil(distance / mileageValue);
  }, [selectedRoute, mileage]);

  const estimatedFuelCost = estimatedFuel * 105;

  const addStop = () => {
    const cleanStop = newStop.trim();

    if (!cleanStop) {
      return;
    }

    setStops((previous) => [...previous, cleanStop]);
    setNewStop("");
  };

  const removeStop = (index) => {
    setStops((previous) =>
      previous.filter((_, stopIndex) => stopIndex !== index)
    );
  };

  const toggleRider = (riderId) => {
    setSelectedRiders((previous) =>
      previous.includes(riderId)
        ? previous.filter((id) => id !== riderId)
        : [...previous, riderId]
    );
  };

  const analyzeRoute = (route) => {
    setSelectedRoute(route);
    setPlanned(false);
    setIsAnalyzing(true);

    setTimeout(() => {
      setIsAnalyzing(false);
    }, 900);
  };

  const createRide = () => {
    if (!start.trim() || !destination.trim()) {
      alert("Please enter your start location and destination.");
      return;
    }

    setPlanned(true);

    setTimeout(() => {
      document
        .getElementById("upcoming-rides")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 700);
  };

  const resetPlanner = () => {
    setStart("");
    setDestination("");
    setRideDate("");
    setRideType("ADVENTURE");
    setMotorcycle(motorcycles[0]);
    setRiders(1);
    setBudget("5000");
    setMileage("28");
    setDistancePreference("BALANCED");
    setAccommodation(false);
    setFoodStops(true);
    setSelectedRoute(routeOptions[0]);
    setSelectedRiders([]);
    setStops([]);
    setNewStop("");
    setPlanned(false);
  };

  return (
    <section id="ride-planner" className="ride-planner">
      <div className="planner-container">
        <div className="planner-heading">
          <div>
            <span className="planner-eyebrow">
              <span />
              PLAN • AI ROUTE BUILDER
            </span>

            <h2>
              PLAN THE RIDE.
              <span>THEN RIDE IT.</span>
            </h2>

            <p>
              Build your journey around the things that matter to you.
              MotoTribe combines your preferences, route intelligence and
              rider experience into one ride plan.
            </p>
          </div>

          <div className="planner-cycle">
            <span>01</span>
            <div>
              <strong>PLAN YOUR JOURNEY</strong>
              <small>AI + MAP + TRIBE INTELLIGENCE</small>
            </div>
          </div>
        </div>

        <div className="planner-layout">
          <div className="planner-form">
            <div className="planner-form-header">
              <div>
                <span>JOURNEY DETAILS</span>
                <h3>WHERE ARE YOU RIDING?</h3>
              </div>

              <button type="button" onClick={resetPlanner}>
                RESET
              </button>
            </div>

            <div className="location-fields">
              <label className="planner-field">
                <span>START LOCATION</span>

                <div className="input-with-icon">
                  <i>●</i>

                  <input
                    value={start}
                    onChange={(event) => setStart(event.target.value)}
                    placeholder="Enter starting point"
                  />
                </div>
              </label>

              <div className="route-connector">
                <span />
                <span />
                <span />
              </div>

              <label className="planner-field">
                <span>DESTINATION</span>

                <div className="input-with-icon">
                  <i>◎</i>

                  <input
                    value={destination}
                    onChange={(event) =>
                      setDestination(event.target.value)
                    }
                    placeholder="Where do you want to ride?"
                  />
                </div>
              </label>
            </div>

            <div className="stops-section">
              <div className="stops-header">
                <span>OPTIONAL STOPS</span>
                <small>{stops.length} ADDED</small>
              </div>

              <div className="add-stop">
                <input
                  value={newStop}
                  onChange={(event) => setNewStop(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      addStop();
                    }
                  }}
                  placeholder="Add a fuel stop, cafe, viewpoint..."
                />

                <button type="button" onClick={addStop}>
                  + ADD STOP
                </button>
              </div>

              {stops.length > 0 && (
                <div className="stop-list">
                  {stops.map((stop, index) => (
                    <div className="stop-item" key={`${stop}-${index}`}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{stop}</strong>

                      <button
                        type="button"
                        onClick={() => removeStop(index)}
                        aria-label={`Remove ${stop}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="planner-fields-grid">
              <label className="planner-field">
                <span>RIDE DATE</span>

                <input
                  type="date"
                  value={rideDate}
                  onChange={(event) => setRideDate(event.target.value)}
                />
              </label>

              <label className="planner-field">
                <span>MOTORCYCLE</span>

                <select
                  value={motorcycle}
                  onChange={(event) => setMotorcycle(event.target.value)}
                >
                  {motorcycles.map((bike) => (
                    <option key={bike} value={bike}>
                      {bike}
                    </option>
                  ))}
                </select>
              </label>

              <label className="planner-field">
                <span>RIDERS</span>

                <div className="number-control">
                  <button
                    type="button"
                    onClick={() =>
                      setRiders((previous) => Math.max(1, previous - 1))
                    }
                  >
                    −
                  </button>

                  <strong>{riders}</strong>

                  <button
                    type="button"
                    onClick={() =>
                      setRiders((previous) => Math.min(20, previous + 1))
                    }
                  >
                    +
                  </button>
                </div>
              </label>

              <label className="planner-field">
                <span>BUDGET</span>

                <div className="input-prefix">
                  <span>₹</span>

                  <input
                    type="number"
                    min="0"
                    value={budget}
                    onChange={(event) => setBudget(event.target.value)}
                  />
                </div>
              </label>
            </div>

            <div className="preference-section">
              <div className="preference-block">
                <span>RIDE TYPE</span>

                <div className="preference-buttons">
                  {["ADVENTURE", "TOURING", "COMMUTE", "LONG DISTANCE"].map(
                    (type) => (
                      <button
                        type="button"
                        key={type}
                        className={rideType === type ? "active" : ""}
                        onClick={() => setRideType(type)}
                      >
                        {type}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="preference-block">
                <span>DISTANCE PREFERENCE</span>

                <div className="preference-buttons">
                  {["SHORT", "BALANCED", "LONG"].map((option) => (
                    <button
                      type="button"
                      key={option}
                      className={
                        distancePreference === option ? "active" : ""
                      }
                      onClick={() => setDistancePreference(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="travel-preferences">
              <div className="travel-preference">
                <div>
                  <strong>ACCOMMODATION</strong>
                  <small>Include stays in route planning</small>
                </div>

                <button
                  type="button"
                  className={`switch ${accommodation ? "active" : ""}`}
                  onClick={() => setAccommodation(!accommodation)}
                  aria-label="Toggle accommodation"
                >
                  <span />
                </button>
              </div>

              <div className="travel-preference">
                <div>
                  <strong>FOOD STOPS</strong>
                  <small>Find rider-recommended places</small>
                </div>

                <button
                  type="button"
                  className={`switch ${foodStops ? "active" : ""}`}
                  onClick={() => setFoodStops(!foodStops)}
                  aria-label="Toggle food stops"
                >
                  <span />
                </button>
              </div>

              <label className="mileage-input">
                <span>BIKE MILEAGE</span>

                <div>
                  <input
                    type="number"
                    min="1"
                    value={mileage}
                    onChange={(event) => setMileage(event.target.value)}
                  />

                  <small>KM/L</small>
                </div>
              </label>
            </div>

            <div className="invite-riders">
              <div className="invite-riders-heading">
                <div>
                  <span>CONNECT BEFORE YOU RIDE</span>
                  <strong>INVITE RIDERS</strong>
                </div>

                <small>{selectedRiders.length} SELECTED</small>
              </div>

              <div className="invite-rider-list">
                {riderOptions.map((rider) => (
                  <button
                    type="button"
                    key={rider.id}
                    className={`invite-rider ${
                      selectedRiders.includes(rider.id) ? "selected" : ""
                    }`}
                    onClick={() => toggleRider(rider.id)}
                  >
                    <span className="invite-avatar">
                      {rider.name.slice(0, 2)}
                    </span>

                    <div>
                      <strong>{rider.name}</strong>
                      <small>
                        {rider.bike} • {rider.experience}
                      </small>
                    </div>

                    <i>
                      {selectedRiders.includes(rider.id) ? "✓" : "+"}
                    </i>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="route-analysis">
            <div className="analysis-heading">
              <div>
                <span>MOTO AI</span>
                <h3>ROUTE<br />ANALYSIS</h3>
              </div>

              <div className="ai-symbol">✦</div>
            </div>

            <div className="analysis-route-preview">
              <div className="preview-grid" />

              <div className="preview-road preview-road-one" />
              <div className="preview-road preview-road-two" />

              <div className="preview-point preview-start">
                <span />
                START
              </div>

              <div className="preview-point preview-stop">
                <span />
                STOPS
              </div>

              <div className="preview-point preview-end">
                <span />
                DESTINATION
              </div>

              {isAnalyzing && (
                <div className="route-analyzing">
                  <div />
                  ANALYZING
                </div>
              )}

              <div className="preview-route-label">
                <span>RECOMMENDED</span>
                <strong>{selectedRoute.name}</strong>
              </div>
            </div>

            <div className="selected-route-summary">
              <div>
                <span>ROUTE SCORE</span>
                <strong>{selectedRoute.score}<small>/100</small></strong>
              </div>

              <div>
                <span>DISTANCE</span>
                <strong>{selectedRoute.distance}</strong>
              </div>

              <div>
                <span>TIME</span>
                <strong>{selectedRoute.duration}</strong>
              </div>
            </div>

            <div className="route-characteristics">
              <div>
                <span>DIFFICULTY</span>
                <strong>{selectedRoute.difficulty}</strong>
              </div>

              <div>
                <span>TERRAIN</span>
                <strong>{selectedRoute.terrain}</strong>
              </div>

              <div>
                <span>FUEL EST.</span>
                <strong>₹{estimatedFuelCost}</strong>
              </div>
            </div>

            <div className="ai-plan-note">
              <div>✦</div>

              <p>
                <strong>AI INSIGHT</strong>
                <br />
                {selectedRoute.description} Based on your {rideType.toLowerCase()}{" "}
                preference and {distancePreference.toLowerCase()} distance
                setting.
              </p>
            </div>

            <div className="route-options-title">
              <span>AVAILABLE ROUTES</span>
              <small>{routeOptions.length} OPTIONS</small>
            </div>

            <div className="route-options">
              {routeOptions.map((route) => (
                <button
                  type="button"
                  key={route.id}
                  className={`route-choice ${
                    selectedRoute.id === route.id ? "active" : ""
                  }`}
                  onClick={() => analyzeRoute(route)}
                >
                  <div>
                    <span>0{route.id}</span>
                    <strong>{route.name}</strong>
                  </div>

                  <div className="route-choice-time">
                    <strong>{route.duration}</strong>
                    <small>{route.distance}</small>
                  </div>
                </button>
              ))}
            </div>

            <div className="fuel-summary">
              <div>
                <span>ESTIMATED FUEL</span>
                <strong>{estimatedFuel} L</strong>
              </div>

              <div>
                <span>MILEAGE</span>
                <strong>{mileage} KM/L</strong>
              </div>
            </div>

            <button
              type="button"
              className="create-ride-button"
              onClick={createRide}
            >
              {planned ? "RIDE CREATED ✓" : "CREATE RIDE PLAN"}
              <span>→</span>
            </button>

            <small className="demo-note">
              Demo planning data • Real maps, weather and fuel data will be
              connected through APIs.
            </small>
          </aside>
        </div>

        <div className="planner-flow">
          <div className="flow-item active">
            <span>01</span>
            <strong>PLAN</strong>
          </div>

          <div className="flow-line" />

          <div className="flow-item">
            <span>02</span>
            <strong>CONNECT</strong>
          </div>

          <div className="flow-line" />

          <div className="flow-item">
            <span>03</span>
            <strong>RIDE</strong>
          </div>

          <div className="flow-line" />

          <div className="flow-item">
            <span>04</span>
            <strong>RECORD</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RidePlanner;