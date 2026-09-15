import { useState } from "react";
import "./JourneyIntelligence.css";

const routes = [
  {
    id: 1,
    name: "Mountain Loop",
    distance: "186 KM",
    duration: "4H 32M",
    difficulty: "MODERATE",
    road: "DRY",
    traffic: "LOW",
    fuel: "GOOD",
    weather: "24°C",
    elevation: "+1,240 M",
  },
  {
    id: 2,
    name: "Scenic Ridge",
    distance: "214 KM",
    duration: "5H 05M",
    difficulty: "ADVENTURE",
    road: "MIXED",
    traffic: "LOW",
    fuel: "GOOD",
    weather: "22°C",
    elevation: "+1,680 M",
  },
  {
    id: 3,
    name: "Valley Express",
    distance: "162 KM",
    duration: "3H 48M",
    difficulty: "EASY",
    road: "DRY",
    traffic: "MEDIUM",
    fuel: "CHECK",
    weather: "26°C",
    elevation: "+620 M",
  },
];

const intelligenceData = [
  {
    id: "weather",
    icon: "◒",
    label: "WEATHER",
    value: "24°C",
    status: "CLEAR",
    detail: "Clear skies expected",
  },
  {
    id: "traffic",
    icon: "≋",
    label: "TRAFFIC",
    value: "LOW",
    status: "+12 MIN",
    detail: "Light traffic on route",
  },
  {
    id: "fuel",
    icon: "⛽",
    label: "FUEL",
    value: "82%",
    status: "GOOD",
    detail: "Next fuel stop in 74 KM",
  },
  {
    id: "road",
    icon: "╱",
    label: "ROAD",
    value: "SAFE",
    status: "DRY",
    detail: "Road conditions look good",
  },
];

const routeStops = [
  {
    type: "START",
    title: "BENGALURU",
    detail: "Your starting point",
    icon: "●",
  },
  {
    type: "FUEL",
    title: "FUEL STOP",
    detail: "74 KM • Recommended",
    icon: "⛽",
  },
  {
    type: "CAFE",
    title: "RIDERS CAFE",
    detail: "112 KM • 4.8 ★",
    icon: "☕",
  },
  {
    type: "SCENIC",
    title: "MOUNTAIN VIEW",
    detail: "148 KM • Rider reported",
    icon: "◆",
  },
  {
    type: "DESTINATION",
    title: "MOUNTAIN LOOP",
    detail: "186 KM • Destination",
    icon: "◎",
  },
];

function JourneyIntelligence() {
  const [selectedRoute, setSelectedRoute] = useState(routes[0]);
  const [selectedInfo, setSelectedInfo] = useState("weather");
  const [showStops, setShowStops] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(true);

  const handleRouteChange = (route) => {
    setSelectedRoute(route);
    setAnalyzing(true);
    setAnalysisComplete(false);

    setTimeout(() => {
      setAnalyzing(false);
      setAnalysisComplete(true);
    }, 900);
  };

  const selectedData =
    intelligenceData.find((item) => item.id === selectedInfo) ||
    intelligenceData[0];

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
              MotoTribe combines maps, rider experience, live conditions and
              intelligent analysis to help you make better decisions before
              every journey.
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

        <div className="journey-layout">
          <div className="journey-map-card">
            <div className="map-topbar">
              <div>
                <span>ACTIVE JOURNEY</span>
                <strong>{selectedRoute.name}</strong>
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
              <div className="mountain mountain-three" />

              <div className="route-glow route-glow-one" />
              <div className="route-glow route-glow-two" />

              <div className="route-path">
                <span className="route-node start-node">
                  <i>●</i>
                  <small>START</small>
                </span>

                <span className="route-node fuel-node">
                  <i>⛽</i>
                  <small>FUEL</small>
                </span>

                <span className="route-node cafe-node">
                  <i>☕</i>
                  <small>CAFE</small>
                </span>

                <span className="route-node scenic-node">
                  <i>◆</i>
                  <small>SCENIC</small>
                </span>

                <span className="route-node destination-node">
                  <i>◎</i>
                  <small>DEST.</small>
                </span>
              </div>

              {showStops && (
                <div className="map-stop-list">
                  {routeStops.map((stop) => (
                    <div className="map-stop" key={stop.title}>
                      <span className="map-stop-icon">{stop.icon}</span>
                      <div>
                        <small>{stop.type}</small>
                        <strong>{stop.title}</strong>
                        <p>{stop.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="map-rider rider-one">
                <span>●</span>
                <small>RIDER 01</small>
              </div>

              <div className="map-rider rider-two">
                <span>●</span>
                <small>RIDER 02</small>
              </div>

              <div className="map-warning">
                <span>!</span>
                <div>
                  <strong>RIDER REPORT</strong>
                  <small>Sharp turn ahead • 8 KM</small>
                </div>
              </div>

              {analyzing && (
                <div className="map-analysis">
                  <div className="analysis-spinner" />
                  ANALYZING ROUTE...
                </div>
              )}
            </div>

            <div className="map-bottom">
              <div className="map-stat">
                <span>DISTANCE</span>
                <strong>{selectedRoute.distance}</strong>
              </div>

              <div className="map-stat">
                <span>TIME</span>
                <strong>{selectedRoute.duration}</strong>
              </div>

              <div className="map-stat">
                <span>DIFFICULTY</span>
                <strong>{selectedRoute.difficulty}</strong>
              </div>

              <div className="map-stat">
                <span>ELEVATION</span>
                <strong>{selectedRoute.elevation}</strong>
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
              {intelligenceData.map((item) => (
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

              <div className="confidence">
                <div className="confidence-label">
                  <span>CONFIDENCE</span>
                  <strong>94%</strong>
                </div>

                <div className="confidence-bar">
                  <span />
                </div>
              </div>
            </div>

            <div className="ai-recommendation">
              <div className="recommendation-icon">✦</div>

              <div>
                <span>MOTO AI RECOMMENDS</span>
                <p>
                  Leave around <strong>07:30 AM</strong> to avoid heavier
                  traffic and reach the mountain section before midday.
                </p>
              </div>
            </div>

            <div className="data-sources">
              <span>DATA SOURCES</span>

              <div>
                <b>MAP</b>
                <b>RIDER REPORTS</b>
                <b>AI</b>
                <b>WEATHER</b>
              </div>
            </div>
          </aside>
        </div>

        <div className="route-selector">
          <div className="route-selector-heading">
            <div>
              <span>COMPARE YOUR OPTIONS</span>
              <h3>CHOOSE YOUR ROUTE.</h3>
            </div>

            <span className="route-count">
              {routes.length} ROUTES ANALYZED
            </span>
          </div>

          <div className="route-options">
            {routes.map((route) => (
              <button
                type="button"
                key={route.id}
                className={`route-option ${
                  selectedRoute.id === route.id ? "active" : ""
                }`}
                onClick={() => handleRouteChange(route)}
              >
                <div className="route-option-top">
                  <span>ROUTE 0{route.id}</span>

                  {selectedRoute.id === route.id && (
                    <span className="selected-route">SELECTED</span>
                  )}
                </div>

                <strong>{route.name}</strong>

                <div className="route-option-stats">
                  <span>{route.distance}</span>
                  <span>{route.duration}</span>
                  <span>{route.difficulty}</span>
                </div>

                <div className="route-option-condition">
                  <span>
                    <i /> {route.road}
                  </span>

                  <span>
                    TRAFFIC <b>{route.traffic}</b>
                  </span>

                  <span>
                    FUEL <b>{route.fuel}</b>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className={`analysis-status ${analysisComplete ? "complete" : ""}`}>
          <div className="analysis-status-left">
            <span className="analysis-status-icon">✦</span>

            <div>
              <strong>
                {analysisComplete
                  ? "JOURNEY ANALYSIS COMPLETE"
                  : "ANALYZING YOUR JOURNEY"}
              </strong>

              <small>
                {analysisComplete
                  ? "Route intelligence updated with available rider and map data."
                  : "Checking route conditions, services and journey factors..."}
              </small>
            </div>
          </div>

          <div className="analysis-status-right">
            <span>ROUTE SCORE</span>
            <strong>{selectedRoute.id === 3 ? "87" : "94"}/100</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default JourneyIntelligence;