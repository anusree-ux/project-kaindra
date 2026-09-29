import { useEffect, useMemo, useState } from "react";
import "./LiveRiderMap.css";

const STORAGE_KEY = "mototribe_live_rider_map";

const INITIAL_RIDERS = [
  {
    id: "live-001",
    name: "You",
    bike: "Royal Enfield Himalayan",
    role: "YOU",
    status: "RIDING",
    location: "Near Chittoor",
    speed: 62,
    distanceCovered: 118,
    totalDistance: 275,
    eta: "2h 14m",
    visibility: "RIDE_GROUP",
    x: 31,
    y: 58,
  },
  {
    id: "live-002",
    name: "Arjun",
    bike: "KTM Adventure 390",
    role: "RIDER",
    status: "RIDING",
    location: "Near Vellore",
    speed: 68,
    distanceCovered: 142,
    totalDistance: 275,
    eta: "1h 52m",
    visibility: "RIDE_GROUP",
    x: 47,
    y: 48,
  },
  {
    id: "live-003",
    name: "Meera",
    bike: "Yamaha MT-15",
    role: "RIDER",
    status: "RESTING",
    location: "Fuel stop",
    speed: 0,
    distanceCovered: 96,
    totalDistance: 275,
    eta: "2h 48m",
    visibility: "RIDE_GROUP",
    x: 59,
    y: 42,
  },
  {
    id: "live-004",
    name: "Vikram",
    bike: "Royal Enfield Classic 350",
    role: "ORGANIZER",
    status: "RIDING",
    location: "Near Ranipet",
    speed: 55,
    distanceCovered: 151,
    totalDistance: 275,
    eta: "1h 45m",
    visibility: "RIDE_GROUP",
    x: 69,
    y: 36,
  },
  {
    id: "live-005",
    name: "Kiran",
    bike: "Bajaj Dominar 400",
    role: "RIDER",
    status: "OFFLINE",
    location: "Last seen 12 min ago",
    speed: 0,
    distanceCovered: 71,
    totalDistance: 275,
    eta: "--",
    visibility: "CONNECTIONS",
    x: 78,
    y: 28,
  },
];

const VISIBILITY_OPTIONS = [
  {
    value: "PRIVATE",
    label: "PRIVATE",
    description: "Only you can see your live location.",
  },
  {
    value: "RIDE_GROUP",
    label: "RIDE GROUP",
    description: "Visible to members of this ride.",
  },
  {
    value: "CONNECTIONS",
    label: "CONNECTIONS",
    description: "Visible to your MotoTribe connections.",
  },
];

function loadRiders() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return INITIAL_RIDERS;
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return INITIAL_RIDERS;
    }

    return parsed;
  } catch {
    return INITIAL_RIDERS;
  }
}

function LiveRiderMap() {
  return <LiveRiderMapContent key="live-rider-map" />;
}

function LiveRiderMapContent() {
  const [riders, setRiders] = useState(loadRiders);
  const [selectedRiderId, setSelectedRiderId] = useState("live-001");
  const [visibility, setVisibility] = useState("RIDE_GROUP");
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(riders)
      );
    } catch {
      // Ignore storage errors in demo mode.
    }
  }, [riders]);

  useEffect(() => {
    if (!autoRefresh) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setRiders((currentRiders) =>
        currentRiders.map((rider) => {
          if (rider.status !== "RIDING") {
            return rider;
          }

          const nextDistance = Math.min(
            rider.distanceCovered + 0.4,
            rider.totalDistance
          );

          return {
            ...rider,
            distanceCovered: Number(
              nextDistance.toFixed(1)
            ),
            speed:
              rider.id === "live-001"
                ? Math.max(
                    45,
                    Math.min(72, rider.speed + (Math.random() > 0.5 ? 1 : -1))
                  )
                : rider.speed,
          };
        })
      );

      setLastUpdated(new Date());
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [autoRefresh]);

  const selectedRider = useMemo(
    () =>
      riders.find(
        (rider) => rider.id === selectedRiderId
      ) || riders[0],
    [riders, selectedRiderId]
  );

  const activeRiders = riders.filter(
    (rider) => rider.status === "RIDING"
  );

  const restingRiders = riders.filter(
    (rider) => rider.status === "RESTING"
  );

  const offlineRiders = riders.filter(
    (rider) => rider.status === "OFFLINE"
  );

  const showNotice = (message) => {
    setNotice(message);

    window.setTimeout(() => {
      setNotice("");
    }, 2200);
  };

  const handleTrackingToggle = () => {
    const nextValue = !trackingEnabled;

    setTrackingEnabled(nextValue);

    setRiders((currentRiders) =>
      currentRiders.map((rider) =>
        rider.id === "live-001"
          ? {
              ...rider,
              status: nextValue ? "RIDING" : "OFFLINE",
              visibility: nextValue
                ? visibility
                : "PRIVATE",
            }
          : rider
      )
    );

    showNotice(
      nextValue
        ? "Live location tracking enabled."
        : "Live location tracking paused."
    );
  };

  const handleVisibilityChange = (value) => {
    setVisibility(value);

    setRiders((currentRiders) =>
      currentRiders.map((rider) =>
        rider.id === "live-001"
          ? {
              ...rider,
              visibility: value,
            }
          : rider
      )
    );

    showNotice(
      `Location visibility changed to ${value.replace(
        "_",
        " "
      )}.`
    );
  };

  const handleResetDemo = () => {
    setRiders(INITIAL_RIDERS);
    setSelectedRiderId("live-001");
    setVisibility("RIDE_GROUP");
    setTrackingEnabled(true);
    setLastUpdated(new Date());

    showNotice("Live rider demo reset.");
  };

  const getProgress = (rider) => {
    if (!rider.totalDistance) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (rider.distanceCovered /
          rider.totalDistance) *
          100
      )
    );
  };

  return (
    <section className="live-rider-map-section">
      <div className="live-rider-map-container">

        {/* HEADER */}

        <header className="live-rider-map-header">
          <div>
            <span className="live-rider-eyebrow">
              MOTOTRIBE / LIVE JOURNEY
            </span>

            <h2>LIVE RIDER TRACKING</h2>

            <p>
              Follow your riding group, monitor journey
              progress and control live-location visibility.
            </p>
          </div>

          <div className="live-rider-header-actions">
            <button
              type="button"
              className={`live-refresh-button ${
                autoRefresh ? "active" : ""
              }`}
              onClick={() =>
                setAutoRefresh((current) => !current)
              }
            >
              <span
                className="live-refresh-dot"
              />
              {autoRefresh
                ? "LIVE SYNC ON"
                : "LIVE SYNC OFF"}
            </button>

            <button
              type="button"
              className="live-reset-button"
              onClick={handleResetDemo}
            >
              RESET DEMO
            </button>
          </div>
        </header>

        {/* STATS */}

        <div className="live-rider-stats">

          <div className="live-stat-card">
            <span>ACTIVE RIDERS</span>
            <strong>{activeRiders.length}</strong>
          </div>

          <div className="live-stat-card">
            <span>RESTING</span>
            <strong>{restingRiders.length}</strong>
          </div>

          <div className="live-stat-card">
            <span>OFFLINE</span>
            <strong>{offlineRiders.length}</strong>
          </div>

          <div className="live-stat-card">
            <span>GROUP DISTANCE</span>
            <strong>275 KM</strong>
          </div>

        </div>

        {/* MAIN GRID */}

        <div className="live-rider-map-grid">

          {/* MAP */}

          <div className="live-map-panel">

            <div className="live-map-toolbar">
              <div>
                <span>LIVE ROUTE</span>
                <strong>
                  Bengaluru → Chittoor → Vellore
                </strong>
              </div>

              <div className="live-map-updated">
                UPDATED{" "}
                {lastUpdated.toLocaleTimeString(
                  "en-IN",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  }
                )}
              </div>
            </div>

            <div className="live-map">

              <div className="map-grid-lines" />

              <div className="map-road map-road-one" />
              <div className="map-road map-road-two" />
              <div className="map-road map-road-three" />

              <div className="map-city map-city-one">
                BENGALURU
              </div>

              <div className="map-city map-city-two">
                CHITTOOR
              </div>

              <div className="map-city map-city-three">
                VELLORE
              </div>

              <div className="map-route-line" />

              <div className="map-start-marker">
                A
              </div>

              <div className="map-destination-marker">
                B
              </div>

              {riders.map((rider) => (
                <button
                  type="button"
                  key={rider.id}
                  className={`live-rider-marker ${
                    rider.status.toLowerCase()
                  } ${
                    selectedRiderId === rider.id
                      ? "selected"
                      : ""
                  }`}
                  style={{
                    left: `${rider.x}%`,
                    top: `${rider.y}%`,
                  }}
                  onClick={() =>
                    setSelectedRiderId(rider.id)
                  }
                  aria-label={`Select ${rider.name}`}
                >
                  <span className="marker-pulse" />

                  <span className="marker-bike">
                    🏍
                  </span>
                </button>
              ))}

              <div className="map-demo-label">
                DEMO MAP
                <span>
                  REAL MAP PROVIDER LATER
                </span>
              </div>

            </div>

            <div className="live-map-legend">

              <span>
                <i className="legend-riding" />
                RIDING
              </span>

              <span>
                <i className="legend-resting" />
                RESTING
              </span>

              <span>
                <i className="legend-offline" />
                OFFLINE
              </span>

            </div>

          </div>

          {/* RIDER DETAILS */}

          <aside className="live-rider-side-panel">

            <div className="selected-rider-card">

              <div className="selected-rider-heading">
                <div className="selected-rider-avatar">
                  {selectedRider?.name
                    ?.charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <span>
                    {selectedRider?.role}
                  </span>

                  <h3>
                    {selectedRider?.name}
                  </h3>
                </div>
              </div>

              <div
                className={`selected-rider-status ${
                  selectedRider?.status?.toLowerCase()
                }`}
              >
                <span />
                {selectedRider?.status}
              </div>

              <div className="selected-rider-location">
                <span>CURRENT LOCATION</span>
                <strong>
                  {selectedRider?.location}
                </strong>
              </div>

              <div className="selected-rider-bike">
                <span>MOTORCYCLE</span>
                <strong>
                  {selectedRider?.bike}
                </strong>
              </div>

              <div className="selected-rider-metrics">

                <div>
                  <span>SPEED</span>
                  <strong>
                    {selectedRider?.speed || 0}
                    <small> KM/H</small>
                  </strong>
                </div>

                <div>
                  <span>ETA</span>
                  <strong>
                    {selectedRider?.eta}
                  </strong>
                </div>

              </div>

              <div className="rider-progress-section">

                <div>
                  <span>JOURNEY PROGRESS</span>
                  <strong>
                    {getProgress(selectedRider)}%
                  </strong>
                </div>

                <div className="rider-progress-bar">
                  <span
                    style={{
                      width: `${getProgress(
                        selectedRider
                      )}%`,
                    }}
                  />
                </div>

                <small>
                  {selectedRider?.distanceCovered} KM
                  {" "}
                  /{" "}
                  {selectedRider?.totalDistance} KM
                </small>

              </div>

            </div>

            {/* TRACKING */}

            <div className="live-control-card">

              <div className="live-control-heading">
                <span>01</span>
                <h3>MY LIVE LOCATION</h3>
              </div>

              <div className="tracking-toggle-row">

                <div>
                  <strong>
                    LOCATION TRACKING
                  </strong>

                  <small>
                    {trackingEnabled
                      ? "Your live location is active."
                      : "Your live location is paused."}
                  </small>
                </div>

                <button
                  type="button"
                  className={`tracking-toggle ${
                    trackingEnabled
                      ? "enabled"
                      : ""
                  }`}
                  onClick={
                    handleTrackingToggle
                  }
                  aria-pressed={trackingEnabled}
                >
                  <span />
                </button>

              </div>

            </div>

            {/* PRIVACY */}

            <div className="live-control-card">

              <div className="live-control-heading">
                <span>02</span>
                <h3>LOCATION VISIBILITY</h3>
              </div>

              <div className="visibility-options">

                {VISIBILITY_OPTIONS.map(
                  (option) => (
                    <button
                      type="button"
                      key={option.value}
                      className={`visibility-option ${
                        visibility ===
                        option.value
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleVisibilityChange(
                          option.value
                        )
                      }
                    >
                      <div>
                        <strong>
                          {option.label}
                        </strong>

                        <small>
                          {option.description}
                        </small>
                      </div>

                      <span>
                        {visibility ===
                        option.value
                          ? "✓"
                          : ""}
                      </span>
                    </button>
                  )
                )}

              </div>

            </div>

          </aside>

        </div>

        {/* RIDER LIST */}

        <section className="live-rider-list-card">

          <div className="live-rider-list-heading">

            <div>
              <span>03</span>

              <div>
                <h3>RIDERS ON THIS JOURNEY</h3>

                <p>
                  Select a rider to view their
                  current journey information.
                </p>
              </div>
            </div>

            <strong>
              {riders.length} RIDERS
            </strong>

          </div>

          <div className="live-rider-list">

            {riders.map((rider) => (
              <button
                type="button"
                key={rider.id}
                className={`live-rider-list-item ${
                  selectedRiderId === rider.id
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setSelectedRiderId(rider.id)
                }
              >

                <div className="list-rider-avatar">
                  {rider.name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="list-rider-info">

                  <strong>{rider.name}</strong>

                  <span>
                    {rider.bike}
                  </span>

                </div>

                <div
                  className={`list-rider-status ${
                    rider.status.toLowerCase()
                  }`}
                >
                  <span />
                  {rider.status}
                </div>

                <div className="list-rider-progress">

                  <div>
                    <span>
                      {getProgress(rider)}%
                    </span>
                  </div>

                  <div className="mini-progress">
                    <span
                      style={{
                        width: `${getProgress(
                          rider
                        )}%`,
                      }}
                    />
                  </div>

                </div>

                <span className="list-rider-arrow">
                  →
                </span>

              </button>
            ))}

          </div>

        </section>

        {/* PRIVACY NOTICE */}

        <footer className="live-rider-privacy">

          <div>
            <span className="privacy-icon">
              🔒
            </span>

            <div>
              <strong>
                LOCATION PRIVACY
              </strong>

              <p>
                Exact location sharing is controlled
                by your visibility setting. In the
                production application, live tracking
                will use the approved realtime service
                and rider permissions.
              </p>
            </div>
          </div>

          <span className="privacy-source">
            FRONTEND DEMO · REALTIME API LATER
          </span>

        </footer>

        {notice && (
          <div
            className="live-rider-notice"
            role="status"
          >
            {notice}
          </div>
        )}

      </div>
    </section>
  );
}

export default LiveRiderMap;