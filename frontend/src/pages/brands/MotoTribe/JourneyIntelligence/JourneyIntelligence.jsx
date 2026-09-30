import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../../../context/AuthContext";
import apiClient from "../../../../services/apiClient";
import "./JourneyIntelligence.css";

function JourneyIntelligence() {
  const { isAuthenticated } = useAuth();
  const [rides, setRides] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routeStatus, setRouteStatus] = useState("loading"); // "loading" | "success" | "not_computed" | "error"
  const [showStops, setShowStops] = useState(true);
  const [selectedInfo, setSelectedInfo] = useState("weather");

  // Fetch all user rides & select active ride deterministically
  const fetchRides = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.get("/api/mototribe/rides");
      const fetchedRides = res.data?.data?.rides || [];

      // Sorting Priority:
      // 1. "ongoing" rides sorted by startDate ASC (soonest active)
      // 2. "planning" rides sorted by startDate ASC (soonest upcoming)
      const ongoingRides = fetchedRides
        .filter((r) => r.status === "ongoing")
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

      const planningRides = fetchedRides
        .filter((r) => r.status === "planning")
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

      const selected = ongoingRides[0] || planningRides[0] || null;

      setRides(fetchedRides);
      setActiveRide(selected);
    } catch {
      setRides([]);
      setActiveRide(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchRides();

    const handleRideCreated = () => {
      fetchRides();
    };

    window.addEventListener("mototribe:ride-created", handleRideCreated);
    return () => {
      window.removeEventListener("mototribe:ride-created", handleRideCreated);
    };
  }, [fetchRides]);

  // Fetch Weather & Route Info for selected active ride
  useEffect(() => {
    if (!activeRide?._id) return;

    const fetchRideDetails = async () => {
      // Fetch Weather
      try {
        const wRes = await apiClient.get(`/api/mototribe/rides/${activeRide._id}/weather`);
        setWeatherData(wRes.data?.data?.weather || null);
      } catch {
        setWeatherData(null);
      }

      // Fetch Route Info
      try {
        setRouteStatus("loading");
        const rRes = await apiClient.get(`/api/mototribe/rides/${activeRide._id}/route`);
        setRouteInfo(rRes.data?.data?.routeInfo || null);
        setRouteStatus("success");
      } catch (err) {
        if (err.response?.status === 404) {
          setRouteStatus("not_computed");
        } else {
          setRouteStatus("error");
        }
        setRouteInfo(null);
      }
    };

    fetchRideDetails();
  }, [activeRide]);

  // Format Origin / Destination strings
  const originName = useMemo(() => {
    if (!activeRide) return "";
    return typeof activeRide.origin === "object" ? activeRide.origin.name : activeRide.origin;
  }, [activeRide]);

  const destName = useMemo(() => {
    if (!activeRide) return "";
    return typeof activeRide.destination === "object" ? activeRide.destination.name : activeRide.destination;
  }, [activeRide]);

  // Dynamic Intelligence Metrics
  const intelligenceMetrics = useMemo(() => {
    const tempDisplay = weatherData?.temp !== undefined ? `${Math.round(weatherData.temp)}°C` : "--";
    const weatherDesc = weatherData?.description || "Live weather details";
    const statusText = weatherData?.main || "NORMAL";

    return [
      {
        id: "weather",
        icon: "◒",
        label: "WEATHER",
        value: tempDisplay,
        status: statusText.toUpperCase(),
        detail: weatherDesc,
      },
      {
        id: "route",
        icon: "╱",
        label: "ROUTE STATUS",
        value: routeStatus === "success" ? "COMPUTED" : "NOT COMPUTED",
        status: routeStatus === "success" ? "TRAFFIC AWARE" : "PENDING",
        detail: routeStatus === "success" ? "Route directions available" : "Compute route in Ride Planner to view turn guidance",
      },
      {
        id: "distance",
        icon: "≋",
        label: "DISTANCE",
        value: activeRide ? `${activeRide.distanceKm || 0} KM` : "--",
        status: activeRide?.durationDays ? `${activeRide.durationDays} DAY(S)` : "1 DAY",
        detail: "Total planned journey distance",
      },
      {
        id: "budget",
        icon: "⛽",
        label: "PLANNED BUDGET",
        value: activeRide?.budget ? `₹${activeRide.budget}` : "--",
        status: "ESTIMATED",
        detail: "Estimated trip expense budget",
      },
    ];
  }, [weatherData, activeRide, routeStatus]);

  const selectedData =
    intelligenceMetrics.find((item) => item.id === selectedInfo) ||
    intelligenceMetrics[0];

  return (
    <section id="journey-intelligence" className="journey-intelligence">
      <div className="journey-container">
        <div className="journey-heading">
          <div>
            <span className="journey-eyebrow">
              <span className="journey-eyebrow-line" />
              MOTO AI • JOURNEY INTELLIGENCE
            </span>

            <h2>
              KNOW THE ROAD
              <span>BEFORE YOU RIDE.</span>
            </h2>

            <p>
              MotoTribe combines real route data, weather analysis, and rider
              intelligence to help you make better decisions before every journey.
            </p>
          </div>

          <div className="journey-heading-status">
            <span className="status-pulse" />
            <div>
              <strong>INTELLIGENCE ONLINE</strong>
              <small>LIVE JOURNEY ANALYSIS</small>
            </div>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="journey-empty-state">
            <div className="empty-icon">🔒</div>
            <h3>AUTHENTICATION REQUIRED</h3>
            <p>Please log in to view your live journey intelligence and active routes.</p>
          </div>
        ) : loading ? (
          <div className="journey-empty-state">
            <div className="empty-spinner"></div>
            <h3>LOADING JOURNEY INTELLIGENCE...</h3>
            <p>Fetching active rides and live route data from backend.</p>
          </div>
        ) : !activeRide ? (
          <div className="journey-empty-state">
            <div className="empty-icon">🏍️</div>
            <h3>NO ACTIVE OR UPCOMING RIDES</h3>
            <p>You have no ongoing or upcoming planned rides. Create a ride in the Ride Planner to view active journey intelligence!</p>
          </div>
        ) : (
          <>
            <div className="journey-layout">
              <div className="journey-map-card">
                <div className="map-topbar">
                  <div>
                    <span className="status-badge">{activeRide.status.toUpperCase()} RIDE</span>
                    <strong>{activeRide.title}</strong>
                  </div>

                  <button
                    type="button"
                    className={`map-toggle ${showStops ? "active" : ""}`}
                    onClick={() => setShowStops(!showStops)}
                  >
                    <span />
                    ROUTE INTELLIGENCE
                  </button>
                </div>

                <div className="journey-map">
                  <div className="map-grid" />

                  <div className="mountain mountain-one" />
                  <div className="mountain mountain-two" />

                  {routeStatus === "not_computed" ? (
                    <div className="map-empty-overlay">
                      <div className="overlay-icon">🗺️</div>
                      <h4>NO ROUTE COMPUTED YET</h4>
                      <p>Compute the route in Ride Planner to display turn-by-turn steps and live path.</p>
                    </div>
                  ) : (
                    <div className="route-path">
                      <span className="route-node start-node">
                        <i>●</i>
                        <small>{originName.substring(0, 10).toUpperCase() || "START"}</small>
                      </span>

                      <span className="route-node destination-node">
                        <i>◎</i>
                        <small>{destName.substring(0, 10).toUpperCase() || "DEST"}</small>
                      </span>
                    </div>
                  )}

                  {showStops && routeInfo?.steps && (
                    <div className="map-stop-list">
                      {routeInfo.steps.slice(0, 4).map((step, idx) => (
                        <div className="map-stop" key={idx}>
                          <span className="map-stop-icon">📍</span>
                          <div>
                            <small>STEP {idx + 1}</small>
                            <strong>{step.html_instructions?.replace(/<[^>]*>?/gm, "").substring(0, 30) || "Turn"}</strong>
                            <p>{step.distance?.text || ""} • {step.duration?.text || ""}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="map-rider rider-one">
                    <span>●</span>
                    <small>RIDER</small>
                  </div>
                </div>

                <div className="map-bottom">
                  <div className="map-stat">
                    <span>DISTANCE</span>
                    <strong>{activeRide.distanceKm ? `${activeRide.distanceKm} KM` : "--"}</strong>
                  </div>

                  <div className="map-stat">
                    <span>DURATION</span>
                    <strong>{activeRide.durationDays ? `${activeRide.durationDays} DAYS` : "1 DAY"}</strong>
                  </div>

                  <div className="map-stat">
                    <span>STATUS</span>
                    <strong>{activeRide.status.toUpperCase()}</strong>
                  </div>

                  <div className="map-stat">
                    <span>WEATHER</span>
                    <strong>{weatherData?.temp !== undefined ? `${Math.round(weatherData.temp)}°C` : "--"}</strong>
                  </div>
                </div>
              </div>

              <aside className="journey-intelligence-panel">
                <div className="panel-header">
                  <div>
                    <span>AI ANALYSIS</span>
                    <h3>JOURNEY<br />INTELLIGENCE</h3>
                  </div>

                  <div className="panel-ai-mark">AI</div>
                </div>

                <div className="intelligence-grid">
                  {intelligenceMetrics.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={`intelligence-item ${
                        selectedInfo === item.id ? "active" : ""
                      }`}
                      onClick={() => setSelectedInfo(item.id)}
                    >
                      <div className="intelligence-icon">{item.icon}</div>

                      <div>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                        <small>{item.status}</small>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="selected-intelligence">
                  <div className="selected-info-header">
                    <span>{selectedData.label}</span>
                    <span className="verified-tag">LIVE</span>
                  </div>

                  <strong>{selectedData.value}</strong>

                  <p>{selectedData.detail}</p>
                </div>
              </aside>
            </div>

            {/* Ride Selector Tabs if multiple rides exist */}
            {rides.length > 1 && (
              <div className="route-selector">
                <div className="route-selector-heading">
                  <div>
                    <span>YOUR RIDES</span>
                    <h3>SELECT A RIDE TO INSPECT</h3>
                  </div>

                  <span className="route-count">
                    {rides.length} RIDES AVAILABLE
                  </span>
                </div>

                <div className="route-options">
                  {rides.map((ride) => (
                    <button
                      type="button"
                      key={ride._id}
                      className={`route-option ${
                        activeRide._id === ride._id ? "active" : ""
                      }`}
                      onClick={() => setActiveRide(ride)}
                    >
                      <div className="route-option-top">
                        <span>STATUS: {ride.status.toUpperCase()}</span>

                        {activeRide._id === ride._id && (
                          <span className="selected-route">SELECTED</span>
                        )}
                      </div>

                      <strong>{ride.title}</strong>

                      <div className="route-option-stats">
                        <span>{ride.distanceKm ? `${ride.distanceKm} KM` : ""}</span>
                        <span>{ride.durationDays ? `${ride.durationDays} Days` : ""}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default JourneyIntelligence;