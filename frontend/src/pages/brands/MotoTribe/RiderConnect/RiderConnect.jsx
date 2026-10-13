
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import apiClient from "../../../../services/apiClient";
import "./RiderConnect.css";

const styleFilters = ["ALL", "ADVENTURE", "TOURING", "CRUISER", "SPORT"];

function RiderConnect() {
  const { isAuthenticated, openAuthModal, user } = useAuth();

  const [riders, setRiders] = useState([]);
  const [connections, setConnections] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
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
      setIncomingRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [connRes, reqRes, incomingRes, nearbyRes] =
        await Promise.allSettled([
          apiClient.get("/api/core/connections"),
          apiClient.get("/api/core/connections/requests/outgoing"),
          apiClient.get("/api/core/connections/requests/incoming"),
          apiClient.get(
            "/api/mototribe/riders-nearby?lat=28.6139&lng=77.2090&radius=10000000"
          ),
        ]);

      const connectedList = [];

      if (
        connRes.status === "fulfilled" &&
        connRes.value.data?.data
      ) {
        (connRes.value.data.data.connections || []).forEach((connection) => {
          const otherUser =
            connection.otherUser ||
            connection.user ||
            connection.toUserId ||
            connection.fromUserId;

          if (otherUser && (otherUser._id || otherUser.id)) {
            connectedList.push({
              id: String(otherUser._id || otherUser.id),
              name: otherUser.name || "Connected Rider",
              location: otherUser.city || "India",
              bike: otherUser.primaryVehicleName || otherUser.bike || null,
              style: (otherUser.ridingStyle || "TOURING").toUpperCase(),
              experience: "INTERMEDIATE",
              rides: otherUser.totalRidesCompleted || 0,
              mutual: 0,
              bio: "Active MotoTribe community connection.",
              connectionId: connection._id,
            });
          }
        });
      }

      setConnections(connectedList);

      const requestList = [];

      if (
        reqRes.status === "fulfilled" &&
        reqRes.value.data?.data
      ) {
        (reqRes.value.data.data.requests || []).forEach((request) => {
          const target = request.toUserId;

          if (target) {
            requestList.push({
              id: String(target._id || target),
              requestId: request._id,
              name: target.name || "Rider",
              style: "ADVENTURE",
              location: "India",
              bike: null,
              experience: "INTERMEDIATE",
              rides: 0,
              mutual: 0,
              bio: "Pending connection request.",
            });
          }
        });
      }

      setOutgoingRequests(requestList);

      const incomingList = [];

      if (
        incomingRes.status === "fulfilled" &&
        incomingRes.value.data?.data
      ) {
        (incomingRes.value.data.data.requests || []).forEach((request) => {
          const sender = request.fromUserId;

          if (sender) {
            incomingList.push({
              id: String(sender._id || sender),
              requestId: request._id,
              name: sender.name || "Rider",
              style: "ADVENTURE",
              location: sender.city || "India",
              bike: sender.primaryVehicleName || null,
              experience: "INTERMEDIATE",
              rides: 0,
              mutual: 0,
              bio: "Sent you a connection request.",
            });
          }
        });
      }

      setIncomingRequests(incomingList);

      let discoverList = [];

      if (
        nearbyRes.status === "fulfilled" &&
        nearbyRes.value.data?.data?.riders
      ) {
        discoverList = nearbyRes.value.data.data.riders
          .filter(
            (rider) =>
              String(rider.userId || rider._id) !== String(user?._id)
          )
          .map((rider) => ({
            id: String(rider.userId || rider._id),
            name: rider.name || "Rider",
            location: rider.distanceKm
              ? `${Math.round(rider.distanceKm)} km away`
              : "India",
            bike: rider.primaryVehicleName || null,
            style: (rider.preferredRideType || "ADVENTURE").toUpperCase(),
            experience:
              rider.totalRidesCompleted > 10
                ? "ADVANCED"
                : "INTERMEDIATE",
            rides: rider.totalRidesCompleted || 0,
            mutual: 0,
            bio: rider.currentJourney
              ? `Currently on: ${
                  rider.currentJourney.title || "Active Journey"
                }`
              : "Verified rider exploring open highways and mountain passes.",
          }));
      }

      setRiders(discoverList);
    } catch (error) {
      console.error("Failed to load rider network:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?._id]);

  useEffect(() => {
    fetchRiderNetwork();

    const handleUpdate = () => {
      fetchRiderNetwork();
    };

    window.addEventListener("kaindra:connection_updated", handleUpdate);

    return () => {
      window.removeEventListener(
        "kaindra:connection_updated",
        handleUpdate
      );
    };
  }, [fetchRiderNetwork]);

  const activeRiders = useMemo(() => {
    if (activeTab === "CONNECTIONS") return connections;
    if (activeTab === "REQUESTS") return outgoingRequests;
    if (activeTab === "INCOMING") return incomingRequests;
    return riders;
  }, [
    activeTab,
    connections,
    outgoingRequests,
    incomingRequests,
    riders,
  ]);

  const filteredRiders = useMemo(() => {
    return activeRiders.filter((rider) => {
      const matchesStyle =
        styleFilter === "ALL" || rider.style === styleFilter;

      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        rider.name.toLowerCase().includes(query) ||
        (rider.location || "").toLowerCase().includes(query) ||
        (rider.bike || "").toLowerCase().includes(query) ||
        rider.style.toLowerCase().includes(query);

      return matchesStyle && matchesSearch;
    });
  }, [activeRiders, search, styleFilter]);

  const getConnectionStatus = (riderId) => {
    if (
      connections.some(
        (connection) => String(connection.id) === String(riderId)
      )
    ) {
      return "CONNECTED";
    }

    if (
      incomingRequests.some(
        (request) => String(request.id) === String(riderId)
      )
    ) {
      return "INCOMING";
    }

    if (
      outgoingRequests.some(
        (request) => String(request.id) === String(riderId)
      )
    ) {
      return "REQUESTED";
    }

    return "CONNECT";
  };

  const handleConnectionAction = async (riderId) => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    const status = getConnectionStatus(riderId);

    if (status === "INCOMING") {
      const incomingRequest = incomingRequests.find(
        (request) => String(request.id) === String(riderId)
      );

      if (!incomingRequest?.requestId) return;

      try {
        await apiClient.patch(
          `/api/core/connections/requests/${incomingRequest.requestId}/respond`,
          { action: "accept" }
        );

        window.dispatchEvent(
          new CustomEvent("kaindra:connection_updated")
        );

        await fetchRiderNetwork();
      } catch (error) {
        console.error("Failed to accept connection request:", error);
      }
    } else if (status === "CONNECT") {
      try {
        await apiClient.post("/api/core/connections/request", {
          toUserId: riderId,
        });

        await fetchRiderNetwork();

        window.dispatchEvent(
          new CustomEvent("kaindra:connection_updated")
        );
      } catch (error) {
        console.error("Failed to send connection request:", error);
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

    setDirectMessages((previous) => [
      ...previous,
      {
        id: Date.now(),
        sender: "ME",
        text: messageText.trim(),
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setMessageText("");
  };

  const renderConnectionButton = (rider) => {
    const status = getConnectionStatus(rider.id);

    return (
      <button
        type="button"
        className={`connection-button ${status.toLowerCase()}`}
        onClick={() => handleConnectionAction(rider.id)}
        disabled={status === "CONNECTED" || status === "REQUESTED"}
      >
        {status === "CONNECTED"
          ? "CONNECTED ✓"
          : status === "REQUESTED"
            ? "REQUEST SENT ⏳"
            : status === "INCOMING"
              ? "✓ ACCEPT REQUEST"
              : "CONNECT"}
      </button>
    );
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
              Discover and connect with riders from your region, share
              live routes, and build your riding tribe.
            </p>
          </div>

          <div className="rider-connect-summary">
            <div className="rider-summary-item">
              <strong>{riders.length}</strong>
              <span>NEARBY</span>
            </div>
            <div className="rider-summary-item">
              <strong>{connections.length}</strong>
              <span>TRIBE</span>
            </div>
            <div className="rider-summary-item">
              <strong>{incomingRequests.length}</strong>
              <span>INCOMING</span>
            </div>
            <div className="rider-summary-item">
              <strong>{outgoingRequests.length}</strong>
              <span>PENDING</span>
            </div>
          </div>
        </div>

        <div className="rider-connect-tabs" role="tablist">
          {[
            { key: "DISCOVER", label: "DISCOVER", count: riders.length },
            {
              key: "CONNECTIONS",
              label: "MY TRIBE",
              count: connections.length,
            },
            {
              key: "INCOMING",
              label: "INCOMING",
              count: incomingRequests.length,
            },
            {
              key: "REQUESTS",
              label: "REQUESTS",
              count: outgoingRequests.length,
            },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              className={`rider-tab ${
                activeTab === key ? "active" : ""
              }`}
              onClick={() => setActiveTab(key)}
              role="tab"
              aria-selected={activeTab === key}
            >
              {label}
              <span className="tab-count">{count}</span>
            </button>
          ))}
        </div>

        <div className="rider-connect-controls">
          <div className="rider-search">
            <span className="search-icon">&#128269;</span>
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
                &times;
              </button>
            )}
          </div>

          <div className="rider-style-filters">
            {styleFilters.map((style) => (
              <button
                key={style}
                type="button"
                className={`style-filter ${
                  styleFilter === style ? "active" : ""
                }`}
                onClick={() => setStyleFilter(style)}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div className="rider-network-note">
          <span className="note-dot" />
          {loading
            ? "Connecting to live database..."
            : `${filteredRiders.length} rider${
                filteredRiders.length !== 1 ? "s" : ""
              } in your network`}
        </div>

        {loading ? (
          <div className="rider-empty-state">
            <div className="empty-icon">&#9878;</div>
            <h3>Loading riders...</h3>
            <p>Fetching live rider data from the MotoTribe network.</p>
          </div>
        ) : filteredRiders.length > 0 ? (
          <div className="rider-connect-grid">
            {filteredRiders.map((rider) => {
              const status = getConnectionStatus(rider.id);

              return (
                <article
                  className="rider-connect-card"
                  key={rider.id}
                >
                  <div className="rider-card-top">
                    <div className="rider-avatar">
                      {rider.name.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`rider-style-badge ${rider.style.toLowerCase()}`}
                    >
                      {rider.style}
                    </span>
                  </div>

                  <div className="rider-card-content">
                    <h3
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedRider(rider)}
                      title="View profile"
                    >
                      {rider.name}
                    </h3>

                    <p className="rider-location">
                      <span>&#8599;</span> {rider.location}
                    </p>

                    {rider.bike && (
                      <p className="rider-bike">{rider.bike}</p>
                    )}

                    <p className="rider-bio">{rider.bio}</p>
                  </div>

                  <div className="rider-card-meta">
                    <div>
                      <strong>{rider.experience}</strong>
                      <span>EXPERIENCE</span>
                    </div>
                    <div>
                      <strong>{rider.rides}</strong>
                      <span>TOTAL RIDES</span>
                    </div>
                    <div>
                      <strong>{rider.mutual}</strong>
                      <span>MUTUAL</span>
                    </div>
                  </div>

                  <div className="rider-card-actions">
                    {renderConnectionButton(rider)}

                    <button
                      type="button"
                      className="profile-button"
                      onClick={() => setSelectedRider(rider)}
                    >
                      PROFILE
                    </button>

                    {status === "CONNECTED" && (
                      <button
                        type="button"
                        className="follow-button"
                        onClick={() => openDirectMessage(rider)}
                        aria-label={`Message ${rider.name}`}
                      >
                        MSG
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rider-empty-state">
            <div className="empty-icon">&#9832;</div>
            <h3>
              {activeTab === "DISCOVER" && "No riders found"}
              {activeTab === "CONNECTIONS" && "No connections yet"}
              {activeTab === "INCOMING" && "No incoming requests"}
              {activeTab === "REQUESTS" && "No sent requests"}
            </h3>
            <p>
              {activeTab === "DISCOVER"
                ? "Discover riders across the MotoTribe network and send connection requests."
                : activeTab === "CONNECTIONS"
                  ? "Connect with riders from the Discover tab to build your tribe."
                  : activeTab === "INCOMING"
                    ? "Incoming connection requests from other riders will appear here."
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
              &times;
            </button>

            <div className="modal-profile-header">
              <div className="modal-avatar">
                {selectedRider.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="modal-style">
                  {selectedRider.style}
                </span>
                <h3 id="rider-modal-title">{selectedRider.name}</h3>
                <p>&#8599; {selectedRider.location}</p>
              </div>
            </div>

            <div className="modal-bio">
              <p>{selectedRider.bio}</p>
            </div>

            <div className="modal-details">
              <div>
                <span>Motorcycle</span>
                <strong>{selectedRider.bike || "Not added"}</strong>
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
              {renderConnectionButton(selectedRider)}

              <button
                type="button"
                className="modal-secondary-button"
                onClick={() => openDirectMessage(selectedRider)}
              >
                MESSAGE
              </button>

              {getConnectionStatus(selectedRider.id) !== "CONNECTED" && (
                <button
                  type="button"
                  className={`modal-follow-button ${
                    following.includes(selectedRider.id) ? "active" : ""
                  }`}
                  onClick={() => toggleFollow(selectedRider.id)}
                >
                  {following.includes(selectedRider.id)
                    ? "FOLLOWING"
                    : "FOLLOW"}
                </button>
              )}
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
                <h3 id="rider-message-title">{messagingRider.name}</h3>
                <p>
                  {messagingRider.location} &middot; {messagingRider.style}
                </p>
              </div>

              <button
                type="button"
                className="rider-message-close"
                onClick={closeDirectMessage}
                aria-label="Close direct message"
              >
                &times;
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