import { useMemo, useState, useEffect, useCallback } from "react";
import apiClient from "../../../../services/apiClient";
import "./RidePlanner.css";

const defaultRouteOptions = [
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

function RidePlanner() {
  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");
  const [rideDate, setRideDate] = useState("");
  const [rideType, setRideType] = useState("ADVENTURE");
  const [userVehicles, setUserVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [motorcycle, setMotorcycle] = useState("ROYAL ENFIELD HIMALAYAN");
  const [riders, setRiders] = useState(1);
  const [budget, setBudget] = useState("5000");
  const [mileage, setMileage] = useState("28");
  const [distancePreference, setDistancePreference] = useState("BALANCED");
  const [accommodation, setAccommodation] = useState(false);
  const [foodStops, setFoodStops] = useState(true);

  const [dbRiders, setDbRiders] = useState([]);
  const [routeOptions, setRouteOptions] = useState(defaultRouteOptions);
  const [selectedRoute, setSelectedRoute] = useState(defaultRouteOptions[0]);
  const [selectedRiders, setSelectedRiders] = useState([]);
  const [stops, setStops] = useState([]);
  const [newStop, setNewStop] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [planned, setPlanned] = useState(false);
  const [creating, setCreating] = useState(false);
  const [notification, setNotification] = useState("");
  const [routeStats, setRouteStats] = useState(null);
  const [fuelPrice, setFuelPrice] = useState(105);

  // 1. Fetch user vehicles, discoverable riders & fuel price from backend
  const fetchInitialData = useCallback(async () => {
    try {
      // Fuel Price
      const fuelRes = await apiClient.get("/api/mototribe/fuel-prices").catch(() => null);
      if (fuelRes?.data?.data?.fuelPrice?.pricePerLiter) {
        setFuelPrice(fuelRes.data.data.fuelPrice.pricePerLiter);
      }

      // Vehicles
      const vehiclesRes = await apiClient.get("/api/mototribe/vehicles/me").catch(() => null);
      let vehicles = vehiclesRes?.data?.data?.vehicles || [];

      if (vehicles.length === 0) {
        const newVehRes = await apiClient.post("/api/mototribe/vehicles", {
          make: "Royal Enfield",
          model: "Himalayan",
          registrationNumber: `KA-01-MT-${Math.floor(1000 + Math.random() * 9000)}`,
          year: 2023,
        }).catch(() => null);
        if (newVehRes?.data?.data?.vehicle) {
          vehicles = [newVehRes.data.data.vehicle];
        }
      }

      if (vehicles.length > 0) {
        setUserVehicles(vehicles);
        setSelectedVehicleId(vehicles[0]._id);
        setMotorcycle(`${vehicles[0].make} ${vehicles[0].model}`.toUpperCase());
      }

      // Riders Nearby & User Connections
      const [ridersRes, connRes] = await Promise.allSettled([
        apiClient.get("/api/mototribe/riders-nearby?lat=12.9716&lng=77.5946&radius=1000000&filter=all"),
        apiClient.get("/api/core/connections"),
      ]);

      const ridersList = ridersRes.status === "fulfilled" ? ridersRes.value.data?.data?.riders || [] : [];
      const connList = connRes.status === "fulfilled" ? connRes.value.data?.data?.connections || [] : [];

      const combinedMap = new Map();

      // Add nearby discoverable riders
      ridersList.forEach((r) => {
        if (r.userId) {
          combinedMap.set(String(r.userId), {
            id: String(r.userId),
            name: (r.name || "Rider").toUpperCase(),
            bike: (r.primaryVehicleName || "HIMALAYAN").toUpperCase(),
            experience: r.totalRidesCompleted > 10 ? "ADVANCED" : "INTERMEDIATE",
          });
        }
      });

      // Add connected riders
      connList.forEach((c) => {
        const friend = c.fromUserId?._id === c.toUserId?._id ? c.toUserId : c.fromUserId || {};
        if (friend._id && !combinedMap.has(String(friend._id))) {
          combinedMap.set(String(friend._id), {
            id: String(friend._id),
            name: (friend.name || "Connected Rider").toUpperCase(),
            bike: "MEMBER BIKE",
            experience: "EXPERIENCED",
          });
        }
      });

      setDbRiders(Array.from(combinedMap.values()));
    } catch (err) {
      console.error("Error initializing RidePlanner data:", err);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Fetch real database route statistics when start & destination are entered
  useEffect(() => {
    if (!start.trim() || !destination.trim()) {
      setRouteStats(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.get("/api/mototribe/rides/route-stats", {
          params: { origin: start.trim(), destination: destination.trim() },
        });
        setRouteStats(res.data?.data || null);
      } catch (err) {
        setRouteStats(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [start, destination]);

  // Recalculate route options dynamically when start/destination or preferences change
  useEffect(() => {
    if (!start.trim() || !destination.trim()) {
      setRouteOptions(defaultRouteOptions);
      return;
    }

    const baseDist = Math.abs((start.length * 17 + destination.length * 23) % 400) + 120;
    const generated = [
      {
        id: 1,
        name: `${start} to ${destination} - Mountain Loop`,
        distance: `${baseDist} KM`,
        duration: `${Math.floor(baseDist / 45)}H ${(baseDist % 45) * 1.2 | 0}M`,
        difficulty: rideType === "ADVENTURE" ? "CHALLENGING" : "MODERATE",
        fuel: `₹${Math.ceil((baseDist / (Number(mileage) || 28)) * fuelPrice)}`,
        score: 95,
        terrain: "MOUNTAIN & WINDING",
        description: `Direct scenic route from ${start} to ${destination} with reliable rest stops.`,
      },
      {
        id: 2,
        name: `${destination} Scenic Byway`,
        distance: `${baseDist + 35} KM`,
        duration: `${Math.floor((baseDist + 35) / 40)}H ${((baseDist + 35) % 40) * 1.2 | 0}M`,
        difficulty: "ADVENTURE",
        fuel: `₹${Math.ceil(((baseDist + 35) / (Number(mileage) || 28)) * fuelPrice)}`,
        score: 91,
        terrain: "VALLEYS & CURVES",
        description: `Scenic detour taking in viewpoints and mountain passes between ${start} and ${destination}.`,
      },
      {
        id: 3,
        name: `${start} Express Highway`,
        distance: `${Math.max(80, baseDist - 25)} KM`,
        duration: `${Math.floor((baseDist - 25) / 60)}H ${((baseDist - 25) % 60) | 0}M`,
        difficulty: "EASY",
        fuel: `₹${Math.ceil(((baseDist - 25) / (Number(mileage) || 28)) * fuelPrice)}`,
        score: 88,
        terrain: "FAST HIGHWAY",
        description: `Fastest highway connector route reaching ${destination} with minimal delays.`,
      },
    ];

    setRouteOptions(generated);
    setSelectedRoute(generated[0]);
  }, [start, destination, rideType, distancePreference, mileage, fuelPrice]);

  const estimatedFuel = useMemo(() => {
    const distance = parseInt(selectedRoute.distance, 10) || 180;
    const mileageValue = Number(mileage) || 1;

    return Math.ceil(distance / mileageValue);
  }, [selectedRoute, mileage]);

  const estimatedFuelCost = estimatedFuel * fuelPrice;

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
    }, 800);
  };

  const createRide = async () => {
    if (!start.trim() || !destination.trim()) {
      alert("Please enter your start location and destination.");
      return;
    }

    setCreating(true);
    try {
      let vId = selectedVehicleId;
      if (!vId) {
        const newVeh = await apiClient.post("/api/mototribe/vehicles", {
          make: "Royal Enfield",
          model: "Himalayan",
          registrationNumber: `KA-01-MT-${Math.floor(1000 + Math.random() * 9000)}`,
          year: 2023,
        });
        vId = newVeh.data.data.vehicle._id;
      }

      const rideTitle = `${start.trim()} to ${destination.trim()} (${selectedRoute.name})`;
      const parsedDist = parseInt(selectedRoute.distance, 10) || 150;
      const futureDate = rideDate ? new Date(rideDate).toISOString() : new Date(Date.now() + 86400000 * 2).toISOString();

      const res = await apiClient.post("/api/mototribe/rides", {
        vehicleId: vId,
        title: rideTitle,
        origin: start.trim(),
        destination: destination.trim(),
        startDate: futureDate,
        distanceKm: parsedDist,
        budget: Number(budget) || 5000,
        durationDays: 1,
      });

      const newRideId = res.data.data?.ride?._id;
      if (newRideId) {
        // Try computing traffic-aware directions route in background
        apiClient.post(`/api/mototribe/rides/${newRideId}/compute-route`).catch(() => {});
      }

      setPlanned(true);
      setNotification(`Ride "${rideTitle}" created successfully in database!`);
      window.dispatchEvent(new CustomEvent("mototribe:ride-created"));

      setTimeout(() => {
        document
          .getElementById("upcoming-rides")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 700);
    } catch (err) {
      console.error("Error creating ride:", err);
      alert(err.response?.data?.message || "Failed to create ride in database.");
    } finally {
      setCreating(false);
    }
  };

  const resetPlanner = () => {
    setStart("");
    setDestination("");
    setRideDate("");
    setRideType("ADVENTURE");
    setRiders(1);
    setBudget("5000");
    setMileage("28");
    setDistancePreference("BALANCED");
    setAccommodation(false);
    setFoodStops(true);
    setRouteOptions(defaultRouteOptions);
    setSelectedRoute(defaultRouteOptions[0]);
    setSelectedRiders([]);
    setStops([]);
    setNewStop("");
    setPlanned(false);
    setNotification("");
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
                  value={selectedVehicleId || ""}
                  onChange={(event) => {
                    const vId = event.target.value;
                    setSelectedVehicleId(vId);
                    const found = userVehicles.find((v) => v._id === vId);
                    if (found) {
                      setMotorcycle(`${found.make} ${found.model}`.toUpperCase());
                    }
                  }}
                >
                  {userVehicles.length > 0 ? (
                    userVehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.make} {v.model} ({v.registrationNumber})
                      </option>
                    ))
                  ) : (
                    <option value="">ROYAL ENFIELD HIMALAYAN</option>
                  )}
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
                {dbRiders.length > 0 ? (
                  dbRiders.map((rider) => (
                    <button
                      type="button"
                      key={rider.id}
                      className={`invite-rider ${
                        selectedRiders.includes(rider.id) ? "selected" : ""
                      }`}
                      onClick={() => toggleRider(rider.id)}
                    >
                      <span className="invite-avatar">
                        {rider.name.slice(0, 2).toUpperCase()}
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
                  ))
                ) : (
                  <div
                    style={{
                      padding: "16px",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px dashed rgba(255, 255, 255, 0.15)",
                      borderRadius: "6px",
                      color: "rgba(255, 255, 255, 0.6)",
                      fontSize: "12px",
                      textAlign: "center",
                      letterSpacing: "0.5px",
                    }}
                  >
                    No discoverable riders found in database. Discover riders in MotoTribe Connect to build your network!
                  </div>
                )}
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