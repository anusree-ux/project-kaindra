import { useMemo, useState } from "react";
import "./LiveRiders.css";

const riders = [
  {
    id: "live-001",
    name: "Arjun",
    location: "Delhi",
    bike: "Royal Enfield Himalayan",
    style: "ADVENTURE",
    status: "ONLINE",
    experience: "ADVANCED",
    distance: 42,
  },
  {
    id: "live-002",
    name: "Rahul",
    location: "Chandigarh",
    bike: "KTM Adventure 390",
    style: "ADVENTURE",
    status: "ONLINE",
    experience: "INTERMEDIATE",
    distance: 27,
  },
  {
    id: "live-003",
    name: "Meera",
    location: "Bengaluru",
    bike: "Yamaha MT-15",
    style: "TOURING",
    status: "RIDING",
    experience: "INTERMEDIATE",
    distance: 31,
  },
  {
    id: "live-004",
    name: "Vikram",
    location: "Visakhapatnam",
    bike: "Royal Enfield Classic 350",
    style: "CRUISER",
    status: "ONLINE",
    experience: "ADVANCED",
    distance: 56,
  },
  {
    id: "live-005",
    name: "Kiran",
    location: "Hyderabad",
    bike: "Bajaj Dominar 400",
    style: "TOURING",
    status: "RIDING",
    experience: "INTERMEDIATE",
    distance: 19,
  },
  {
    id: "live-006",
    name: "Aditya",
    location: "Mysuru",
    bike: "KTM Duke 390",
    style: "SPORT",
    status: "RIDING",
    experience: "ADVANCED",
    distance: 38,
  },
];

const ridingStyles = [
  "ALL",
  "ADVENTURE",
  "TOURING",
  "CRUISER",
  "SPORT",
];

function LiveRiders() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [connectedRiders, setConnectedRiders] = useState([]);

  const filteredRiders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return riders.filter((rider) => {
      const matchesSearch =
        !normalizedSearch ||
        rider.name.toLowerCase().includes(normalizedSearch) ||
        rider.location.toLowerCase().includes(normalizedSearch) ||
        rider.bike.toLowerCase().includes(normalizedSearch) ||
        rider.style.toLowerCase().includes(normalizedSearch) ||
        rider.experience.toLowerCase().includes(normalizedSearch);

      const matchesStyle =
        activeFilter === "ALL" ||
        rider.style === activeFilter;

      return matchesSearch && matchesStyle;
    });
  }, [activeFilter, search]);

  const onlineCount = riders.filter(
    (rider) => rider.status === "ONLINE"
  ).length;

  const ridingCount = riders.filter(
    (rider) => rider.status === "RIDING"
  ).length;

  const nearbyCount = riders.filter(
    (rider) => rider.distance <= 30
  ).length;

  const toggleConnection = (riderId) => {
    setConnectedRiders((current) => {
      if (current.includes(riderId)) {
        return current.filter((id) => id !== riderId);
      }

      return [...current, riderId];
    });
  };

  const clearSearch = () => {
    setSearch("");
    setActiveFilter("ALL");
  };

  return (
    <section className="live-riders">
      <div className="live-riders-container">
        <div className="live-riders-header">
          <div>
            <span className="live-riders-eyebrow">
              LIVE RIDER NETWORK
            </span>

            <h2>Live Riders</h2>

            <p>
              See riders currently active on the MotoTribe network
              and discover people riding near your route.
            </p>
          </div>

          <div className="live-status">
            <span className="live-status-dot" />
            LIVE NETWORK
          </div>
        </div>

        <div className="live-rider-stats">
          <div className="live-stat-card">
            <span className="live-stat-number">
              {onlineCount}
            </span>
            <span className="live-stat-label">ONLINE</span>
          </div>

          <div className="live-stat-card">
            <span className="live-stat-number">
              {ridingCount}
            </span>
            <span className="live-stat-label">RIDING NOW</span>
          </div>

          <div className="live-stat-card">
            <span className="live-stat-number">
              {nearbyCount}
            </span>
            <span className="live-stat-label">NEARBY</span>
          </div>

          <div className="live-stat-card">
            <span className="live-stat-number">
              {connectedRiders.length}
            </span>
            <span className="live-stat-label">CONNECTED</span>
          </div>
        </div>

        <div className="live-riders-controls">
          <div className="live-rider-search">
            <span className="live-search-icon">⌕</span>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search riders, bikes or locations..."
              aria-label="Search live riders"
            />

            {search && (
              <button
                type="button"
                className="live-clear-search"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="live-rider-filters">
            {ridingStyles.map((style) => (
              <button
                key={style}
                type="button"
                className={`live-filter-button ${
                  activeFilter === style ? "active" : ""
                }`}
                onClick={() => setActiveFilter(style)}
                aria-pressed={activeFilter === style}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div className="live-riders-location-bar">
          <div>
            <span className="location-pulse" />
            <span>
              Showing active riders across the MotoTribe network
            </span>
          </div>

          <span>
            {filteredRiders.length} RIDERS FOUND
          </span>
        </div>

        {filteredRiders.length > 0 ? (
          <div className="live-riders-grid">
            {filteredRiders.map((rider) => {
              const isConnected = connectedRiders.includes(
                rider.id
              );

              return (
                <article
                  className="live-rider-card"
                  key={rider.id}
                >
                  <div className="live-rider-card-header">
                    <div className="live-rider-avatar">
                      {rider.name.charAt(0)}
                    </div>

                    <div className="live-rider-status">
                      <span
                        className={`status-dot ${
                          rider.status === "RIDING"
                            ? "riding"
                            : "online"
                        }`}
                      />

                      {rider.status}
                    </div>
                  </div>

                  <div className="live-rider-info">
                    <div className="live-rider-name-row">
                      <h3>{rider.name}</h3>

                      <span
                        className={`live-rider-style ${rider.style.toLowerCase()}`}
                      >
                        {rider.style}
                      </span>
                    </div>

                    <p className="live-rider-location">
                      <span>⌖</span>
                      {rider.location}
                    </p>

                    <p className="live-rider-bike">
                      {rider.bike}
                    </p>
                  </div>

                  <div className="live-rider-details">
                    <div>
                      <span>EXPERIENCE</span>
                      <strong>{rider.experience}</strong>
                    </div>

                    <div>
                      <span>DISTANCE</span>
                      <strong>{rider.distance} km</strong>
                    </div>
                  </div>

                  <div className="live-rider-route">
                    <div className="route-line">
                      <span className="route-point start" />
                      <span className="route-track" />
                      <span className="route-point end" />
                    </div>

                    <span>
                      ACTIVE ON NETWORK
                    </span>
                  </div>

                  <button
                    type="button"
                    className={`live-connect-button ${
                      isConnected ? "connected" : ""
                    }`}
                    onClick={() =>
                      toggleConnection(rider.id)
                    }
                  >
                    {isConnected
                      ? "CONNECTED"
                      : "CONNECT WITH RIDER"}
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="live-riders-empty">
            <div className="empty-rider-icon">⌁</div>

            <h3>No active riders found</h3>

            <p>
              Try another search or change the riding style
              filter.
            </p>

            <button
              type="button"
              onClick={clearSearch}
              className="reset-live-riders"
            >
              RESET FILTERS
            </button>
          </div>
        )}

        <div className="live-riders-footer">
          <div className="live-footer-line">
            <span />
            <strong>RIDE TOGETHER</strong>
            <span />
          </div>

          <p>
            Connect with riders. Discover routes. Ride beyond
            the ordinary.
          </p>
        </div>
      </div>
    </section>
  );
}

export default LiveRiders;