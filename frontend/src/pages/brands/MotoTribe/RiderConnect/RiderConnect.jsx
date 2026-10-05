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
      const [connRes, reqRes, nearbyRes] = await Promise.allSettled([
        apiClient.get("/api/core/connections"),
        apiClient.get("/api/core/connections/requests/outgoing"),
        apiClient.get("/api/mototribe/riders-nearby?lat=28.6139&lng=77.2090&radius=10000000"),
      ]);

      const connectedList = [];
      if (connRes.status === "fulfilled" && connRes.value.data?.data) {
        (connRes.value.data.data.connections || []).forEach((c) => {
          const ou = c.otherUser || c.user || c.toUserId || c.fromUserId;
          if (ou && (ou._id || ou.id)) {
            connectedList.push({
              id: String(ou._id || ou.id),
              name: ou.name || "Connected Rider",
              location: ou.city || "India",
              bike: ou.primaryVehicleName || ou.bike || null,
              style: (ou.ridingStyle || "TOURING").toUpperCase(),
              experience: "INTERMEDIATE",
              rides: ou.totalRidesCompleted || 0,
              mutual: 0,
              bio: "Active MotoTribe community connection.",
              connectionId: c._id,
            });
          }
        });
      }
      setConnections(connectedList);

      const reqList = [];
      if (reqRes.status === "fulfilled" && reqRes.value.data?.data) {
        (reqRes.value.data.data.requests || []).forEach((r) => {
          const target = r.toUserId;
          if (target) {
            reqList.push({
              id: String(target._id || target),
              requestId: r._id,
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
      setOutgoingRequests(reqList);

      let discoverList = [];
      if (nearbyRes.status === "fulfilled" && nearbyRes.value.data?.data?.riders) {
        discoverList = nearbyRes.value.data.data.riders
          .filter((r) => String(r.userId) !== String(user?._id))
          .map((r) => ({
            id: String(r.userId || r._id),
            name: r.name || "Rider",
            location: r.distanceKm ? `${Math.round(r.distanceKm)} km away` : "India",
            bike: r.primaryVehicleName || null,
            style: (r.preferredRideType || "ADVENTURE").toUpperCase(),
            experience: r.totalRidesCompleted > 10 ? "ADVANCED" : "INTERMEDIATE",
            rides: r.totalRidesCompleted || 0,
            mutual: 0,
            bio: r.currentJourney
              ? `Currently on: ${r.currentJourney.title || "Active Journey"}`
              : "Verified rider exploring open highways and mountain passes.",
          }));
      }
      setRiders(discoverList);
    } catch (err) {
      console.error("Failed to load rider network:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?._id]);

  useEffect(() => { fetchRiderNetwork(); }, [fetchRiderNetwork]);

  const activeRiders = useMemo(() => {
    if (activeTab === "CONNECTIONS") return connections;
    if (activeTab === "REQUESTS") return outgoingRequests;
    return riders;
  }, [activeTab, connections, outgoingRequests, riders]);

  const filteredRiders = useMemo(() => {
    return activeRiders.filter((rider) => {
      const matchesStyle = styleFilter === "ALL" || rider.style === styleFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        rider.name.toLowerCase().includes(q) ||
        (rider.location || "").toLowerCase().includes(q) ||
        (rider.bike || "").toLowerCase().includes(q) ||
        rider.style.toLowerCase().includes(q);
      return matchesStyle && matchesSearch;
    });
  }, [activeRiders, search, styleFilter]);

  const getConnectionStatus = (riderId) => {
    if (connections.some((c) => c.id === riderId)) return "CONNECTED";
    if (outgoingRequests.some((r) => r.id === riderId)) return "REQUESTED";
    return "CONNECT";
  };

  const handleConnectionAction = async (riderId) => {
    if (!isAuthenticated) { openAuthModal(); return; }
    if (getConnectionStatus(riderId) === "CONNECT") {
      try {
        await apiClient.post("/api/core/connections/request", { toUserId: riderId });
        setOutgoingRequests((prev) => [...prev, { id: riderId }]);
      } catch (err) {
        console.error("Failed to send connection request:", err);
      }
    }
  };

  const toggleFollow = (riderId) => {
    setFollowing((cur) =>
      cur.includes(riderId) ? cur.filter((id) => id !== riderId) : [...cur, riderId]
    );
  };

  const openDirectMessage = (rider) => { setMessagingRider(rider); setSelectedRider(null); };
  const closeDirectMessage = () => { setMessagingRider(null); setMessageText(""); };

  const sendDirectMessage = () => {
    if (!messageText.trim()) return;
    setDirectMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "ME", text: messageText.trim(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    ]);
    setMessageText("");
  };

  return (
    <section className="rider-connect">
      <div className="rider-connect-container">

        <div className="rider-connect-header">
          <div>
            <span className="rider-connect-eyebrow">COMMUNITY NETWORK</span>
            <h2>Rider Connect</h2>
            <p>Discover and connect with riders from your region, share live routes, and build your riding tribe.</p>
          </div>
          <div className="rider-connect-summary">
            <div className="rider-summary-item"><strong>{riders.length}</strong><span>NEARBY</span></div>
            <div className="rider-summary-item"><strong>{connections.length}</strong><span>TRIBE</span></div>
            <div className="rider-summary-item"><strong>{outgoingRequests.length}</strong><span>PENDING</span></div>
            <div className="rider-summary-item"><strong>{following.length}</strong><span>FOLLOWING</span></div>
          </div>
        </div>

        <div className="rider-connect-tabs" role="tablist">
          {[
            { key: "DISCOVER", label: "DISCOVER", count: riders.length },
            { key: "CONNECTIONS", label: "MY TRIBE", count: connections.length },
            { key: "REQUESTS", label: "REQUESTS", count: outgoingRequests.length },
          ].map(({ key, label, count }) => (
            <button key={key} type="button"
              className={`rider-tab ${activeTab === key ? "active" : ""}`}
              onClick={() => setActiveTab(key)} role="tab" aria-selected={activeTab === key}
            >
              {label} <span className="tab-count">{count}</span>
            </button>
          ))}
        </div>

        <div className="rider-connect-controls">
          <div className="rider-search">
            <span className="search-icon">&#128269;</span>
            <input type="search" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by rider name, motorcycle or location..."
              aria-label="Search riders"
            />
            {search && (
              <button type="button" className="clear-search" onClick={() => setSearch("")} aria-label="Clear search">
                &times;
              </button>
            )}
          </div>
          <div className="rider-style-filters">
            {styleFilters.map((s) => (
              <button key={s} type="button"
                className={`style-filter ${styleFilter === s ? "active" : ""}`}
                onClick={() => setStyleFilter(s)} aria-pressed={styleFilter === s}
              >{s}</button>
            ))}
          </div>
        </div>

        <div className="rider-network-note">
          <span className="note-dot" />
          {loading ? "Connecting to live database..." : `${filteredRiders.length} rider${filteredRiders.length !== 1 ? "s" : ""} in your network`}
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
                <article className="rider-connect-card" key={rider.id}>
                  <div className="rider-card-top">
                    <div className="rider-avatar">{rider.name.charAt(0).toUpperCase()}</div>
                    <span className={`rider-style-badge ${rider.style.toLowerCase()}`}>{rider.style}</span>
                  </div>
                  <div className="rider-card-content">
                    <h3 style={{ cursor: "pointer" }} onClick={() => setSelectedRider(rider)} title="View profile">
                      {rider.name}
                    </h3>
                    <p className="rider-location"><span>&#8599;</span>{rider.location}</p>
                    {rider.bike && <p className="rider-bike">{rider.bike}</p>}
                    <p className="rider-bio">{rider.bio}</p>
                  </div>
                  <div className="rider-card-meta">
                    <div><strong>{rider.experience}</strong><span>EXPERIENCE</span></div>
                    <div><strong>{rider.rides}</strong><span>TOTAL RIDES</span></div>
                    <div><strong>{rider.mutual}</strong><span>MUTUAL</span></div>
                  </div>
                  <div className="rider-card-actions">
                    <button type="button"
                      className={`connection-button ${status.toLowerCase()}`}
                      onClick={() => handleConnectionAction(rider.id)}
                    >
                      {status === "CONNECTED" ? "CONNECTED" : status === "REQUESTED" ? "REQUESTED" : "CONNECT"}
                    </button>
                    <button type="button" className="profile-button" onClick={() => setSelectedRider(rider)}>PROFILE</button>
                    {status === "CONNECTED" && (
                      <button type="button" className="follow-button"
                        onClick={() => openDirectMessage(rider)} aria-label={`Message ${rider.name}`}
                      >MSG</button>
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
          <div><span className="footer-line" /><span>RIDE TOGETHER</span><span className="footer-line" /></div>
          <p>Find riders. Share routes. Build your tribe.</p>
        </div>
      </div>

      {selectedRider && (
        <div className="rider-modal-overlay" onClick={() => setSelectedRider(null)} role="presentation">
          <div className="rider-modal" role="dialog" aria-modal="true"
            aria-labelledby="rider-modal-title" onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="modal-close" onClick={() => setSelectedRider(null)} aria-label="Close rider profile">
              &times;
            </button>
            <div className="modal-profile-header">
              <div className="modal-avatar">{selectedRider.name.charAt(0).toUpperCase()}</div>
              <div>
                <span className="modal-style">{selectedRider.style}</span>
                <h3 id="rider-modal-title">{selectedRider.name}</h3>
                <p>&#8599; {selectedRider.location}</p>
              </div>
            </div>
            <div className="modal-bio"><p>{selectedRider.bio}</p></div>
            <div className="modal-details">
              <div><span>Motorcycle</span><strong>{selectedRider.bike || "Not added"}</strong></div>
              <div><span>Experience</span><strong>{selectedRider.experience}</strong></div>
              <div><span>Total Rides</span><strong>{selectedRider.rides}</strong></div>
              <div><span>Mutual Riders</span><strong>{selectedRider.mutual}</strong></div>
            </div>
            <div className="modal-actions">
              <button type="button" className="modal-primary-button" onClick={() => handleConnectionAction(selectedRider.id)}>
                {getConnectionStatus(selectedRider.id) === "CONNECTED" ? "CONNECTED"
                  : getConnectionStatus(selectedRider.id) === "REQUESTED" ? "CANCEL REQUEST" : "CONNECT"}
              </button>
              <button type="button" className="modal-secondary-button" onClick={() => openDirectMessage(selectedRider)}>MESSAGE</button>
              <button type="button"
                className={`modal-follow-button ${following.includes(selectedRider.id) ? "active" : ""}`}
                onClick={() => toggleFollow(selectedRider.id)}
              >{following.includes(selectedRider.id) ? "FOLLOWING" : "FOLLOW"}</button>
            </div>
          </div>
        </div>
      )}

      {messagingRider && (
        <div className="rider-message-overlay" onClick={closeDirectMessage} role="presentation">
          <div className="rider-message-panel" role="dialog" aria-modal="true"
            aria-labelledby="rider-message-title" onClick={(e) => e.stopPropagation()}
          >
            <div className="rider-message-header">
              <div>
                <span className="rider-message-eyebrow">DIRECT CONNECTION</span>
                <h3 id="rider-message-title">{messagingRider.name}</h3>
                <p>{messagingRider.location} &middot; {messagingRider.style}</p>
              </div>
              <button type="button" className="rider-message-close" onClick={closeDirectMessage} aria-label="Close direct message">
                &times;
              </button>
            </div>
            <div className="rider-message-body">
              {directMessages.length > 0 ? (
                directMessages.map((msg) => (
                  <div key={msg.id} className={`direct-message ${msg.sender === "ME" ? "mine" : ""}`}>
                    <span>{msg.text}</span>
                  </div>
                ))
              ) : (
                <div className="direct-message-empty">
                  <span>START THE CONVERSATION</span>
                  <p>Ask about routes, riding conditions, fuel, accommodation or upcoming rides.</p>
                </div>
              )}
            </div>
            <form className="rider-message-form" onSubmit={(e) => { e.preventDefault(); sendDirectMessage(); }}>
              <input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Message ${messagingRider.name}...`} aria-label={`Message ${messagingRider.name}`} maxLength={500}
              />
              <button type="submit" disabled={!messageText.trim()}>SEND</button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default RiderConnect;
