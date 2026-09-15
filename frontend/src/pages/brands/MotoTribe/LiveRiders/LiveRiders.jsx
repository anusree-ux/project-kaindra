import { useState, useEffect, useCallback } from "react";
import apiClient from "../../../../services/apiClient";
import "./LiveRiders.css";

const filters = ["ALL", "RIDING NOW", "NEARBY", "ADVENTURE", "TOURING"];

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=500&q=80";

function LiveRiders() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState({ lat: 12.9716, lng: 77.5946 }); // Default Bangalore coords
  const [locationError, setLocationError] = useState("");
  const [isOptedIn, setIsOptedIn] = useState(true);

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedProfileCard, setSelectedProfileCard] = useState(null);
  const [cardLoading, setCardLoading] = useState(false);

  const [connected, setConnected] = useState([]);
  const [invited, setInvited] = useState(false);

  // 1. Acquire current user location & send periodic presence heartbeat
  useEffect(() => {
    let heartbeatInterval = null;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          setCoords({ lat: userLat, lng: userLng });
          setLocationError("");

          if (isOptedIn) {
            // Heartbeat function
            const sendHeartbeat = () => {
              apiClient.post("/api/mototribe/presence", {
                latitude: userLat,
                longitude: userLng,
                status: "riding",
                visibility: "community",
              }).catch(() => {});
            };

            sendHeartbeat();
            heartbeatInterval = setInterval(sendHeartbeat, 30000); // Heartbeat every 30s
          }
        },
        (err) => {
          console.warn("Geolocation warning:", err.message);
          setLocationError("Enable location access to find nearby riders.");
          
          // Fallback heartbeat with default coords if opted in
          if (isOptedIn) {
            const sendHeartbeat = () => {
              apiClient.post("/api/mototribe/presence", {
                latitude: 12.9716,
                longitude: 77.5946,
                status: "riding",
                visibility: "community",
              }).catch(() => {});
            };
            sendHeartbeat();
            heartbeatInterval = setInterval(sendHeartbeat, 30000);
          }
        },
        { timeout: 8000 }
      );
    } else {
      setLocationError("Enable location access to find nearby riders.");
    }

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      // Delete presence on unmount / offline
      apiClient.delete("/api/mototribe/presence").catch(() => {});
    };
  }, [isOptedIn]);

  // 2. Fetch nearby riders from backend based on coords & active filter
  const fetchNearbyRiders = useCallback(async () => {
    setLoading(true);
    try {
      let backendFilter = "all";
      if (activeFilter === "RIDING NOW") backendFilter = "riding_now";
      if (activeFilter === "ADVENTURE") backendFilter = "adventure";
      if (activeFilter === "TOURING") backendFilter = "touring";

      const res = await apiClient.get(
        `/api/mototribe/riders-nearby?lat=${coords.lat}&lng=${coords.lng}&radius=100000&filter=${backendFilter}`
      );

      const fetchedRiders = res.data.data?.riders || [];
      setRiders(fetchedRiders);

      if (fetchedRiders.length > 0 && !selectedUserId) {
        setSelectedUserId(fetchedRiders[0].userId);
      }
    } catch (err) {
      console.error("Failed to fetch nearby riders:", err);
      setRiders([]);
    } finally {
      setLoading(false);
    }
  }, [coords.lat, coords.lng, activeFilter, selectedUserId]);

  useEffect(() => {
    fetchNearbyRiders();
  }, [fetchNearbyRiders]);

  // 3. Fetch full profile card details for selected rider
  useEffect(() => {
    if (!selectedUserId) return;
    setCardLoading(true);
    apiClient
      .get(`/api/mototribe/riders/${selectedUserId}/profile-card`)
      .then((res) => {
        setSelectedProfileCard(res.data.data?.profileCard || null);
      })
      .catch(() => {
        setSelectedProfileCard(null);
      })
      .finally(() => {
        setCardLoading(false);
      });
  }, [selectedUserId]);

  const toggleOptIn = () => {
    if (isOptedIn) {
      setIsOptedIn(false);
      apiClient.delete("/api/mototribe/presence").catch(() => {});
    } else {
      setIsOptedIn(true);
    }
  };

  const handleConnect = () => {
    if (!selectedUserId) return;
    if (connected.includes(selectedUserId)) {
      setConnected((previous) => previous.filter((id) => id !== selectedUserId));
    } else {
      setConnected((previous) => [...previous, selectedUserId]);
    }
  };

  const handleInvite = () => {
    setInvited(true);
    setTimeout(() => {
      setInvited(false);
    }, 2200);
  };

  return (
    <section id="live-riders" className="live-riders">
      <div className="live-riders-container">
        <div className="live-riders-heading">
          <div>
            <span className="live-riders-eyebrow">
              <span />
              CONNECT • RIDER NETWORK
            </span>

            <h2>
              NEVER RIDE
              <span> ALONE.</span>
            </h2>

            <p>
              Find riders around you, discover who is riding nearby and build
              trusted connections around real riding experience.
            </p>
          </div>

          <div className="live-network-status">
            <div className="network-ring">
              <span style={{ background: isOptedIn ? "#00e676" : "#ff4d4d" }} />
            </div>

            <div>
              <strong>LIVE RIDER NETWORK</strong>
              <small>
                {isOptedIn ? "YOU ARE BROADCASTING LIVE PRESENCE" : "YOU ARE OFFLINE"}
              </small>
            </div>

            <button
              type="button"
              onClick={toggleOptIn}
              style={{
                marginLeft: "15px",
                padding: "6px 14px",
                background: isOptedIn ? "rgba(255,77,77,0.2)" : "rgba(0,230,118,0.2)",
                color: isOptedIn ? "#ff4d4d" : "#00e676",
                border: `1px solid ${isOptedIn ? "#ff4d4d" : "#00e676"}`,
                borderRadius: "4px",
                fontSize: "10px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {isOptedIn ? "GO OFFLINE" : "GO LIVE ON MAP"}
            </button>
          </div>
        </div>

        {locationError && (
          <div
            style={{
              padding: "12px 18px",
              background: "rgba(255, 193, 7, 0.1)",
              border: "1px solid rgba(255, 193, 7, 0.3)",
              color: "#ffc107",
              marginBottom: "20px",
              fontSize: "12px",
              letterSpacing: "0.5px",
            }}
          >
            ⚠️ {locationError}
          </div>
        )}

        <div className="live-riders-layout">
          <div className="rider-discovery">
            <div className="rider-discovery-top">
              <div>
                <span>FIND YOUR TRIBE</span>
                <h3>RIDERS NEARBY</h3>
              </div>

              <div className="rider-count">
                <strong>{riders.length}</strong>
                <span>RIDERS</span>
              </div>
            </div>

            <div className="rider-filters">
              {filters.map((filter) => (
                <button
                  type="button"
                  key={filter}
                  className={activeFilter === filter ? "active" : ""}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="rider-grid">
              {loading ? (
                <div style={{ padding: "40px", color: "#888", textAlign: "center" }}>
                  Searching live presence network for nearby riders...
                </div>
              ) : riders.length > 0 ? (
                riders.map((rider) => {
                  const riderName = rider.name || "Rider";
                  const initials = riderName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();

                  const isSelected = selectedUserId === rider.userId;

                  return (
                    <button
                      type="button"
                      key={rider.userId}
                      className={`rider-card ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedUserId(rider.userId);
                        setInvited(false);
                      }}
                    >
                      <div className="rider-card-image">
                        <img src={DEFAULT_AVATAR} alt={riderName} />

                        <div className="rider-card-gradient" />

                        <div className="rider-online">
                          <span className={rider.status === "riding" ? "online" : ""} />
                          {rider.status === "riding" ? "RIDING" : "ONLINE"}
                        </div>

                        <div className="rider-distance">
                          {rider.distanceKm ? `${rider.distanceKm} KM` : "NEARBY"}
                        </div>

                        <div className="rider-initials">{initials}</div>
                      </div>

                      <div className="rider-card-body">
                        <div className="rider-card-name">
                          <div>
                            <strong>{riderName.toUpperCase()}</strong>
                            <span>{rider.preferredRideType ? rider.preferredRideType.toUpperCase() : "RIDER"}</span>
                          </div>

                          <b>{rider.trustScore}</b>
                        </div>

                        <div className="rider-bike">
                          {rider.primaryVehicleName || "Rider Bike"}
                        </div>

                        <div className="rider-card-footer">
                          <span>{rider.preferredRideType ? rider.preferredRideType.toUpperCase() : "GENERAL"}</span>
                          <span>{rider.totalRidesCompleted} RIDES</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    padding: "50px 20px",
                    background: "#0d0f0f",
                    border: "1px dashed rgba(255, 255, 255, 0.15)",
                    textAlign: "center",
                    color: "#aaa",
                  }}
                >
                  <div style={{ fontSize: "30px", marginBottom: "10px" }}>🏍️</div>
                  <strong style={{ color: "#c99b45", display: "block", marginBottom: "5px" }}>
                    NO RIDERS NEARBY YET
                  </strong>
                  <p style={{ margin: 0, fontSize: "12px", color: "#777" }}>
                    Be the first to go live! Toggle location broadcasting above to let nearby tribe members discover you.
                  </p>
                </div>
              )}
            </div>
          </div>

          <aside className="rider-profile-panel">
            <div className="profile-panel-top">
              <span>RIDER PROFILE</span>

              <div className="profile-location">
                <span />
                {selectedProfileCard ? "VERIFIED RIDER" : "SELECT RIDER"}
              </div>
            </div>

            {cardLoading ? (
              <div style={{ padding: "40px", color: "#888", textAlign: "center" }}>
                Loading rider details...
              </div>
            ) : selectedProfileCard ? (
              <>
                <div className="profile-hero">
                  <img
                    src={DEFAULT_AVATAR}
                    alt={selectedProfileCard.name}
                  />

                  <div className="profile-hero-overlay" />

                  <div className="profile-hero-content">
                    <div className="profile-status">
                      <span />
                      {selectedProfileCard.status === "riding" ? "RIDING NOW" : "ONLINE"}
                    </div>

                    <h3>{selectedProfileCard.name?.toUpperCase()}</h3>

                    <p>{selectedProfileCard.primaryVehicleName || "Rider Bike"}</p>
                  </div>
                </div>

                <div className="profile-experience">
                  <div>
                    <span>RIDE TYPE</span>
                    <strong>{selectedProfileCard.preferredRideType ? selectedProfileCard.preferredRideType.toUpperCase() : "GENERAL"}</strong>
                  </div>

                  <div className="trust-score">
                    <span>TRUST SCORE</span>
                    <strong>{selectedProfileCard.trustScore}</strong>
                    <small>/100</small>
                  </div>
                </div>

                <div className="profile-route">
                  <div className="route-status-line">
                    <span className="route-live-dot" />
                    CURRENT JOURNEY
                  </div>

                  <strong>
                    {selectedProfileCard.currentJourney
                      ? selectedProfileCard.currentJourney.title
                      : "No active journey"}
                  </strong>

                  <div className="route-location">
                    <span>●</span>
                    {selectedProfileCard.currentJourney
                      ? `${selectedProfileCard.currentJourney.origin} -> ${selectedProfileCard.currentJourney.destination}`
                      : "Local Ride Presence"}
                  </div>
                </div>

                <div className="profile-stats">
                  <div>
                    <strong>{selectedProfileCard.totalRidesCompleted || 0}</strong>
                    <span>RIDES</span>
                  </div>

                  <div>
                    <strong>{selectedProfileCard.totalDistanceKm || 0}</strong>
                    <span>KM RIDDEN</span>
                  </div>

                  <div>
                    <strong>{selectedProfileCard.visibility?.toUpperCase() || "COMMUNITY"}</strong>
                    <span>VISIBILITY</span>
                  </div>
                </div>

                <div className="profile-actions">
                  <button
                    type="button"
                    className="connect-button"
                    onClick={handleConnect}
                  >
                    {connected.includes(selectedUserId)
                      ? "CONNECTED ✓"
                      : "CONNECT RIDER"}
                    <span>→</span>
                  </button>

                  <button
                    type="button"
                    className="invite-button"
                    onClick={handleInvite}
                  >
                    {invited ? "INVITATION SENT ✓" : "INVITE TO RIDE"}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ padding: "40px", color: "#666", textAlign: "center", fontSize: "12px" }}>
                Select a rider card from the grid to view their profile.
              </div>
            )}

            <div className="privacy-note">
              <span>◉</span>

              <p>
                Exact rider location is protected. Riders control who can see
                their live position.
              </p>
            </div>
          </aside>
        </div>

        <div className="connect-banner">
          <div className="connect-banner-mark">M</div>

          <div>
            <span>THE MOTOTRIBE PRINCIPLE</span>
            <strong>
              THE BEST PERSON TO GUIDE A RIDER IS SOMEONE WHO HAS ALREADY
              TAKEN THE RIDE.
            </strong>
          </div>

          <button
            type="button"
            onClick={() => {
              const section = document.getElementById("ride-planner");

              if (section) {
                section.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }
            }}
          >
            PLAN WITH THE TRIBE
            <span>↗</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export default LiveRiders;