import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import apiClient from "../../../../services/apiClient";
import "./RiderConnect.css";

function RiderConnect() {
  const { isAuthenticated, openAuthModal, user } = useAuth();

  const [activeTab, setActiveTab] = useState("DISCOVER");
  const [search, setSearch] = useState("");
  const [styleFilter, setStyleFilter] = useState("ALL");
  const [selectedRider, setSelectedRider] = useState(null);
  const [loading, setLoading] = useState(false);

  // Real data exclusively from MongoDB backend
  const [dbRiders, setDbRiders] = useState([]);
  const [connections, setConnections] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [following, setFollowing] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("mototribeFollowing") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("mototribeFollowing", JSON.stringify(following));
    } catch (err) {
      console.error("Failed to persist following list:", err);
    }
  }, [following]);

  // Fetch real rider network data from backend
  const fetchRiderNetwork = useCallback(async () => {
    if (!isAuthenticated) {
      setDbRiders([]);
      setConnections([]);
      setOutgoingRequests([]);
      setIncomingRequests([]);
      return;
    }

    setLoading(true);
    try {
      const [connRes, reqRes, incomingRes, nearbyRes] = await Promise.allSettled([
        apiClient.get("/api/core/connections"),
        apiClient.get("/api/core/connections/requests/outgoing"),
        apiClient.get("/api/core/connections/requests/incoming"),
        apiClient.get("/api/mototribe/riders-nearby?lat=28.6139&lng=77.2090&radius=10000000"),
      ]);

      // 1. Accepted Connections
      const connectedList = [];
      if (connRes.status === "fulfilled" && connRes.value.data?.data) {
        (connRes.value.data.data.connections || []).forEach((c) => {
          const ou = c.otherUser || c.user || c.toUserId || c.fromUserId;
          if (ou && (ou._id || ou.id)) {
            connectedList.push({
              id: String(ou._id || ou.id),
              name: ou.name || "Connected Rider",
              location: ou.city || "India",
              bike: ou.primaryVehicleName || ou.bike || "Motorcycle",
              style: (ou.ridingStyle || "TOURING").toUpperCase(),
              experience: "INTERMEDIATE",
              rides: ou.totalRidesCompleted || 0,
              mutual: 0,
              bio: ou.bio || "Active MotoTribe community connection.",
              connectionId: c._id,
            });
          }
        });
      }
      setConnections(connectedList);

      // 2. Outgoing Requests (sent)
      const reqList = [];
      if (reqRes.status === "fulfilled" && reqRes.value.data?.data) {
        (reqRes.value.data.data.requests || []).forEach((r) => {
          const target = r.toUserId;
          if (target) {
            reqList.push({
              id: String(target._id || target),
              requestId: r._id,
              name: target.name || "Rider",
              style: (target.ridingStyle || "ADVENTURE").toUpperCase(),
              location: target.city || "India",
              bike: target.primaryVehicleName || "Motorcycle",
              experience: "INTERMEDIATE",
              rides: target.totalRidesCompleted || 0,
              mutual: 0,
              bio: "Pending connection request.",
            });
          }
        });
      }
      setOutgoingRequests(reqList);

      // 3. Incoming Requests (received)
      const incList = [];
      if (incomingRes.status === "fulfilled" && incomingRes.value.data?.data) {
        (incomingRes.value.data.data.requests || []).forEach((r) => {
          const sender = r.fromUserId;
          if (sender) {
            incList.push({
              id: String(sender._id || sender),
              requestId: r._id,
              name: sender.name || "Rider",
              style: (sender.ridingStyle || "ADVENTURE").toUpperCase(),
              location: sender.city || "India",
              bike: sender.primaryVehicleName || "Motorcycle",
              experience: "INTERMEDIATE",
              rides: sender.totalRidesCompleted || 0,
              mutual: 0,
              bio: "Sent you a connection request.",
            });
          }
        });
      }
      setIncomingRequests(incList);

      // 4. Discoverable real riders from MongoDB
      let discoverList = [];
      if (nearbyRes.status === "fulfilled" && nearbyRes.value.data?.data?.riders) {
        discoverList = nearbyRes.value.data.data.riders
          .filter((r) => String(r.userId || r._id) !== String(user?._id))
          .map((r) => ({
            id: String(r.userId || r._id),
            name: r.name || "Rider",
            location: r.location || (r.distanceKm ? `${Math.round(r.distanceKm)} km away` : "India"),
            bike: r.primaryVehicleName || "Motorcycle",
            style: (r.preferredRideType || "ADVENTURE").toUpperCase(),
            experience: r.totalRidesCompleted > 10 ? "ADVANCED" : "INTERMEDIATE",
            rides: r.totalRidesCompleted || 0,
            mutual: 0,
            bio: r.currentJourney
              ? `Currently on: ${r.currentJourney.title || "Active Journey"}`
              : "Verified rider exploring open highways and mountain passes.",
          }));
      }
      setDbRiders(discoverList);
    } catch (err) {
      console.error("Failed to load rider network from DB:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?._id]);

  useEffect(() => {
    fetchRiderNetwork();
    const handleUpdate = () => { fetchRiderNetwork(); };
    window.addEventListener("kaindra:connection_updated", handleUpdate);
    return () => { window.removeEventListener("kaindra:connection_updated", handleUpdate); };
  }, [fetchRiderNetwork]);

  const getConnectionStatus = useCallback((riderId) => {
    const rId = String(riderId);
    if (connections.some((c) => String(c.id) === rId)) return "CONNECTED";
    if (incomingRequests.some((r) => String(r.id) === rId)) return "INCOMING";
    if (outgoingRequests.some((r) => String(r.id) === rId)) return "REQUESTED";
    return "CONNECT";
  }, [connections, incomingRequests, outgoingRequests]);

  // Tab Filtering — using exclusively live data
  const activeTabRiders = useMemo(() => {
    if (activeTab === "CONNECTIONS") {
      return connections;
    }
    if (activeTab === "REQUESTS") {
      return [...incomingRequests, ...outgoingRequests];
    }
    // DISCOVER: Registered database riders who are not already connected
    return dbRiders.filter((r) => {
      const status = getConnectionStatus(r.id);
      return status !== "CONNECTED";
    });
  }, [activeTab, connections, incomingRequests, outgoingRequests, dbRiders, getConnectionStatus]);

  const filteredRiders = useMemo(() => {
    return activeTabRiders.filter((rider) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        rider.name.toLowerCase().includes(q) ||
        (rider.location || "").toLowerCase().includes(q) ||
        (rider.bike || "").toLowerCase().includes(q);

      const matchesStyle =
        styleFilter === "ALL" || rider.style === styleFilter;

      return matchesSearch && matchesStyle;
    });
  }, [activeTabRiders, search, styleFilter]);

  // Real backend actions
  const sendConnectionRequest = async (riderId) => {
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }
    try {
      await apiClient.post("/api/core/connections/request", { toUserId: riderId });
      setOutgoingRequests((prev) => [...prev, { id: String(riderId), name: "Rider" }]);
      window.dispatchEvent(new CustomEvent("kaindra:connection_updated"));
      await fetchRiderNetwork();
    } catch (err) {
      console.error("Failed to send connection request:", err);
    }
  };

  const cancelRequest = async (riderId) => {
    if (!isAuthenticated) return;
    const req = outgoingRequests.find((r) => String(r.id) === String(riderId));
    setOutgoingRequests((prev) => prev.filter((r) => String(r.id) !== String(riderId)));
    if (req?.requestId) {
      try {
        await apiClient.patch(`/api/core/connections/requests/${req.requestId}/respond`, { action: "reject" }).catch(() => {});
        window.dispatchEvent(new CustomEvent("kaindra:connection_updated"));
      } catch (err) {
        console.error("Failed to cancel request:", err);
      }
    }
  };

  const acceptRequest = async (riderId) => {
    if (!isAuthenticated) return;
    const inc = incomingRequests.find((r) => String(r.id) === String(riderId));
    if (inc?.requestId) {
      try {
        await apiClient.patch(`/api/core/connections/requests/${inc.requestId}/respond`, { action: "accept" });
        window.dispatchEvent(new CustomEvent("kaindra:connection_updated"));
        await fetchRiderNetwork();
      } catch (err) {
        console.error("Failed to accept request:", err);
      }
    }
  };

  const removeConnection = async (riderId) => {
    const conn = connections.find((c) => String(c.id) === String(riderId));
    setConnections((prev) => prev.filter((c) => String(c.id) !== String(riderId)));
    if (conn?.connectionId) {
      try {
        await apiClient.delete(`/api/core/connections/${conn.connectionId}`).catch(() => {});
        window.dispatchEvent(new CustomEvent("kaindra:connection_updated"));
      } catch (err) {
        console.error("Failed to remove connection:", err);
      }
    }
  };

  const toggleFollow = (riderId) => {
    setFollowing((current) =>
      current.includes(riderId)
        ? current.filter((id) => id !== riderId)
        : [...current, riderId]
    );
  };

  const totalRequestsCount = incomingRequests.length + outgoingRequests.length;

  return (
    <section className="rider-connect-section" id="rider-connect">
      <div className="rider-connect-container">

        {/* HEADER */}
        <div className="rider-connect-header">
          <div>
            <span className="rider-connect-eyebrow">
              MOTOTRIBE / RIDER CONNECTION
            </span>

            <h2>Find your tribe.</h2>

            <p>
              Connect with riders who share your routes,
              riding style and passion for the road.
            </p>
          </div>

          <div className="rider-connect-summary">
            <div>
              <strong>{connections.length}</strong>
              <span>CONNECTIONS</span>
            </div>

            <div>
              <strong>{totalRequestsCount}</strong>
              <span>REQUESTS</span>
            </div>

            <div>
              <strong>{following.length}</strong>
              <span>FOLLOWING</span>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="rider-connect-tabs">
          <button
            className={activeTab === "DISCOVER" ? "active" : ""}
            onClick={() => setActiveTab("DISCOVER")}
          >
            DISCOVER
          </button>

          <button
            className={activeTab === "CONNECTIONS" ? "active" : ""}
            onClick={() => setActiveTab("CONNECTIONS")}
          >
            CONNECTIONS
            {connections.length > 0 && (
              <span>{connections.length}</span>
            )}
          </button>

          <button
            className={activeTab === "REQUESTS" ? "active" : ""}
            onClick={() => setActiveTab("REQUESTS")}
          >
            REQUESTS
            {totalRequestsCount > 0 && (
              <span>{totalRequestsCount}</span>
            )}
          </button>
        </div>

        {/* CONTROLS */}
        <div className="rider-connect-controls">
          <input
            type="text"
            placeholder="Search riders, cities or motorcycles..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className="rider-style-filters">
            {[
              "ALL",
              "ADVENTURE",
              "TOURING",
              "CRUISER",
              "SPORT",
            ].map((style) => (
              <button
                key={style}
                className={styleFilter === style ? "active" : ""}
                onClick={() => setStyleFilter(style)}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* RIDERS GRID */}
        <div className="rider-connect-grid">
          {loading && filteredRiders.length === 0 ? (
            <div className="connection-empty">
              <span>SYNCING NETWORK</span>
              <h3>Connecting to live rider network...</h3>
            </div>
          ) : filteredRiders.length > 0 ? (
            filteredRiders.map((rider) => {
              const connectionStatus = getConnectionStatus(rider.id);

              return (
                <article
                  className="connection-rider-card"
                  key={rider.id}
                >
                  <div className="connection-card-top">
                    <div className="connection-avatar">
                      {rider.name.charAt(0).toUpperCase()}
                    </div>

                    <span className="connection-style">
                      {rider.style}
                    </span>
                  </div>

                  <div className="connection-card-content">
                    <h3>{rider.name}</h3>

                    <p className="connection-location">
                      {rider.location}
                      <span>•</span>
                      {rider.experience}
                    </p>

                    <div className="connection-bike">
                      <span>MOTORCYCLE</span>
                      <strong>{rider.bike}</strong>
                    </div>

                    <div className="connection-meta">
                      <div>
                        <strong>{rider.rides}</strong>
                        <span>RIDES</span>
                      </div>

                      <div>
                        <strong>{rider.mutual || 0}</strong>
                        <span>MUTUAL</span>
                      </div>
                    </div>
                  </div>

                  <div className="connection-card-actions">
                    <button
                      className="profile-button"
                      onClick={() => setSelectedRider(rider)}
                    >
                      VIEW PROFILE
                    </button>

                    {connectionStatus === "CONNECTED" ? (
                      <button
                        className="connection-action connected"
                        onClick={() => removeConnection(rider.id)}
                      >
                        CONNECTED ✓
                      </button>
                    ) : connectionStatus === "INCOMING" ? (
                      <button
                        className="connection-action"
                        style={{ background: "#c9a45d", color: "#090a09", fontWeight: 800 }}
                        onClick={() => acceptRequest(rider.id)}
                      >
                        ✓ ACCEPT
                      </button>
                    ) : connectionStatus === "REQUESTED" ? (
                      <button
                        className="connection-action requested"
                        onClick={() => cancelRequest(rider.id)}
                      >
                        REQUESTED · CANCEL
                      </button>
                    ) : (
                      <button
                        className="connection-action"
                        onClick={() => sendConnectionRequest(rider.id)}
                      >
                        CONNECT
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="connection-empty">
              <span>NO RIDERS FOUND</span>
              <h3>
                {activeTab === "DISCOVER"
                  ? "No new riders to discover right now."
                  : activeTab === "CONNECTIONS"
                  ? "No accepted connections in your tribe yet."
                  : "No pending connection requests."}
              </h3>
            </div>
          )}
        </div>

        {/* MODAL */}
        {selectedRider && (
          <div
            className="rider-profile-overlay"
            onClick={() => setSelectedRider(null)}
          >
            <div
              className="rider-profile-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="profile-close"
                onClick={() => setSelectedRider(null)}
              >
                ×
              </button>

              <div className="modal-avatar">
                {selectedRider.name.charAt(0).toUpperCase()}
              </div>

              <span className="modal-style">
                {selectedRider.style}
              </span>

              <h2>{selectedRider.name}</h2>

              <p className="modal-location">
                {selectedRider.location}
              </p>

              <p className="modal-bio">
                {selectedRider.bio}
              </p>

              <div className="modal-details">
                <div>
                  <span>MOTORCYCLE</span>
                  <strong>{selectedRider.bike}</strong>
                </div>

                <div>
                  <span>EXPERIENCE</span>
                  <strong>{selectedRider.experience}</strong>
                </div>

                <div>
                  <span>TOTAL RIDES</span>
                  <strong>{selectedRider.rides}</strong>
                </div>
              </div>

              <div className="modal-actions">
                {getConnectionStatus(selectedRider.id) === "CONNECTED" ? (
                  <>
                    <button
                      onClick={() => removeConnection(selectedRider.id)}
                    >
                      REMOVE CONNECTION
                    </button>
                    <button
                      onClick={() => alert(`Direct conversation with ${selectedRider.name} opened.`)}
                    >
                      MESSAGE
                    </button>
                  </>
                ) : getConnectionStatus(selectedRider.id) === "INCOMING" ? (
                  <button
                    style={{ background: "#c9a45d", color: "#090a09", fontWeight: 800 }}
                    onClick={() => acceptRequest(selectedRider.id)}
                  >
                    ✓ ACCEPT REQUEST
                  </button>
                ) : getConnectionStatus(selectedRider.id) === "REQUESTED" ? (
                  <button
                    onClick={() => cancelRequest(selectedRider.id)}
                  >
                    CANCEL REQUEST
                  </button>
                ) : (
                  <button
                    onClick={() => sendConnectionRequest(selectedRider.id)}
                  >
                    CONNECT
                  </button>
                )}

                <button
                  className={following.includes(selectedRider.id) ? "following" : ""}
                  onClick={() => toggleFollow(selectedRider.id)}
                >
                  {following.includes(selectedRider.id)
                    ? "FOLLOWING ✓"
                    : "FOLLOW"}
                </button>

                <button
                  onClick={() =>
                    alert(`Ride invitation sent to ${selectedRider.name}.`)
                  }
                >
                  INVITE TO RIDE
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

export default RiderConnect;