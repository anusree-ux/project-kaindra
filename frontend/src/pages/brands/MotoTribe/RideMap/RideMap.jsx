import { useEffect, useMemo, useState } from "react";
import "./RideMap.css";

const DEMO_RIDERS = [
  {
    id: "rider-001",
    name: "You",
    initials: "YO",
    latitude: 14.6819,
    longitude: 77.6006,
    distance: 0,
    status: "ONLINE",
    speed: 62,
    lastUpdated: "Now",
    isYou: true,
  },
  {
    id: "rider-002",
    name: "Arjun",
    initials: "AR",
    latitude: 14.6864,
    longitude: 77.6062,
    distance: 0.82,
    status: "ONLINE",
    speed: 58,
    lastUpdated: "12 sec ago",
    isYou: false,
  },
  {
    id: "rider-003",
    name: "Rahul",
    initials: "RA",
    latitude: 14.6761,
    longitude: 77.5951,
    distance: 1.14,
    status: "ONLINE",
    speed: 55,
    lastUpdated: "24 sec ago",
    isYou: false,
  },
  {
    id: "rider-004",
    name: "Vikram",
    initials: "VI",
    latitude: 14.6908,
    longitude: 77.5984,
    distance: 1.73,
    status: "MOVING",
    speed: 51,
    lastUpdated: "31 sec ago",
    isYou: false,
  },
  {
    id: "rider-005",
    name: "Kiran",
    initials: "KI",
    latitude: 14.6734,
    longitude: 77.6093,
    distance: 2.08,
    status: "OFFLINE",
    speed: 0,
    lastUpdated: "3 min ago",
    isYou: false,
  },
];

const ROUTE_CHECKPOINTS = [
  {
    id: "checkpoint-1",
    name: "Starting Point",
    distance: 0,
    status: "COMPLETED",
  },
  {
    id: "checkpoint-2",
    name: "First Checkpoint",
    distance: 18,
    status: "CURRENT",
  },
  {
    id: "checkpoint-3",
    name: "Fuel Stop",
    distance: 42,
    status: "UPCOMING",
  },
  {
    id: "checkpoint-4",
    name: "Destination",
    distance: 78,
    status: "UPCOMING",
  },
];

function getRiderStatusClass(status) {
  return status.toLowerCase();
}

function RideMap({ ride }) {
  const [riders, setRiders] =
    useState(DEMO_RIDERS);

  const [selectedRiderId, setSelectedRiderId] =
    useState("rider-001");

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [isNavigating, setIsNavigating] =
    useState(false);

  const [routeProgress, setRouteProgress] =
    useState(23);

  const [notice, setNotice] = useState("");

  const selectedRider = useMemo(
    () =>
      riders.find(
        (rider) =>
          rider.id === selectedRiderId
      ),
    [riders, selectedRiderId]
  );

  const onlineRiders = useMemo(
    () =>
      riders.filter(
        (rider) =>
          rider.status !== "OFFLINE"
      ).length,
    [riders]
  );

  const distanceRemaining = Math.max(
    0,
    78 - (78 * routeProgress) / 100
  );

  const estimatedMinutes = Math.max(
    1,
    Math.round(distanceRemaining / 0.9)
  );

  const refreshRiders = () => {
    setIsRefreshing(true);
    setNotice("");

    setTimeout(() => {
      setRiders((previousRiders) =>
        previousRiders.map((rider) => {
          if (
            rider.status === "OFFLINE"
          ) {
            return rider;
          }

          const speedChange =
            Math.floor(
              Math.random() * 7
            ) - 3;

          return {
            ...rider,
            speed: Math.max(
              0,
              rider.speed + speedChange
            ),
            lastUpdated: rider.isYou
              ? "Now"
              : "Just now",
          };
        })
      );

      setIsRefreshing(false);

      setNotice(
        "Rider locations refreshed."
      );
    }, 700);
  };

  const centerOnMe = () => {
    setSelectedRiderId("rider-001");

    setNotice(
      "Map centered on your location."
    );
  };

  const startNavigation = () => {
    setIsNavigating(true);
    setNotice(
      "Navigation started for the active route."
    );
  };

  const stopNavigation = () => {
    setIsNavigating(false);

    setNotice(
      "Navigation stopped."
    );
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setRiders((previousRiders) =>
        previousRiders.map((rider) => {
          if (
            rider.status === "OFFLINE" ||
            rider.isYou
          ) {
            return rider;
          }

          return {
            ...rider,
            lastUpdated: "Just now",
          };
        })
      );
    }, 15000);

    return () =>
      clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isNavigating) {
      return;
    }

    const timer = setInterval(() => {
      setRouteProgress((previous) => {
        if (previous >= 100) {
          setIsNavigating(false);
          return 100;
        }

        return Math.min(
          100,
          previous + 0.5
        );
      });
    }, 3000);

    return () =>
      clearInterval(timer);
  }, [isNavigating]);

  return (
    <section className="ride-map-card">
      <div className="ride-map-header">
        <div className="ride-map-heading">
          <span className="ride-map-eyebrow">
            LIVE RIDE / RIDER MAP
          </span>

          <h2>
            GROUP RIDER POSITIONS
          </h2>

          <p>
            Monitor rider positions, route progress,
            and navigation status during the active ride.
          </p>
        </div>

        <div className="ride-map-live-status">
          <span />

          <strong>LIVE</strong>

          <small>
            {onlineRiders} riders online
          </small>
        </div>
      </div>

      <div className="ride-map-toolbar">
        <div className="ride-map-ride-info">
          <span>ACTIVE RIDE</span>

          <strong>
            {ride?.name ||
              "MotoTribe Live Ride"}
          </strong>
        </div>

        <div className="ride-map-toolbar-actions">
          <button
            type="button"
            onClick={centerOnMe}
          >
            CENTER ON ME
          </button>

          <button
            type="button"
            onClick={refreshRiders}
            disabled={isRefreshing}
          >
            {isRefreshing
              ? "REFRESHING..."
              : "REFRESH"}
          </button>
        </div>
      </div>

      <div className="ride-map-navigation">
        <div className="ride-map-navigation-heading">
          <div>
            <span>ROUTE PROGRESS</span>

            <strong>
              {routeProgress.toFixed(0)}%
            </strong>
          </div>

          <div className="ride-map-navigation-actions">
            {!isNavigating ? (
              <button
                type="button"
                onClick={startNavigation}
              >
                START NAVIGATION
              </button>
            ) : (
              <button
                type="button"
                className="stop"
                onClick={stopNavigation}
              >
                STOP NAVIGATION
              </button>
            )}
          </div>
        </div>

        <div className="ride-map-progress">
          <div
            className="ride-map-progress-fill"
            style={{
              width: `${routeProgress}%`,
            }}
          />
        </div>

        <div className="ride-map-navigation-stats">
          <div>
            <span>DISTANCE REMAINING</span>

            <strong>
              {distanceRemaining.toFixed(1)} km
            </strong>
          </div>

          <div>
            <span>EST. ARRIVAL</span>

            <strong>
              {estimatedMinutes} min
            </strong>
          </div>

          <div>
            <span>ROUTE</span>

            <strong>
              78 km
            </strong>
          </div>

          <div>
            <span>STATUS</span>

            <strong
              className={
                isNavigating
                  ? "navigation-active"
                  : ""
              }
            >
              {isNavigating
                ? "NAVIGATING"
                : routeProgress >= 100
                  ? "COMPLETED"
                  : "READY"}
            </strong>
          </div>
        </div>
      </div>

      <div className="ride-map-layout">
        <div className="ride-map-visual">
          <div className="ride-map-grid" />

          <div className="ride-map-road road-one" />
          <div className="ride-map-road road-two" />
          <div className="ride-map-road road-three" />
          <div className="ride-map-road road-four" />

          <div className="ride-map-route route-one" />
          <div className="ride-map-route route-two" />

          <div className="ride-map-location-label start">
            START
          </div>

          <div className="ride-map-location-label destination">
            DESTINATION
          </div>

          {riders.map((rider) => (
            <button
              type="button"
              key={rider.id}
              className={`ride-map-marker ${
                rider.isYou
                  ? "you"
                  : ""
              } ${
                selectedRiderId ===
                rider.id
                  ? "selected"
                  : ""
              } ${
                rider.status ===
                "OFFLINE"
                  ? "offline"
                  : ""
              }`}
              style={{
                left: `${
                  50 +
                  (rider.longitude -
                    77.6006) *
                    850
                }%`,
                top: `${
                  50 -
                  (rider.latitude -
                    14.6819) *
                    850
                }%`,
              }}
              onClick={() =>
                setSelectedRiderId(
                  rider.id
                )
              }
              title={rider.name}
            >
              <span>
                {rider.initials}
              </span>
            </button>
          ))}

          <div className="ride-map-center-control">
            <button
              type="button"
              onClick={centerOnMe}
              aria-label="Center on my location"
            >
              ◎
            </button>
          </div>

          <div className="ride-map-legend">
            <div>
              <span className="legend-dot you" />
              You
            </div>

            <div>
              <span className="legend-dot online" />
              Online
            </div>

            <div>
              <span className="legend-dot offline" />
              Offline
            </div>
          </div>

          <div className="ride-map-overlay">
            <span>MAP MODE</span>

            <strong>
              LIVE GROUP VIEW
            </strong>
          </div>
        </div>

        <aside className="ride-map-rider-panel">
          <div className="ride-map-panel-heading">
            <div>
              <span>01</span>

              <h3>RIDERS</h3>
            </div>

            <small>
              {riders.length} TOTAL
            </small>
          </div>

          <div className="ride-map-rider-list">
            {riders.map((rider) => (
              <button
                type="button"
                key={rider.id}
                className={`ride-map-rider ${
                  selectedRiderId ===
                  rider.id
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setSelectedRiderId(
                    rider.id
                  )
                }
              >
                <div
                  className={`ride-map-rider-avatar ${
                    rider.isYou
                      ? "you"
                      : ""
                  }`}
                >
                  {rider.initials}
                </div>

                <div className="ride-map-rider-info">
                  <strong>
                    {rider.name}

                    {rider.isYou
                      ? " (YOU)"
                      : ""}
                  </strong>

                  <span>
                    {rider.distance ===
                    0
                      ? "Your location"
                      : `${rider.distance.toFixed(
                          2
                        )} km away`}
                  </span>
                </div>

                <div
                  className={`ride-map-rider-status ${getRiderStatusClass(
                    rider.status
                  )}`}
                >
                  <span />

                  {rider.status}
                </div>
              </button>
            ))}
          </div>

          {selectedRider && (
            <div className="ride-map-selected">
              <div className="ride-map-selected-header">
                <span>02</span>

                <div>
                  <small>
                    SELECTED RIDER
                  </small>

                  <strong>
                    {selectedRider.name}
                  </strong>
                </div>
              </div>

              <div className="ride-map-selected-stats">
                <div>
                  <span>SPEED</span>

                  <strong>
                    {selectedRider.speed} km/h
                  </strong>
                </div>

                <div>
                  <span>DISTANCE</span>

                  <strong>
                    {selectedRider.distance ===
                    0
                      ? "YOU"
                      : `${selectedRider.distance.toFixed(
                          2
                        )} km`}
                  </strong>
                </div>

                <div>
                  <span>LATITUDE</span>

                  <strong>
                    {selectedRider.latitude.toFixed(
                      4
                    )}
                  </strong>
                </div>

                <div>
                  <span>LONGITUDE</span>

                  <strong>
                    {selectedRider.longitude.toFixed(
                      4
                    )}
                  </strong>
                </div>
              </div>

              <div className="ride-map-last-update">
                <span>
                  LAST UPDATED
                </span>

                <strong>
                  {selectedRider.lastUpdated}
                </strong>
              </div>
            </div>
          )}
        </aside>
      </div>

      <div className="ride-map-checkpoints">
        <div className="ride-map-checkpoints-heading">
          <div>
            <span>03</span>

            <h3>
              ROUTE CHECKPOINTS
            </h3>
          </div>

          <small>
            4 STOPS
          </small>
        </div>

        <div className="ride-map-checkpoint-list">
          {ROUTE_CHECKPOINTS.map(
            (checkpoint) => (
              <div
                className={`ride-map-checkpoint ${checkpoint.status.toLowerCase()}`}
                key={checkpoint.id}
              >
                <div className="ride-map-checkpoint-marker">
                  {checkpoint.status ===
                  "COMPLETED"
                    ? "✓"
                    : checkpoint.status ===
                        "CURRENT"
                      ? "●"
                      : "○"}
                </div>

                <div className="ride-map-checkpoint-info">
                  <strong>
                    {checkpoint.name}
                  </strong>

                  <span>
                    {checkpoint.distance ===
                    0
                      ? "Starting point"
                      : `${checkpoint.distance} km`}
                  </span>
                </div>

                <small>
                  {checkpoint.status}
                </small>
              </div>
            )
          )}
        </div>
      </div>

      {notice && (
        <div className="ride-map-notice">
          <span>✦</span>

          {notice}
        </div>
      )}

      <div className="ride-map-footer">
        <span>
          LIVE LOCATION
        </span>

        <p>
          Rider positions and navigation are currently
          displayed in frontend demo mode.
        </p>
      </div>
    </section>
  );
}

export default RideMap;