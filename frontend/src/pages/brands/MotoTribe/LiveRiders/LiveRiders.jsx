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
  const { isAuthenticated, openAuthModal, user } = useAuth();
  const [riders, setRiders] = useState([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [connections, setConnections] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const fetchLiveRiders = useCallback(async () => {
    if (!isAuthenticated) {
      setRiders([]);
      setConnections([]);
      setOutgoingRequests([]);
      setIncomingRequests([]);
      return;
    }

    setLoading(true);

    try {
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

      const [nearbyRes, connRes, reqRes, incomingRes] = await Promise.allSettled([
        apiClient.get(`/api/mototribe/riders-nearby?lat=${lat}&lng=${lng}&radius=10000000`),
        apiClient.get("/api/core/connections"),
        apiClient.get("/api/core/connections/requests/outgoing"),
        apiClient.get("/api/core/connections/requests/incoming"),
      ]);

      let formattedList = [];

      if (nearbyRes.status === "fulfilled" && nearbyRes.value.data?.data?.riders) {
        formattedList = nearbyRes.value.data.data.riders
          .filter((r) => String(r.userId || r._id) !== String(user?._id))
          .map((r) => ({
            id: String(r.userId || r._id),
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

      setRiders(formattedList);

      if (connRes.status === "fulfilled" && connRes.value.data?.data) {
        const conns = connRes.value.data.data.connections || [];
        const ids = conns.map((c) => {
          const ou = c.otherUser || c.user || c.toUserId || c.fromUserId;
          return String(ou?._id || ou?.id || c._id);
        });
        setConnections(ids);
      }

      if (reqRes.status === "fulfilled" && reqRes.value.data?.data) {
        const reqs = reqRes.value.data.data.requests || [];
        setOutgoingRequests(reqs.map((r) => String(r.toUserId?._id || r.toUserId)));
      }

      if (incomingRes.status === "fulfilled" && incomingRes.value.data?.data) {
        const incs = incomingRes.value.data.data.requests || [];
        setIncomingRequests(incs.map((r) => ({
          userId: String(r.fromUserId?._id || r.fromUserId),
          requestId: r._id,
        })));
      }
    } catch (err) {
      console.error("Failed to load live riders:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?._id]);

  useEffect(() => {
    fetchLiveRiders();
    const handleUpdate = () => { fetchLiveRiders(); };
    window.addEventListener("kaindra:connection_updated", handleUpdate);
    return () => { window.removeEventListener("kaindra:connection_updated", handleUpdate); };
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

  const getRiderStatus = (riderId) => {
    if (connections.includes(String(riderId))) return "CONNECTED";
    if (incomingRequests.some((i) => i.userId === String(riderId))) return "INCOMING";
    if (outgoingRequests.includes(String(riderId))) return "REQUESTED";
    return "CONNECT";
  };

  const handleRiderAction = async (riderId) => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    const status = getRiderStatus(riderId);
    if (status === "CONNECTED" || status === "REQUESTED") return;

    setActionLoading((prev) => ({ ...prev, [riderId]: true }));
    try {
      if (status === "INCOMING") {
        const inc = incomingRequests.find((i) => i.userId === String(riderId));
        if (inc && inc.requestId) {
          await apiClient.patch(`/api/core/connections/requests/${inc.requestId}/respond`, { action: "accept" });
          window.dispatchEvent(new CustomEvent("kaindra:connection_updated"));
          await fetchLiveRiders();
        }
      } else if (status === "CONNECT") {
        await apiClient.post("/api/core/connections/request", { toUserId: riderId });
        setOutgoingRequests((prev) => [...prev, String(riderId)]);
        window.dispatchEvent(new CustomEvent("kaindra:connection_updated"));
        await fetchLiveRiders();
      }
    } catch (err) {
      console.error("Connection action failed:", err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [riderId]: false }));
    }
  };

  const clearSearch = () => {
    setSearch("");
    setActiveFilter("ALL");
  };

  return (
    <section className="live-riders" id="live-riders">
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
              {connections.length}
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
              const status = getRiderStatus(rider.id);
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
                    disabled={isActing || status === "CONNECTED" || status === "REQUESTED"}
                    className={`live-connect-button ${status.toLowerCase()}`}
                    onClick={() => handleRiderAction(rider.id)}
                  >
                    {isActing
                      ? "PROCESSING..."
                      : status === "CONNECTED"
                      ? "CONNECTED ✓"
                      : status === "REQUESTED"
                      ? "REQUEST SENT ⏳"
                      : status === "INCOMING"
                      ? "✓ ACCEPT REQUEST"
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
