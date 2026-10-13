import { useEffect, useMemo, useState } from "react";
import "./RiderConnect.css";

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
    bio: "Long-distance adventure rider exploring mountain routes and challenging terrain.",
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
    bio: "Weekend explorer interested in mountain roads and group expeditions.",
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
    bio: "Touring enthusiast who enjoys scenic routes and relaxed community rides.",
  },
  {
    id: "rc-004",
    name: "Vikram",
    location: "Visakhapatnam",
    bike: "Royal Enfield Classic 350",
    style: "CRUISER",
    experience: "ADVANCED",
    rides: 56,
    mutual: 14,
    bio: "Coastal rider and community organizer focused on safe group riding.",
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
    bio: "Highway touring rider looking for new routes and riding communities.",
  },
  {
    id: "rc-006",
    name: "Aditya",
    location: "Mysuru",
    bike: "KTM Duke 390",
    style: "SPORT",
    experience: "ADVANCED",
    rides: 38,
    mutual: 7,
    bio: "Sport rider interested in technical roads, weekend rides and rider meets.",
  },
];

function RiderConnect() {
  const [activeTab, setActiveTab] = useState("DISCOVER");
  const [search, setSearch] = useState("");
  const [styleFilter, setStyleFilter] = useState("ALL");
  const [selectedRider, setSelectedRider] = useState(null);

  const [connections, setConnections] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("mototribeConnections") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [requests, setRequests] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("mototribeConnectionRequests") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [following, setFollowing] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("mototribeFollowing") || "[]"
      );
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(
      "mototribeConnections",
      JSON.stringify(connections)
    );
  }, [connections]);

  useEffect(() => {
    localStorage.setItem(
      "mototribeConnectionRequests",
      JSON.stringify(requests)
    );
  }, [requests]);

  useEffect(() => {
    localStorage.setItem(
      "mototribeFollowing",
      JSON.stringify(following)
    );
  }, [following]);

  const filteredRiders = useMemo(() => {
    return riderData.filter((rider) => {
      const matchesSearch =
        rider.name.toLowerCase().includes(search.toLowerCase()) ||
        rider.location.toLowerCase().includes(search.toLowerCase()) ||
        rider.bike.toLowerCase().includes(search.toLowerCase());

      const matchesStyle =
        styleFilter === "ALL" || rider.style === styleFilter;

      if (activeTab === "CONNECTIONS") {
        return (
          matchesSearch &&
          matchesStyle &&
          connections.includes(rider.id)
        );
      }

      if (activeTab === "REQUESTS") {
        return (
          matchesSearch &&
          matchesStyle &&
          requests.includes(rider.id)
        );
      }

      return (
        matchesSearch &&
        matchesStyle &&
        !connections.includes(rider.id)
      );
    });
  }, [
    activeTab,
    search,
    styleFilter,
    connections,
    requests,
  ]);

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

  const acceptRequest = (riderId) => {
    setRequests((current) =>
      current.filter((id) => id !== riderId)
    );

    setConnections((current) =>
      current.includes(riderId)
        ? current
        : [...current, riderId]
    );
  };

  const rejectRequest = (riderId) => {
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
    setFollowing((current) =>
      current.includes(riderId)
        ? current.filter((id) => id !== riderId)
        : [...current, riderId]
    );
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
              <strong>{requests.length}</strong>
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
            className={
              activeTab === "DISCOVER" ? "active" : ""
            }
            onClick={() => setActiveTab("DISCOVER")}
          >
            DISCOVER
          </button>

          <button
            className={
              activeTab === "CONNECTIONS" ? "active" : ""
            }
            onClick={() => setActiveTab("CONNECTIONS")}
          >
            CONNECTIONS
            {connections.length > 0 && (
              <span>{connections.length}</span>
            )}
          </button>

          <button
            className={
              activeTab === "REQUESTS" ? "active" : ""
            }
            onClick={() => setActiveTab("REQUESTS")}
          >
            REQUESTS
            {requests.length > 0 && (
              <span>{requests.length}</span>
            )}
          </button>

        </div>

        {/* CONTROLS */}

        <div className="rider-connect-controls">

          <input
            type="text"
            placeholder="Search riders, cities or motorcycles..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
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
                className={
                  styleFilter === style ? "active" : ""
                }
                onClick={() => setStyleFilter(style)}
              >
                {style}
              </button>
            ))}

          </div>

        </div>

        {/* RIDERS */}

        <div className="rider-connect-grid">

          {filteredRiders.length > 0 ? (
            filteredRiders.map((rider) => {

              const connectionStatus =
                getConnectionStatus(rider.id);

              const isFollowing =
                following.includes(rider.id);

              return (
                <article
                  className="connection-rider-card"
                  key={rider.id}
                >

                  <div className="connection-card-top">

                    <div className="connection-avatar">
                      {rider.name.charAt(0)}
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
                        <strong>{rider.mutual}</strong>
                        <span>MUTUAL</span>
                      </div>

                    </div>

                  </div>

                  <div className="connection-card-actions">

                    <button
                      className="profile-button"
                      onClick={() =>
                        setSelectedRider(rider)
                      }
                    >
                      VIEW PROFILE
                    </button>

                    {connectionStatus === "CONNECTED" ? (
                      <button
                        className="connection-action connected"
                        onClick={() =>
                          removeConnection(rider.id)
                        }
                      >
                        CONNECTED ✓
                      </button>
                    ) : connectionStatus === "REQUESTED" ? (
                      <button
                        className="connection-action requested"
                        onClick={() =>
                          cancelRequest(rider.id)
                        }
                      >
                        REQUESTED · CANCEL
                      </button>
                    ) : (
                      <button
                        className="connection-action"
                        onClick={() =>
                          sendConnectionRequest(rider.id)
                        }
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
                There are no riders in this view yet.
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
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <button
                className="profile-close"
                onClick={() =>
                  setSelectedRider(null)
                }
              >
                ×
              </button>

              <div className="modal-avatar">
                {selectedRider.name.charAt(0)}
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
                  <strong>
                    {selectedRider.bike}
                  </strong>
                </div>

                <div>
                  <span>EXPERIENCE</span>
                  <strong>
                    {selectedRider.experience}
                  </strong>
                </div>

                <div>
                  <span>TOTAL RIDES</span>
                  <strong>
                    {selectedRider.rides}
                  </strong>
                </div>

              </div>

              <div className="modal-actions">

                {!connections.includes(
                  selectedRider.id
                ) &&
                  !requests.includes(
                    selectedRider.id
                  ) && (
                    <button
                      onClick={() =>
                        sendConnectionRequest(
                          selectedRider.id
                        )
                      }
                    >
                      CONNECT
                    </button>
                  )}

                {requests.includes(
                  selectedRider.id
                ) && (
                  <button
                    onClick={() =>
                      cancelRequest(
                        selectedRider.id
                      )
                    }
                  >
                    CANCEL REQUEST
                  </button>
                )}

                {connections.includes(
                  selectedRider.id
                ) && (
                  <>
                    <button
                      onClick={() =>
                        removeConnection(
                          selectedRider.id
                        )
                      }
                    >
                      REMOVE CONNECTION
                    </button>

                    <button>
                      MESSAGE
                    </button>
                  </>
                )}

                <button
                  className={
                    isFollowingRider(
                      following,
                      selectedRider.id
                    )
                      ? "following"
                      : ""
                  }
                  onClick={() =>
                    toggleFollow(
                      selectedRider.id
                    )
                  }
                >
                  {isFollowingRider(
                    following,
                    selectedRider.id
                  )
                    ? "FOLLOWING ✓"
                    : "FOLLOW"}
                </button>

                <button
                  onClick={() =>
                    alert(
                      `Ride invitation sent to ${selectedRider.name}.`
                    )
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

function isFollowingRider(following, riderId) {
  return following.includes(riderId);
}

export default RiderConnect;