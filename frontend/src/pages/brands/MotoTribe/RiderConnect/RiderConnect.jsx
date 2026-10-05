import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import apiClient from "../../../../services/apiClient";
import "./RiderConnect.css";

const styleFilters = [
  "ALL",
  "ADVENTURE",
  "TOURING",
  "CRUISER",
  "SPORT",
];

function RiderConnect() {
  const { isAuthenticated, openAuthModal, user } = useAuth();
  const [riders, setRiders] = useState([]);
  const [connections, setConnections] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState("DISCOVER");
  const [styleFilter, setStyleFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedRider, setSelectedRider] = useState(null);
  const [messagingRider, setMessagingRider] = useState(null);
  const [directMessages, setDirectMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRiderNetwork = useCallback(async () => {
    if (!isAuthenticated) {
      setRiders([]);
      setConnections([]);
      setOutgoingRequests([]);
      return;
    }

    setLoading(true);
    try {
      const [connRes, reqRes, nearbyRes, commRes] = await Promise.allSettled([
        apiClient.get("/api/core/connections"),
        apiClient.get("/api/core/connections/requests/outgoing"),
        apiClient.get("/api/mototribe/riders-nearby?lat=28.6139&lng=77.2090&radius=10000000"),
        apiClient.get("/api/community"),
      ]);

      const connectedList = [];
      if (connRes.status === "fulfilled" && connRes.value.data?.data) {
        const rawConns = connRes.value.data.data.connections || [];
        rawConns.forEach((c) => {
          const otherUser = c.otherUser || c.user || c.toUserId || c.fromUserId;
          if (otherUser && (otherUser._id || otherUser.id)) {
            connectedList.push({
              id: otherUser._id || otherUser.id,
              name: otherUser.name || "Connected Rider",
              location: otherUser.city || "India",
              bike: otherUser.bike || "Motorcycle",
              style: (otherUser.ridingStyle || "TOURING").toUpperCase(),
              experience: "INTERMEDIATE",
              rides: otherUser.totalRidesCompleted || 5,
              mutual: 2,
              bio: "Active MotoTribe community connection.",
              connectionId: c._id,
            });
          }
        });
      }
      setConnections(connectedList);

      const reqList = [];
      if (reqRes.status === "fulfilled" && reqRes.value.data?.data) {
        const rawReqs = reqRes.value.data.data.requests || [];
        rawReqs.forEach((r) => {
          const target = r.toUserId;
          if (target) {
            reqList.push({
              id: target._id || target,
              requestId: r._id,
              name: target.name || "Rider",
              style: "ADVENTURE",
              location: "India",
              bike: "Motorcycle",
              experience: "INTERMEDIATE",
              rides: 1,
              mutual: 0,
              bio: "Pending connection request.",
            });
          }
        });
      }
      setOutgoingRequests(reqList);

      let discoverList = [];
      if (nearbyRes.status === "fulfilled" && nearbyRes.value.data?.data?.riders) {
        discoverList = nearbyRes.value.data.data.riders.map((r) => ({
          id: r.userId || r._id,
          name: r.name || "Rider",
          location: r.distanceKm ? `${Math.round(r.distanceKm)} km away` : "India",
          bike: r.primaryVehicleName || "Motorcycle",
          style: (r.preferredRideType || "ADVENTURE").toUpperCase(),
          experience: r.totalRidesCompleted > 10 ? "ADVANCED" : "INTERMEDIATE",
          rides: r.totalRidesCompleted || 0,
          mutual: 3,
          bio: "Verified rider exploring open highways and mountain passes.",
        }));
      }

      if (discoverList.length === 0 && commRes.status === "fulfilled" && commRes.value.data?.data) {
        const commData = Array.isArray(commRes.value.data.data) ? commRes.value.data.data : commRes.value.data.data.members || [];
        discoverList = commData.map((m) => ({
          id: m._id || m.userId,
          name: m.name || m.fullName || "Community Rider",
          location: m.location || m.city || "India",
          bike: m.bike || m.vehicleName || "Adventure Bike",
          style: (m.ridingStyle || m.preferredRideType || "TOURING").toUpperCase(),
          experience: m.experience || "INTERMEDIATE",
          rides: 12,
          mutual: 4,
          bio: "Community member on MotoTribe network.",
        }));
      }

      setRiders(discoverList);
    } catch (err) {
      console.error("Failed to load rider network from DB:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchRiderNetwork();
  }, [fetchRiderNetwork]);

  const activeRiders = useMemo(() => {
    if (activeTab === "CONNECTIONS") {
      return connections;
    }
    if (activeTab === "REQUESTS") {
      return outgoingRequests;
    }
    return riders;
  }, [activeTab, connections, outgoingRequests, riders]);

  const filteredRiders = useMemo(() => {
    return activeRiders.filter((rider) => {
      const matchesStyle =
        styleFilter === "ALL" ||
        rider.style === styleFilter;

      const normalizedSearch = search.trim().toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        rider.name.toLowerCase().includes(normalizedSearch) ||
        rider.location.toLowerCase().includes(normalizedSearch) ||
        rider.bike.toLowerCase().includes(normalizedSearch) ||
        rider.style.toLowerCase().includes(normalizedSearch);

      return matchesStyle && matchesSearch;
    });
  }, [activeRiders, search, styleFilter]);

  const getConnectionStatus = (riderId) => {
    if (connections.some((c) => c.id === riderId)) {
      return "CONNECTED";
    }
    if (outgoingRequests.some((r) => r.id === riderId)) {
      return "REQUESTED";
    }
    return "CONNECT";
  };

  const handleConnectionAction = async (riderId) => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    const currentStatus = getConnectionStatus(riderId);

    if (currentStatus === "CONNECT") {
      try {
        await apiClient.post("/api/core/connections/request", {
          toUserId: riderId,
        });
        setOutgoingRequests((prev) => [...prev, { id: riderId }]);
      } catch (err) {
        console.error("Failed to send connection request:", err);
      }
    }
  };

  const toggleFollow = (riderId) => {
    setFollowing((current) => {
      if (current.includes(riderId)) {
        return current.filter((id) => id !== riderId);
      }
      return [...current, riderId];
    });
  };

  const openDirectMessage = (rider) => {
    setMessagingRider(rider);
    setSelectedRider(null);
  };

  const closeDirectMessage = () => {
    setMessagingRider(null);
    setMessageText("");
  };

  const sendDirectMessage = () => {
    if (!messageText.trim()) return;
    setDirectMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "ME",
        text: messageText.trim(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setMessageText("");
  };

  return (
    <section className="rider-connect">
      <div className="rider-connect-container">
        <div className="rider-connect-header">
          <div>
            <span className="rider-connect-eyebrow">
              COMMUNITY NETWORK
            </span>

            <h2>Rider Connect</h2>

            <p>
              Discover and connect with riders from your region, share live routes, and build your riding tribe.
            </p>
          </div>

          <div className="rider-connect-tabs" role="tablist">
            <button
              type="button"
              className={`rider-tab ${activeTab === "DISCOVER" ? "active" : ""}`}
              onClick={() => setActiveTab("DISCOVER")}
              role="tab"
              aria-selected={activeTab === "DISCOVER"}
            >
              DISCOVER ({riders.length})
            </button>

            <button
              type="button"
              className={`rider-tab ${activeTab === "CONNECTIONS" ? "active" : ""}`}
              onClick={() => setActiveTab("CONNECTIONS")}
              role="tab"
              aria-selected={activeTab === "CONNECTIONS"}
            >
              MY TRIBE ({connections.length})
            </button>

            <button
              type="button"
              className={`rider-tab ${activeTab === "REQUESTS" ? "active" : ""}`}
              onClick={() => setActiveTab("REQUESTS")}
              role="tab"
              aria-selected={activeTab === "REQUESTS"}
            >
              REQUESTS ({outgoingRequests.length})
            </button>
          </div>
        </div>

        <div className="rider-controls">
          <div className="rider-search">
            <span className="search-icon">🔍</span>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by rider name, motorcycle or location..."
              aria-label="Search riders"
            />

            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="rider-filters">
            {styleFilters.map((style) => (
              <button
                key={style}
                type="button"
                className={`style-filter-btn ${
                  styleFilter === style ? "active" : ""
                }`}
                onClick={() => setStyleFilter(style)}
                aria-pressed={styleFilter === style}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rider-empty-state">
            <h3>Connecting to live database...</h3>
          </div>
        ) : filteredRiders.length > 0 ? (
          <div className="rider-grid">
            {filteredRiders.map((rider) => {
              const status = getConnectionStatus(rider.id);
              const isFollowing = following.includes(rider.id);

              return (
                <article className="rider-card" key={rider.id}>
                  <div className="rider-card-top">
                    <div className="rider-avatar">
                      {rider.name.charAt(0)}
                    </div>

                    <div className="rider-badge-group">
                      <span className={`rider-style ${rider.style.toLowerCase()}`}>
                        {rider.style}
                      </span>
                    </div>
                  </div>

                  <div className="rider-main-info">
                    <button
                      type="button"
                      className="rider-name-button"
                      onClick={() => setSelectedRider(rider)}
                    >
                      <h3>{rider.name}</h3>
                    </button>

                    <p className="rider-location">
                      <span>📍</span>
                      {rider.location}
                    </p>

                    <p className="rider-bike">{rider.bike}</p>
                  </div>

                  <div className="rider-stats-row">
                    <div>
                      <span>EXPERIENCE</span>
                      <strong>{rider.experience}</strong>
                    </div>

                    <div>
                      <span>TOTAL RIDES</span>
                      <strong>{rider.rides}</strong>
                    </div>

                    <div>
                      <span>MUTUAL</span>
                      <strong>{rider.mutual}</strong>
                    </div>
                  </div>

                  <div className="rider-actions">
                    <button
                      type="button"
                      className={`rider-connect-btn ${status.toLowerCase()}`}
                      onClick={() => handleConnectionAction(rider.id)}
                    >
                      {status === "CONNECTED"
                        ? "CONNECTED"
                        : status === "REQUESTED"
                        ? "REQUESTED"
                        : "CONNECT"}
                    </button>

                    <button
                      type="button"
                      className="rider-profile-btn"
                      onClick={() => setSelectedRider(rider)}
                    >
                      PROFILE
                    </button>

                    {status === "CONNECTED" && (
                      <button
                        type="button"
                        className="rider-msg-btn"
                        onClick={() => openDirectMessage(rider)}
                        aria-label={`Message ${rider.name}`}
                      >
                        💬
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rider-empty-state">
            <div className="empty-icon">🏍️</div>
            <h3>
              {activeTab === "DISCOVER" && "No riders found"}
              {activeTab === "CONNECTIONS" && "No connections yet"}
              {activeTab === "REQUESTS" && "No sent requests"}
            </h3>
            <p>
              {activeTab === "DISCOVER"
                ? "Discover riders across the MotoTribe network and send connection requests."
                : activeTab === "CONNECTIONS"
                ? "Connect with riders from the Discover tab to build your tribe."
                : "Sent connection requests will appear here."}
            </p>
          </div>
        )}

        <div className="rider-connect-footer">
          <div>
            <span className="footer-line" />
            <span>RIDE TOGETHER</span>
            <span className="footer-line" />
          </div>
          <p>Find riders. Share routes. Build your tribe.</p>
        </div>
      </div>

      {selectedRider && (
        <div
          className="rider-modal-overlay"
          onClick={() => setSelectedRider(null)}
          role="presentation"
        >
          <div
            className="rider-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rider-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setSelectedRider(null)}
              aria-label="Close rider profile"
            >
              ✕
            </button>

            <div className="modal-profile-header">
              <div className="modal-avatar">
                {selectedRider.name.charAt(0)}
              </div>

              <div>
                <span className="modal-style">{selectedRider.style}</span>
                <h3 id="rider-modal-title">{selectedRider.name}</h3>
                <p>📍 {selectedRider.location}</p>
              </div>
            </div>

            <div className="modal-bio">
              <p>{selectedRider.bio}</p>
            </div>

            <div className="modal-details">
              <div>
                <span>Motorcycle</span>
                <strong>{selectedRider.bike}</strong>
              </div>
              <div>
                <span>Experience</span>
                <strong>{selectedRider.experience}</strong>
              </div>
              <div>
                <span>Total Rides</span>
                <strong>{selectedRider.rides}</strong>
              </div>
              <div>
                <span>Mutual Riders</span>
                <strong>{selectedRider.mutual}</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-primary-button"
                onClick={() => handleConnectionAction(selectedRider.id)}
              >
                {getConnectionStatus(selectedRider.id) === "CONNECTED"
                  ? "CONNECTED"
                  : getConnectionStatus(selectedRider.id) === "REQUESTED"
                  ? "CANCEL REQUEST"
                  : "CONNECT"}
              </button>

              <button
                type="button"
                className="modal-secondary-button"
                onClick={() => openDirectMessage(selectedRider)}
              >
                MESSAGE
              </button>

              <button
                type="button"
                className={`modal-follow-button ${
                  following.includes(selectedRider.id) ? "active" : ""
                }`}
                onClick={() => toggleFollow(selectedRider.id)}
              >
                {following.includes(selectedRider.id) ? "FOLLOWING" : "FOLLOW"}
              </button>
            </div>
          </div>
        </div>
      )}

      {messagingRider && (
        <div
          className="rider-message-overlay"
          onClick={closeDirectMessage}
          role="presentation"
        >
          <div
            className="rider-message-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rider-message-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="rider-message-header">
              <div>
                <span className="rider-message-eyebrow">DIRECT CONNECTION</span>
                <h3 id="rider-message-title">{messagingRider.name}</h3>
                <p>{messagingRider.location} • {messagingRider.style}</p>
              </div>

              <button
                type="button"
                className="rider-message-close"
                onClick={closeDirectMessage}
                aria-label="Close direct message"
              >
                ✕
              </button>
            </div>

            <div className="rider-message-body">
              {directMessages.length > 0 ? (
                directMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`direct-message ${
                      message.sender === "ME" ? "mine" : ""
                    }`}
                  >
                    <span>{message.text}</span>
                  </div>
                ))
              ) : (
                <div className="direct-message-empty">
                  <span>START THE CONVERSATION</span>
                  <p>Ask about routes, riding conditions, fuel, accommodation or upcoming rides.</p>
                </div>
              )}
            </div>

            <form
              className="rider-message-form"
              onSubmit={(event) => {
                event.preventDefault();
                sendDirectMessage();
              }}
            >
              <input
                type="text"
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                placeholder={`Message ${messagingRider.name}...`}
                aria-label={`Message ${messagingRider.name}`}
                maxLength={500}
              />

              <button type="submit" disabled={!messageText.trim()}>
                SEND
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default RiderConnect;
