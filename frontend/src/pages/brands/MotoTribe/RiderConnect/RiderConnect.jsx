import { useEffect, useMemo, useState } from "react";
import "./RiderConnect.css";

const STORAGE_KEYS = {
  connections: "mototribeConnections",
  requests: "mototribeConnectionRequests",
  following: "mototribeFollowing",
};

const riderData = [
  {
    id: "rc-001",
    name: "Arjun",
    location: "Delhi",
    bike: "Royal Enfield Himalayan",
    style: "ADVENTURE",
    experience: "ADVANCED",
    rides: 42,
    mutual: 8,
    bio: "Weekend adventure rider exploring long-distance mountain routes.",
  },
  {
    id: "rc-002",
    name: "Rahul",
    location: "Chandigarh",
    bike: "KTM Adventure 390",
    style: "ADVENTURE",
    experience: "INTERMEDIATE",
    rides: 27,
    mutual: 5,
    bio: "Adventure rider interested in Himalayan and North India routes.",
  },
  {
    id: "rc-003",
    name: "Meera",
    location: "Bengaluru",
    bike: "Yamaha MT-15",
    style: "TOURING",
    experience: "INTERMEDIATE",
    rides: 31,
    mutual: 11,
    bio: "Touring enthusiast who enjoys discovering new weekend routes.",
  },
  {
    id: "rc-004",
    name: "Vikram",
    location: "Visakhapatnam",
    bike: "Royal Enfield Classic 350",
    style: "CRUISER",
    experience: "ADVANCED",
    rides: 56,
    mutual: 7,
    bio: "Experienced rider focused on coastal and long-distance rides.",
  },
  {
    id: "rc-005",
    name: "Kiran",
    location: "Hyderabad",
    bike: "Bajaj Dominar 400",
    style: "TOURING",
    experience: "INTERMEDIATE",
    rides: 19,
    mutual: 4,
    bio: "Touring rider looking for new groups and highway routes.",
  },
  {
    id: "rc-006",
    name: "Aditya",
    location: "Mysuru",
    bike: "KTM Duke 390",
    style: "SPORT",
    experience: "ADVANCED",
    rides: 38,
    mutual: 9,
    bio: "Sport riding enthusiast who enjoys twisty roads and group rides.",
  },
];

const riderStyles = ["ALL", "ADVENTURE", "TOURING", "CRUISER", "SPORT"];

function readArray(key) {
  try {
    const stored = localStorage.getItem(key);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function RiderConnect() {
  const [activeTab, setActiveTab] = useState("DISCOVER");
  const [search, setSearch] = useState("");
  const [styleFilter, setStyleFilter] = useState("ALL");
  const [selectedRider, setSelectedRider] = useState(null);
  const [messagingRider, setMessagingRider] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [directMessages, setDirectMessages] = useState([]);

  const [connections, setConnections] = useState(() =>
    readArray(STORAGE_KEYS.connections)
  );

  const [requests, setRequests] = useState(() =>
    readArray(STORAGE_KEYS.requests)
  );

  const [following, setFollowing] = useState(() =>
    readArray(STORAGE_KEYS.following)
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.connections,
        JSON.stringify(connections)
      );
    } catch {
      // Ignore localStorage errors.
    }
  }, [connections]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.requests,
        JSON.stringify(requests)
      );
    } catch {
      // Ignore localStorage errors.
    }
  }, [requests]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.following,
        JSON.stringify(following)
      );
    } catch {
      // Ignore localStorage errors.
    }
  }, [following]);

  useEffect(() => {
    if (!selectedRider) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedRider(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedRider]);

  const filteredRiders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return riderData.filter((rider) => {
      const matchesSearch =
        !normalizedSearch ||
        rider.name.toLowerCase().includes(normalizedSearch) ||
        rider.location.toLowerCase().includes(normalizedSearch) ||
        rider.bike.toLowerCase().includes(normalizedSearch) ||
        rider.style.toLowerCase().includes(normalizedSearch);

      const matchesStyle =
        styleFilter === "ALL" || rider.style === styleFilter;

      if (!matchesSearch || !matchesStyle) {
        return false;
      }

      if (activeTab === "CONNECTIONS") {
        return connections.includes(rider.id);
      }

      if (activeTab === "REQUESTS") {
        return requests.includes(rider.id);
      }

      return !connections.includes(rider.id);
    });
  }, [activeTab, connections, requests, search, styleFilter]);

  const sendConnectionRequest = (riderId) => {
    if (
      connections.includes(riderId) ||
      requests.includes(riderId)
    ) {
      return;
    }

    setRequests((current) => [...current, riderId]);
  };

  const cancelRequest = (riderId) => {
    setRequests((current) =>
      current.filter((id) => id !== riderId)
    );
  };

  const removeConnection = (riderId) => {
    setConnections((current) =>
      current.filter((id) => id !== riderId)
    );
  };

  const toggleFollow = (riderId) => {
    setFollowing((current) => {
      if (current.includes(riderId)) {
        return current.filter((id) => id !== riderId);
      }

      return [...current, riderId];
    });
  };

  const getConnectionStatus = (riderId) => {
    if (connections.includes(riderId)) {
      return "CONNECTED";
    }

    if (requests.includes(riderId)) {
      return "REQUESTED";
    }

    return "CONNECT";
  };

  const handleConnectionAction = (riderId) => {
    const status = getConnectionStatus(riderId);

    if (status === "CONNECTED") {
      removeConnection(riderId);
      return;
    }

    if (status === "REQUESTED") {
      cancelRequest(riderId);
      return;
    }

    sendConnectionRequest(riderId);
  };



  const getDirectMessageKey = (riderId) =>
    `mototribe_direct_chat_${riderId}`;

  const openDirectMessage = (rider) => {
    setMessagingRider(rider);
    setMessageText("");
    setDirectMessages(readArray(getDirectMessageKey(rider.id)));
  };

  const closeDirectMessage = () => {
    setMessagingRider(null);
    setMessageText("");
    setDirectMessages([]);
  };

  const sendDirectMessage = () => {
    const trimmedMessage = messageText.trim();

    if (!trimmedMessage || !messagingRider) {
      return;
    }

    const message = {
      id: `msg-${new Date().getTime()}`,
      sender: "ME",
      text: trimmedMessage,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...directMessages, message];

    try {
      localStorage.setItem(
        getDirectMessageKey(messagingRider.id),
        JSON.stringify(updatedMessages)
      );
    } catch {
      // Ignore localStorage errors.
    }

    setDirectMessages(updatedMessages);
    setMessageText("");
  };

  const handleInvite = (rider) => {
    window.alert(
      `Ride invitation feature will be connected to the ride system for ${rider.name}.`
    );
  };

  return (
    <section className="rider-connect">
      <div className="rider-connect-container">
        <div className="rider-connect-header">
          <div>
            <span className="rider-connect-eyebrow">
              RIDER NETWORK
            </span>

            <h2>Rider Connect</h2>

            <p>
              Discover riders, build connections and find people
              who share your riding style.
            </p>
          </div>

          <div className="rider-connect-summary">
            <div className="rider-summary-item">
              <strong>{riderData.length}</strong>
              <span>Riders</span>
            </div>

            <div className="rider-summary-item">
              <strong>{connections.length}</strong>
              <span>Connections</span>
            </div>

            <div className="rider-summary-item">
              <strong>{requests.length}</strong>
              <span>Requests</span>
            </div>

            <div className="rider-summary-item">
              <strong>{following.length}</strong>
              <span>Following</span>
            </div>
          </div>
        </div>

        <div className="rider-connect-tabs">
          {["DISCOVER", "CONNECTIONS", "REQUESTS"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`rider-tab ${
                activeTab === tab ? "active" : ""
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}

              {tab === "CONNECTIONS" && connections.length > 0 && (
                <span className="tab-count">
                  {connections.length}
                </span>
              )}

              {tab === "REQUESTS" && requests.length > 0 && (
                <span className="tab-count">
                  {requests.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="rider-connect-controls">
          <div className="rider-search">
            <span className="search-icon">⌕</span>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search riders, bikes or locations..."
              aria-label="Search riders"
            />

            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearch("")}
                aria-label="Clear rider search"
              >
                ×
              </button>
            )}
          </div>

          <div className="rider-style-filters">
            {riderStyles.map((style) => (
              <button
                key={style}
                type="button"
                className={`style-filter ${
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

        <div className="rider-network-note">
          <span className="note-dot" />

          {activeTab === "DISCOVER" && (
            <span>
              Discover riders outside your current connections.
            </span>
          )}

          {activeTab === "CONNECTIONS" && (
            <span>
              Riders you have connected with.
            </span>
          )}

          {activeTab === "REQUESTS" && (
            <span>
              Connection requests you have sent.
            </span>
          )}
        </div>

        {filteredRiders.length > 0 ? (
          <div className="rider-connect-grid">
            {filteredRiders.map((rider) => {
              const status = getConnectionStatus(rider.id);
              const isFollowing = following.includes(rider.id);

              return (
                <article
                  className="rider-connect-card"
                  key={rider.id}
                >
                  <div className="rider-card-top">
                    <div className="rider-avatar">
                      {rider.name.charAt(0)}
                    </div>

                    <span
                      className={`rider-style-badge ${rider.style.toLowerCase()}`}
                    >
                      {rider.style}
                    </span>
                  </div>

                  <div className="rider-card-content">
                    <h3>{rider.name}</h3>

                    <p className="rider-location">
                      <span>⌖</span>
                      {rider.location}
                    </p>

                    <p className="rider-bike">
                      {rider.bike}
                    </p>

                    <p className="rider-bio">
                      {rider.bio}
                    </p>

                    <div className="rider-card-meta">
                      <div>
                        <strong>{rider.experience}</strong>
                        <span>Experience</span>
                      </div>

                      <div>
                        <strong>{rider.rides}</strong>
                        <span>Rides</span>
                      </div>

                      <div>
                        <strong>{rider.mutual}</strong>
                        <span>Mutual</span>
                      </div>
                    </div>
                  </div>

                  <div className="rider-card-actions">
                    <button
                      type="button"
                      className="profile-button"
                      onClick={() => setSelectedRider(rider)}
                    >
                      VIEW PROFILE
                    </button>

                    <button
                      type="button"
                      className={`connection-button ${
                        status === "CONNECTED"
                          ? "connected"
                          : status === "REQUESTED"
                          ? "requested"
                          : ""
                      }`}
                      onClick={() =>
                        handleConnectionAction(rider.id)
                      }
                    >
                      {status === "CONNECTED" && "CONNECTED"}
                      {status === "REQUESTED" && "REQUESTED · CANCEL"}
                      {status === "CONNECT" && "CONNECT"}
                    </button>

                    {activeTab === "CONNECTIONS" && (
                      <button
                        type="button"
                        className={`follow-button ${
                          isFollowing ? "following" : ""
                        }`}
                        onClick={() =>
                          toggleFollow(rider.id)
                        }
                      >
                        {isFollowing ? "FOLLOWING" : "FOLLOW"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rider-empty-state">
            <div className="empty-icon">⌁</div>

            <h3>
              {activeTab === "DISCOVER" &&
                "No riders found"}

              {activeTab === "CONNECTIONS" &&
                "No connections yet"}

              {activeTab === "REQUESTS" &&
                "No sent requests"}
            </h3>

            <p>
              {search
                ? "Try another search or change the riding style filter."
                : activeTab === "DISCOVER"
                ? "Try changing the riding style filter to discover more riders."
                : activeTab === "CONNECTIONS"
                ? "Connect with riders from the Discover section."
                : "Connection requests that you send will appear here."}
            </p>

            {(search || styleFilter !== "ALL") && (
              <button
                type="button"
                className="reset-rider-filters"
                onClick={() => {
                  setSearch("");
                  setStyleFilter("ALL");
                }}
              >
                RESET FILTERS
              </button>
            )}
          </div>
        )}

        <div className="rider-connect-footer">
          <div>
            <span className="footer-line" />
            <span>RIDE TOGETHER</span>
            <span className="footer-line" />
          </div>

          <p>
            Find riders. Share routes. Build your tribe.
          </p>
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
              ×
            </button>

            <div className="modal-profile-header">
              <div className="modal-avatar">
                {selectedRider.name.charAt(0)}
              </div>

              <div>
                <span className="modal-style">
                  {selectedRider.style}
                </span>

                <h3 id="rider-modal-title">
                  {selectedRider.name}
                </h3>

                <p>
                  ⌖ {selectedRider.location}
                </p>
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
                onClick={() =>
                  handleConnectionAction(selectedRider.id)
                }
              >
                {getConnectionStatus(selectedRider.id) ===
                  "CONNECTED" && "REMOVE CONNECTION"}

                {getConnectionStatus(selectedRider.id) ===
                  "REQUESTED" && "CANCEL REQUEST"}

                {getConnectionStatus(selectedRider.id) ===
                  "CONNECT" && "CONNECT"}
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
                  following.includes(selectedRider.id)
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  toggleFollow(selectedRider.id)
                }
              >
                {following.includes(selectedRider.id)
                  ? "FOLLOWING"
                  : "FOLLOW"}
              </button>

              <button
                type="button"
                className="modal-invite-button"
                onClick={() => handleInvite(selectedRider)}
              >
                INVITE TO RIDE
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
                <span className="rider-message-eyebrow">
                  DIRECT CONNECTION
                </span>
                <h3 id="rider-message-title">
                  {messagingRider.name}
                </h3>
                <p>
                  {messagingRider.location} · {messagingRider.style}
                </p>
              </div>

              <button
                type="button"
                className="rider-message-close"
                onClick={closeDirectMessage}
                aria-label="Close direct message"
              >
                ×
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
                  <p>
                    Ask about routes, riding conditions, fuel,
                    accommodation or upcoming rides.
                  </p>
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

              <button
                type="submit"
                disabled={!messageText.trim()}
              >
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