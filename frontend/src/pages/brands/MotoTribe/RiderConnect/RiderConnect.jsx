import { useEffect, useMemo, useState } from "react";
import "./RiderConnect.css";

const DEMO_RIDERS = [
  {
    id: "rider-001",
    name: "Arjun Reddy",
    riderId: "MT-ARJ-1024",
    location: "Hyderabad",
    experience: "Advanced",
    rideTypes: ["Adventure", "Touring"],
    motorcycle: "Royal Enfield Himalayan 450",
    completedRides: 48,
    distance: 18420,
    longestRide: "1,240 KM",
    rating: 4.9,
    avatar: "AR",
    online: true,
    bio: "Long-distance adventure rider who enjoys discovering mountain roads and remote destinations.",
  },
  {
    id: "rider-002",
    name: "Vikram Singh",
    riderId: "MT-VIK-2088",
    location: "Bengaluru",
    experience: "Pro",
    rideTypes: ["Touring", "Long Distance"],
    motorcycle: "BMW G 310 GS",
    completedRides: 76,
    distance: 32650,
    longestRide: "1,850 KM",
    rating: 4.8,
    avatar: "VS",
    online: true,
    bio: "Touring enthusiast with extensive experience across South Indian highways and hill routes.",
  },
  {
    id: "rider-003",
    name: "Sneha Rao",
    riderId: "MT-SNE-3142",
    location: "Chennai",
    experience: "Intermediate",
    rideTypes: ["Touring", "Cruiser"],
    motorcycle: "Honda H'ness CB350",
    completedRides: 31,
    distance: 9650,
    longestRide: "780 KM",
    rating: 4.7,
    avatar: "SR",
    online: false,
    bio: "Weekend touring rider interested in scenic routes, food stops and relaxed group rides.",
  },
  {
    id: "rider-004",
    name: "Karthik Kumar",
    riderId: "MT-KAR-4291",
    location: "Kochi",
    experience: "Advanced",
    rideTypes: ["Adventure", "Long Distance"],
    motorcycle: "KTM Adventure 390",
    completedRides: 62,
    distance: 24800,
    longestRide: "1,520 KM",
    rating: 4.9,
    avatar: "KK",
    online: true,
    bio: "Adventure rider focused on challenging terrain, route discovery and rider safety.",
  },
  {
    id: "rider-005",
    name: "Meera Nair",
    riderId: "MT-MEE-5017",
    location: "Pune",
    experience: "Beginner",
    rideTypes: ["Cruiser", "Touring"],
    motorcycle: "Yamaha FZ-X",
    completedRides: 14,
    distance: 3250,
    longestRide: "420 KM",
    rating: 4.6,
    avatar: "MN",
    online: true,
    bio: "New-generation rider learning long-distance touring and looking for experienced riding groups.",
  },
  {
    id: "rider-006",
    name: "Rahul Varma",
    riderId: "MT-RAH-6382",
    location: "Visakhapatnam",
    experience: "Advanced",
    rideTypes: ["Adventure", "Touring"],
    motorcycle: "Suzuki V-Strom 650",
    completedRides: 54,
    distance: 21780,
    longestRide: "1,410 KM",
    rating: 4.8,
    avatar: "RV",
    online: false,
    bio: "Adventure and touring rider who enjoys coastal roads and multi-day motorcycle journeys.",
  },
];

const STORAGE_KEYS = {
  connections: "mototribeConnections",
  requests: "mototribeConnectionRequests",
  following: "mototribeFollowing",
};

function RiderConnect() {
  const [riders] = useState(DEMO_RIDERS);

  const [activeTab, setActiveTab] = useState("discover");
  const [search, setSearch] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("ALL");
  const [rideTypeFilter, setRideTypeFilter] = useState("ALL");

  const [connections, setConnections] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.connections) || "[]");
    } catch {
      return [];
    }
  });
  const [requests, setRequests] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.requests) || "[]");
    } catch {
      return [];
    }
  });
  const [following, setFollowing] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.following) || "[]");
    } catch {
      return [];
    }
  });

  const [selectedRider, setSelectedRider] = useState(null);
  const [notification, setNotification] = useState("");

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.connections,
      JSON.stringify(connections)
    );
  }, [connections]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.requests, JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.following,
      JSON.stringify(following)
    );
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

  const connectedRiders = riders.filter((rider) =>
    connections.includes(rider.id)
  );

  const followingRiders = riders.filter((rider) =>
    following.includes(rider.id)
  );

  const requestRiders = riders.filter((rider) =>
    requests.includes(rider.id)
  );

  const sendConnectionRequest = (riderId) => {
    if (connections.includes(riderId)) {
      setNotification("You are already connected with this rider.");
      return;
    }

    if (requests.includes(riderId)) {
      setNotification("Connection request already sent.");
      return;
    }

    setRequests((previous) => [...previous, riderId]);
    setNotification("Connection request sent.");
  };

  const cancelConnectionRequest = (riderId) => {
    setRequests((previous) =>
      previous.filter((id) => id !== riderId)
    );

    setNotification("Connection request cancelled.");
  };

  const acceptConnection = (riderId) => {
    setRequests((previous) =>
      previous.filter((id) => id !== riderId)
    );

    setConnections((previous) =>
      previous.includes(riderId)
        ? previous
        : [...previous, riderId]
    );

    setNotification("Rider added to your connections.");
  };

  const rejectConnection = (riderId) => {
    setRequests((previous) =>
      previous.filter((id) => id !== riderId)
    );

    setNotification("Connection request rejected.");
  };

  const removeConnection = (riderId) => {
    setConnections((previous) =>
      previous.filter((id) => id !== riderId)
    );

    setNotification("Rider removed from your connections.");
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

  const openProfile = (rider) => {
    setSelectedRider(rider);
  };

  const closeProfile = () => {
    setSelectedRider(null);
  };

  const messageRider = (rider) => {
    setNotification(`Message channel opened for ${rider.name}.`);
  };

  const inviteRider = (rider) => {
    setNotification(`${rider.name} has been invited to your ride.`);
  };

  const getConnectionStatus = (riderId) => {
    if (connections.includes(riderId)) {
      return "connected";
    }

    if (requests.includes(riderId)) {
      return "pending";
    }

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
              {rider.distance.toLocaleString()} KM
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
              onClick={() =>
                cancelConnectionRequest(rider.id)
              }
            >
              REQUESTED
            </button>
          )}

          {connectionStatus === "connected" && (
            <button
              className="connected-action"
              onClick={() => messageRider(rider)}
            >
              MESSAGE
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
              <strong>{requests.length}</strong>
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
            <span>{requests.length}</span>
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

            {filteredRiders.length > 0 ? (
              <div className="rider-grid">
                {filteredRiders.map(renderRiderCard)}
              </div>
            ) : (
              <div className="empty-state">
                <div>⌕</div>
                <h3>NO RIDERS FOUND</h3>
                <p>
                  Try changing your search or filter criteria.
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
            {connectedRiders.length > 0 ? (
              <div className="rider-grid">
                {connectedRiders.map((rider) => (
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
                        onClick={() => messageRider(rider)}
                      >
                        MESSAGE
                      </button>

                      <button
                        onClick={() => inviteRider(rider)}
                      >
                        INVITE
                      </button>

                      <button
                        className="remove-button"
                        onClick={() =>
                          removeConnection(rider.id)
                        }
                      >
                        REMOVE
                      </button>
                    </div>
                  </div>
                ))}
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
            {requestRiders.length > 0 ? (
              <div className="requests-list">
                {requestRiders.map((rider) => (
                  <div
                    className="request-card"
                    key={rider.id}
                  >
                    <div className="mini-avatar">
                      {rider.avatar}
                    </div>

                    <div className="request-info">
                      <h3>{rider.name}</h3>
                      <p>
                        {rider.experience} · {rider.location}
                      </p>
                      <span>
                        {rider.completedRides} completed
                        rides
                      </span>
                    </div>

                    <div className="request-actions">
                      <button
                        className="accept-button"
                        onClick={() =>
                          acceptConnection(rider.id)
                        }
                      >
                        ACCEPT
                      </button>

                      <button
                        className="reject-button"
                        onClick={() =>
                          rejectConnection(rider.id)
                        }
                      >
                        REJECT
                      </button>
                    </div>
                  </div>
                ))}
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
                  VERIFIED RIDER
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
                {selectedRider.online
                  ? "ONLINE"
                  : "OFFLINE"}
              </span>

              <span>
                ★ {selectedRider.rating} RIDER RATING
              </span>
            </div>

            <p className="profile-description">
              {selectedRider.bio}
            </p>

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