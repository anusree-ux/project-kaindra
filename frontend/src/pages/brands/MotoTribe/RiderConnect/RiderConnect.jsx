import { useEffect, useMemo, useState, useCallback } from "react";
import apiClient from "../../../../services/apiClient";
import "./RiderConnect.css";

const STORAGE_KEYS = {
  following: "mototribeFollowing",
};

function RiderConnect() {
  const [riders, setRiders] = useState([]);
  const [connections, setConnections] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("discover");
  const [search, setSearch] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("ALL");
  const [rideTypeFilter, setRideTypeFilter] = useState("ALL");

  const [following, setFollowing] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.following) || "[]");
    } catch {
      return [];
    }
  });

  const [selectedRider, setSelectedRider] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [notification, setNotification] = useState("");

  // 1. Fetch live data from backend (riders nearby, connections, requests)
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [ridersRes, connRes, incRes, outRes] = await Promise.allSettled([
        apiClient.get("/api/mototribe/riders-nearby?lat=12.9716&lng=77.5946&radius=1000000&filter=all"),
        apiClient.get("/api/core/connections"),
        apiClient.get("/api/core/connections/requests/incoming"),
        apiClient.get("/api/core/connections/requests/outgoing"),
      ]);

      if (ridersRes.status === "fulfilled") {
        const rawList = ridersRes.value.data.data?.riders || [];
        const formatted = rawList.map((r) => {
          const riderName = r.name || "Rider";
          const initials = riderName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
          const trustRating = (r.trustScore / 20).toFixed(1);

          let expLabel = "Beginner";
          if (r.totalRidesCompleted > 20) expLabel = "Pro";
          else if (r.totalRidesCompleted > 10) expLabel = "Advanced";
          else if (r.totalRidesCompleted > 3) expLabel = "Intermediate";

          return {
            id: r.userId,
            name: riderName,
            riderId: `MT-${String(r.userId).substring(0, 6).toUpperCase()}`,
            location: r.distanceKm ? `${r.distanceKm} KM away` : "Nearby",
            experience: expLabel,
            rideTypes: [r.preferredRideType ? r.preferredRideType.toUpperCase() : "TOURING"],
            motorcycle: r.primaryVehicleName || "Rider Bike",
            completedRides: r.totalRidesCompleted || 0,
            distance: r.totalDistanceKm || 0,
            longestRide: r.currentJourney ? r.currentJourney.title : "N/A",
            rating: trustRating,
            avatar: initials,
            online: r.status === "riding",
            bio: r.currentJourney ? `Currently riding: ${r.currentJourney.title}` : "Verified MotoTribe rider",
          };
        });
        setRiders(formatted);
      }

      if (connRes.status === "fulfilled") {
        setConnections(connRes.value.data.data?.connections || []);
      }

      if (incRes.status === "fulfilled") {
        setIncomingRequests(incRes.value.data.data?.requests || []);
      }

      if (outRes.status === "fulfilled") {
        setOutgoingRequests(outRes.value.data.data?.requests || []);
      }
    } catch (err) {
      console.error("Error fetching RiderConnect backend data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.following, JSON.stringify(following));
  }, [following]);

  useEffect(() => {
    if (!notification) return;

    const timer = setTimeout(() => {
      setNotification("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [notification]);

  const filteredRiders = useMemo(() => {
    return riders.filter((rider) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        rider.name.toLowerCase().includes(searchValue) ||
        rider.location.toLowerCase().includes(searchValue) ||
        rider.motorcycle.toLowerCase().includes(searchValue) ||
        rider.rideTypes.some((type) =>
          type.toLowerCase().includes(searchValue)
        );

      const matchesExperience =
        experienceFilter === "ALL" ||
        rider.experience.toUpperCase() === experienceFilter;

      const matchesRideType =
        rideTypeFilter === "ALL" ||
        rider.rideTypes.some(
          (type) => type.toUpperCase() === rideTypeFilter
        );

      return matchesSearch && matchesExperience && matchesRideType;
    });
  }, [riders, search, experienceFilter, rideTypeFilter]);

  const followingRiders = riders.filter((rider) =>
    following.includes(rider.id)
  );

  const sendConnectionRequest = async (riderId) => {
    try {
      await apiClient.post("/api/core/connections/request", { toUserId: riderId });
      setNotification("Connection request sent.");
      fetchAllData();
    } catch (err) {
      setNotification(err.response?.data?.message || "Failed to send request.");
    }
  };

  const acceptConnection = async (requestId) => {
    try {
      await apiClient.patch(`/api/core/connections/requests/${requestId}/respond`, {
        status: "accepted",
      });
      setNotification("Rider added to your connections.");
      fetchAllData();
    } catch (err) {
      setNotification(err.response?.data?.message || "Failed to accept connection.");
    }
  };

  const rejectConnection = async (requestId) => {
    try {
      await apiClient.patch(`/api/core/connections/requests/${requestId}/respond`, {
        status: "ignored",
      });
      setNotification("Connection request rejected.");
      fetchAllData();
    } catch (err) {
      setNotification(err.response?.data?.message || "Failed to reject connection.");
    }
  };

  const toggleFollow = (riderId) => {
    if (following.includes(riderId)) {
      setFollowing((previous) =>
        previous.filter((id) => id !== riderId)
      );

      setNotification("Rider unfollowed.");
    } else {
      setFollowing((previous) => [...previous, riderId]);
      setNotification("Now following this rider.");
    }
  };

  const openProfile = async (rider) => {
    setSelectedRider(rider);
    setModalLoading(true);
    try {
      const res = await apiClient.get(`/api/mototribe/riders/${rider.id}/profile-card`);
      const card = res.data.data?.profileCard;
      if (card) {
        setSelectedRider({
          ...rider,
          name: card.name,
          motorcycle: card.primaryVehicleName || rider.motorcycle,
          completedRides: card.totalRidesCompleted || rider.completedRides,
          distance: card.totalDistanceKm || rider.distance,
          rating: (card.trustScore / 20).toFixed(1),
          bio: card.currentJourney ? `Currently riding: ${card.currentJourney.title}` : rider.bio,
        });
      }
    } catch {
      // Keep basic info on error
    } finally {
      setModalLoading(false);
    }
  };

  const closeProfile = () => {
    setSelectedRider(null);
  };

  const getConnectionStatus = (riderId) => {
    const isConnected = connections.some(
      (c) =>
        c.fromUserId?._id === riderId ||
        c.toUserId?._id === riderId ||
        c.fromUserId === riderId ||
        c.toUserId === riderId
    );
    if (isConnected) return "connected";

    const isPendingOutgoing = outgoingRequests.some(
      (r) => (r.toUserId?._id || r.toUserId) === riderId
    );
    if (isPendingOutgoing) return "pending";

    return "none";
  };

  const renderRiderCard = (rider) => {
    const connectionStatus = getConnectionStatus(rider.id);
    const isFollowing = following.includes(rider.id);

    return (
      <article className="rider-connect-card" key={rider.id}>
        <div className="rider-card-top">
          <div className="rider-avatar-wrapper">
            <div className="rider-avatar">{rider.avatar}</div>

            <span
              className={`rider-online-dot ${
                rider.online ? "online" : "offline"
              }`}
            />
          </div>

          <div className="rider-basic-info">
            <h3>{rider.name}</h3>
            <span>{rider.riderId}</span>
            <p>📍 {rider.location}</p>
          </div>
        </div>

        <div className="rider-experience-row">
          <span className="experience-badge">
            {rider.experience}
          </span>

          <span className="rider-rating">
            ★ {rider.rating}
          </span>
        </div>

        <div className="rider-bike">
          <span className="bike-icon">🏍</span>
          <div>
            <small>MOTORCYCLE</small>
            <strong>{rider.motorcycle}</strong>
          </div>
        </div>

        <div className="rider-stats">
          <div>
            <strong>{rider.completedRides}</strong>
            <span>RIDES</span>
          </div>

          <div>
            <strong>
              {Number(rider.distance).toLocaleString()} KM
            </strong>
            <span>DISTANCE</span>
          </div>

          <div>
            <strong>{rider.longestRide}</strong>
            <span>LONGEST</span>
          </div>
        </div>

        <div className="ride-type-list">
          {rider.rideTypes.map((type) => (
            <span key={type}>{type}</span>
          ))}
        </div>

        <p className="rider-bio">{rider.bio}</p>

        <div className="rider-card-actions">
          <button
            className="outline-action"
            onClick={() => openProfile(rider)}
          >
            VIEW PROFILE
          </button>

          {connectionStatus === "none" && (
            <button
              className="primary-action"
              onClick={() => sendConnectionRequest(rider.id)}
            >
              CONNECT
            </button>
          )}

          {connectionStatus === "pending" && (
            <button
              className="pending-action"
              disabled
            >
              REQUESTED
            </button>
          )}

          {connectionStatus === "connected" && (
            <button
              className="connected-action"
              onClick={() => setNotification(`Connected with ${rider.name}`)}
            >
              CONNECTED ✓
            </button>
          )}
        </div>

        <button
          className={`follow-button ${
            isFollowing ? "following" : ""
          }`}
          onClick={() => toggleFollow(rider.id)}
        >
          {isFollowing ? "✓ FOLLOWING" : "+ FOLLOW RIDER"}
        </button>
      </article>
    );
  };

  return (
    <section id="rider-connect" className="rider-connect-section">
      <div className="rider-connect-container">
        {notification && (
          <div
            style={{
              padding: "10px 16px",
              background: "rgba(0, 230, 118, 0.15)",
              border: "1px solid #00e676",
              color: "#00e676",
              marginBottom: "15px",
              borderRadius: "4px",
              fontSize: "12px",
              letterSpacing: "1px",
            }}
          >
            {notification}
          </div>
        )}

        <div className="rider-connect-heading">
          <div>
            <span className="section-kicker">
              MOTOTRIBE NETWORK
            </span>

            <h2>
              FIND YOUR
              <span> TRIBE.</span>
            </h2>

            <p>
              Connect with riders who share your roads,
              experience and passion for two wheels.
            </p>
          </div>

          <div className="network-summary">
            <div>
              <strong>{riders.length}</strong>
              <span>RIDERS</span>
            </div>

            <div>
              <strong>{connections.length}</strong>
              <span>CONNECTED</span>
            </div>

            <div>
              <strong>{incomingRequests.length}</strong>
              <span>PENDING</span>
            </div>
          </div>
        </div>

        <div className="rider-connect-tabs">
          <button
            className={activeTab === "discover" ? "active" : ""}
            onClick={() => setActiveTab("discover")}
          >
            DISCOVER RIDERS
          </button>

          <button
            className={activeTab === "connections" ? "active" : ""}
            onClick={() => setActiveTab("connections")}
          >
            MY CONNECTIONS
            <span>{connections.length}</span>
          </button>

          <button
            className={activeTab === "requests" ? "active" : ""}
            onClick={() => setActiveTab("requests")}
          >
            REQUESTS
            <span>{incomingRequests.length}</span>
          </button>

          <button
            className={activeTab === "following" ? "active" : ""}
            onClick={() => setActiveTab("following")}
          >
            FOLLOWING
            <span>{following.length}</span>
          </button>
        </div>

        {activeTab === "discover" && (
          <>
            <div className="rider-connect-controls">
              <div className="rider-search">
                <span>⌕</span>

                <input
                  type="text"
                  placeholder="Search riders, cities or motorcycles..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />

                {search && (
                  <button onClick={() => setSearch("")}>
                    ×
                  </button>
                )}
              </div>

              <select
                value={experienceFilter}
                onChange={(event) =>
                  setExperienceFilter(event.target.value)
                }
              >
                <option value="ALL">ALL EXPERIENCE</option>
                <option value="BEGINNER">BEGINNER</option>
                <option value="INTERMEDIATE">
                  INTERMEDIATE
                </option>
                <option value="ADVANCED">ADVANCED</option>
                <option value="PRO">PRO</option>
              </select>

              <select
                value={rideTypeFilter}
                onChange={(event) =>
                  setRideTypeFilter(event.target.value)
                }
              >
                <option value="ALL">ALL RIDE TYPES</option>
                <option value="ADVENTURE">ADVENTURE</option>
                <option value="TOURING">TOURING</option>
                <option value="CRUISER">CRUISER</option>
                <option value="LONG DISTANCE">
                  LONG DISTANCE
                </option>
              </select>
            </div>

            <div className="result-count">
              SHOWING{" "}
              <strong>{filteredRiders.length}</strong>{" "}
              RIDERS
            </div>

            {loading ? (
              <div className="empty-state">
                <div>⌛</div>
                <h3>LOADING RIDERS FROM DATABASE</h3>
                <p>Fetching rider profiles from MotoTribe network...</p>
              </div>
            ) : filteredRiders.length > 0 ? (
              <div className="rider-grid">
                {filteredRiders.map(renderRiderCard)}
              </div>
            ) : (
              <div className="empty-state">
                <div>⌕</div>
                <h3>NO RIDERS FOUND IN DATABASE</h3>
                <p>
                  No discoverable riders matching your query exist in the database.
                </p>

                <button
                  onClick={() => {
                    setSearch("");
                    setExperienceFilter("ALL");
                    setRideTypeFilter("ALL");
                  }}
                >
                  CLEAR FILTERS
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === "connections" && (
          <div className="tab-content">
            {connections.length > 0 ? (
              <div className="rider-grid">
                {connections.map((conn) => {
                  const friend = conn.fromUserId?._id === conn.toUserId?._id ? conn.toUserId : conn.fromUserId || {};
                  return (
                    <div
                      className="connection-card"
                      key={conn._id}
                    >
                      <div className="mini-avatar">
                        {friend.name ? friend.name.substring(0, 2).toUpperCase() : "R"}
                      </div>

                      <div>
                        <h3>{friend.name || "Connected Rider"}</h3>
                        <p>{friend.email}</p>
                      </div>

                      <div className="connection-actions">
                        <button
                          onClick={() => setNotification(`Message sent to ${friend.name}`)}
                        >
                          MESSAGE
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div>◎</div>
                <h3>NO CONNECTIONS YET</h3>
                <p>
                  Discover riders and build your MotoTribe
                  network.
                </p>

                <button
                  onClick={() => setActiveTab("discover")}
                >
                  DISCOVER RIDERS
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "requests" && (
          <div className="tab-content">
            {incomingRequests.length > 0 ? (
              <div className="requests-list">
                {incomingRequests.map((req) => {
                  const sender = req.fromUserId || {};
                  return (
                    <div
                      className="request-card"
                      key={req._id}
                    >
                      <div className="mini-avatar">
                        {sender.name ? sender.name.substring(0, 2).toUpperCase() : "R"}
                      </div>

                      <div className="request-info">
                        <h3>{sender.name || "Rider Request"}</h3>
                        <p>{sender.email}</p>
                      </div>

                      <div className="request-actions">
                        <button
                          className="accept-button"
                          onClick={() =>
                            acceptConnection(req._id)
                          }
                        >
                          ACCEPT
                        </button>

                        <button
                          className="reject-button"
                          onClick={() =>
                            rejectConnection(req._id)
                          }
                        >
                          REJECT
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div>✓</div>
                <h3>NO PENDING REQUESTS</h3>
                <p>
                  New connection requests will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "following" && (
          <div className="tab-content">
            {followingRiders.length > 0 ? (
              <div className="rider-grid">
                {followingRiders.map((rider) => (
                  <div
                    className="connection-card"
                    key={rider.id}
                  >
                    <div className="mini-avatar">
                      {rider.avatar}
                    </div>

                    <div>
                      <h3>{rider.name}</h3>
                      <p>
                        {rider.experience} · {rider.location}
                      </p>
                      <span>{rider.motorcycle}</span>
                    </div>

                    <div className="connection-actions">
                      <button
                        onClick={() => openProfile(rider)}
                      >
                        PROFILE
                      </button>

                      <button
                        className="remove-button"
                        onClick={() =>
                          toggleFollow(rider.id)
                        }
                      >
                        UNFOLLOW
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div>+</div>
                <h3>NOT FOLLOWING ANYONE</h3>
                <p>
                  Follow riders to keep track of their journey
                  activity.
                </p>

                <button
                  onClick={() => setActiveTab("discover")}
                >
                  FIND RIDERS
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedRider && (
        <div className="profile-overlay" onClick={closeProfile}>
          <div
            className="rider-profile-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={closeProfile}
            >
              ×
            </button>

            <div className="profile-modal-header">
              <div className="profile-large-avatar">
                {selectedRider.avatar}
              </div>

              <div>
                <span className="profile-label">
                  {modalLoading ? "LOADING..." : "VERIFIED RIDER"}
                </span>

                <h2>{selectedRider.name}</h2>

                <p>
                  {selectedRider.riderId} ·{" "}
                  {selectedRider.location}
                </p>
              </div>
            </div>

            <div className="profile-status">
              <span
                className={
                  selectedRider.online
                    ? "status-online"
                    : "status-offline"
                }
              >
                ●{" "}
                {selectedRider.online ? "ONLINE NOW" : "OFFLINE"}
              </span>

              <span>
                ★ {selectedRider.rating} RIDER RATING
              </span>
            </div>


            <div className="profile-details-grid">
              <div>
                <small>EXPERIENCE</small>
                <strong>{selectedRider.experience}</strong>
              </div>

              <div>
                <small>MOTORCYCLE</small>
                <strong>{selectedRider.motorcycle}</strong>
              </div>

              <div>
                <small>COMPLETED RIDES</small>
                <strong>
                  {selectedRider.completedRides}
                </strong>
              </div>

              <div>
                <small>TOTAL DISTANCE</small>
                <strong>
                  {selectedRider.distance.toLocaleString()} KM
                </strong>
              </div>

              <div>
                <small>LONGEST RIDE</small>
                <strong>
                  {selectedRider.longestRide}
                </strong>
              </div>

              <div>
                <small>RIDE TYPES</small>
                <strong>
                  {selectedRider.rideTypes.join(" · ")}
                </strong>
              </div>
            </div>

            <div className="profile-modal-actions">
              {getConnectionStatus(selectedRider.id) ===
                "none" && (
                <button
                  className="primary-action"
                  onClick={() =>
                    sendConnectionRequest(
                      selectedRider.id
                    )
                  }
                >
                  CONNECT
                </button>
              )}

              {getConnectionStatus(selectedRider.id) ===
                "pending" && (
                <button
                  className="pending-action"
                  onClick={() =>
                    cancelConnectionRequest(
                      selectedRider.id
                    )
                  }
                >
                  REQUESTED
                </button>
              )}

              {getConnectionStatus(selectedRider.id) ===
                "connected" && (
                <button
                  className="connected-action"
                  onClick={() =>
                    messageRider(selectedRider)
                  }
                >
                  MESSAGE
                </button>
              )}

              <button
                className="outline-action"
                onClick={() =>
                  toggleFollow(selectedRider.id)
                }
              >
                {following.includes(selectedRider.id)
                  ? "UNFOLLOW"
                  : "FOLLOW"}
              </button>

              <button
                className="outline-action"
                onClick={() =>
                  inviteRider(selectedRider)
                }
              >
                INVITE TO RIDE
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className="rider-notification">
          <span>✓</span>
          {notification}
        </div>
      )}
    </section>
  );
}

export default RiderConnect;