import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import apiClient from "../../../../services/apiClient";
import "./LiveRiders.css";

const ridingStyles = [
  "ALL",
  "ADVENTURE",
  "TOURING",
  "CRUISER",
  "SPORT",
];

function LiveRiders() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [riders, setRiders] = useState([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [connectedRiders, setConnectedRiders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // 1. Fetch live riders from backend API
  const fetchLiveRiders = useCallback(async () => {
    if (!isAuthenticated) {
      setRiders([]);
      return;
    }

    setLoading(true);

    try {
      // Try to get user coordinates or use default India coords
      let lat = 28.6139;
      let lng = 77.2090;

      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch (_) {}
      }

      // Query nearby riders (with large radius to discover all active network riders)
      const [nearbyRes, connRes] = await Promise.allSettled([
        apiClient.get(`/api/mototribe/riders-nearby?lat=${lat}&lng=${lng}&radius=10000000`),
        apiClient.get("/api/core/connections"),
      ]);

      let formattedList = [];

      if (nearbyRes.status === "fulfilled" && nearbyRes.value.data?.data?.riders) {
        formattedList = nearbyRes.value.data.data.riders.map((r) => ({
          id: r.userId || r._id,
          name: r.name || "Rider",
          location: r.currentJourney?.destination || (r.distanceKm ? `${Math.round(r.distanceKm)} km away` : "Active Network"),
          bike: r.primaryVehicleName || "Motorcycle",
          style: (r.preferredRideType || "ADVENTURE").toUpperCase(),
          status: (r.status || "online").toUpperCase(),
          experience: r.totalRidesCompleted > 10 ? "ADVANCED" : r.totalRidesCompleted > 3 ? "INTERMEDIATE" : "BEGINNER",
          distance: Math.round(r.distanceKm || 15),
          trustScore: r.trustScore || 100,
        }));
      }

      // If no other riders found in nearby presence, fetch community members as fallback
      if (formattedList.length === 0) {
        const commRes = await apiClient.get("/api/community").catch(() => null);
        if (commRes?.data?.data) {
          const members = Array.isArray(commRes.data.data) ? commRes.data.data : commRes.data.data.members || [];
          formattedList = members.map((m) => ({
            id: m._id || m.userId,
            name: m.name || m.fullName || "Community Rider",
            location: m.location || m.city || "India",
            bike: m.bike || m.vehicleName || "Adventure Bike",
            style: (m.ridingStyle || m.preferredRideType || "TOURING").toUpperCase(),
            status: "ONLINE",
            experience: m.experience || "INTERMEDIATE",
            distance: Math.floor(Math.random() * 40) + 10,
          }));
        }
      }

      setRiders(formattedList);

      if (connRes.status === "fulfilled" && connRes.value.data?.data) {
        const conns = connRes.value.data.data.connections || [];
        const connectedIds = conns.map((c) => (c.user?._id || c._id || c.toUserId || c.fromUserId)?.toString());
        setConnectedRiders(connectedIds);
      }
    } catch (err) {
      console.error("Failed to load live riders:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchLiveRiders();
  }, [fetchLiveRiders]);

  const filteredRiders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return riders.filter((rider) => {
      const matchesSearch =
        !normalizedSearch ||
        rider.name.toLowerCase().includes(normalizedSearch) ||
        rider.location.toLowerCase().includes(normalizedSearch) ||
        rider.bike.toLowerCase().includes(normalizedSearch) ||
        rider.experience.toLowerCase().includes(normalizedSearch);

      const matchesStyle =
        activeFilter === "ALL" ||
        rider.style === activeFilter;

      return matchesSearch && matchesStyle;
    });
  }, [activeFilter, riders, search]);

  const onlineCount = riders.filter(
    (rider) => rider.status === "ONLINE"
  ).length;

  const ridingCount = riders.filter(
    (rider) => rider.status === "RIDING"
  ).length;

  const nearbyCount = riders.filter(
    (rider) => rider.distance <= 30
  ).length;

  const toggleConnection = async (riderId) => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    if (connectedRiders.includes(riderId)) {
      // Already connected
      return;
    }

    setActionLoading((prev) => ({ ...prev, [riderId]: true }));
    try {
      await apiClient.post("/api/core/connections/request", {
        toUserId: riderId,
      });
      setConnectedRiders((current) => [...current, riderId]);
    } catch (err) {
      // If error indicates already requested/connected, mark as connected
      const msg = err.response?.data?.message || "";
      if (msg.includes("already") || msg.includes("exists")) {
        setConnectedRiders((current) => [...current, riderId]);
      } else {
        console.error("Connection request failed:", err);
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [riderId]: false }));
    }
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
            <span className="live-search-icon">🔍</span>

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
                ✕
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
              {loading ? "Connecting to live database..." : "Showing active riders across the MotoTribe network"}
            </span>
          </div>

          <span>
            {filteredRiders.length} RIDERS FOUND
          </span>
        </div>

        {loading ? (
          <div className="live-riders-empty">
            <h3>Loading active riders...</h3>
          </div>
        ) : filteredRiders.length > 0 ? (
          <div className="live-riders-grid">
            {filteredRiders.map((rider) => {
              const isConnected = connectedRiders.includes(
                rider.id
              );
              const isActing = actionLoading[rider.id];

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
                      <span>📍</span>
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
                    disabled={isActing}
                    className={`live-connect-button ${
                      isConnected ? "connected" : ""
                    }`}
                    onClick={() =>
                      toggleConnection(rider.id)
                    }
                  >
                    {isActing
                      ? "CONNECTING..."
                      : isConnected
                      ? "CONNECTED"
                      : "CONNECT WITH RIDER"}
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="live-riders-empty">
            <div className="empty-rider-icon">🏍️</div>

            <h3>No active riders found</h3>

            <p>
              {!isAuthenticated
                ? "Please log in to discover riders active on the network."
                : "Try another search or change the riding style filter."}
            </p>

            <button
              type="button"
              onClick={!isAuthenticated ? openAuthModal : clearSearch}
              className="reset-live-riders"
            >
              {!isAuthenticated ? "LOG IN" : "RESET FILTERS"}
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
