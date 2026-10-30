import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/apiClient";
import "./NotificationDropdown.css";

export default function NotificationDropdown({ brand = "mototribe" }) {
  const { isAuthenticated } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    respondToConnection,
    pushPermission,
    requestPushPermission,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState({});
  const [handledActions, setHandledActions] = useState({});
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  if (!isAuthenticated) return null;

  const handleAction = async (requestId, action, notifId) => {
    setActionLoading((prev) => ({ ...prev, [notifId]: true }));
    try {
      await respondToConnection(requestId, action, notifId);
      setHandledActions((prev) => ({
        ...prev,
        [requestId]: action,
        [notifId]: action,
      }));
    } catch (err) {
      // If already accepted/handled on server, reflect in UI
      const msg = err.response?.data?.message || err.message || "";
      if (msg.includes("already") || msg.includes("accepted")) {
        setHandledActions((prev) => ({
          ...prev,
          [requestId]: "accept",
          [notifId]: "accept",
        }));
      } else {
        alert("Could not process request: " + msg);
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [notifId]: false }));
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (n.createdAt) {
      const ageMs = Date.now() - new Date(n.createdAt).getTime();
      if (ageMs > 24 * 60 * 60 * 1000) return false;
    }
    if (filter === "UNREAD") return !n.isRead;
    if (filter === "REQUESTS") return n.type === "CONNECTION_REQUEST" || n.type === "RIDE_INVITE";
    return true;
  });

  const getNotifIcon = (type) => {
    switch (type) {
      case "CONNECTION_REQUEST": return "🤝";
      case "CONNECTION_ACCEPTED": return "🎉";
      case "RIDE_INVITE": return "🛵";
      case "ORDER_UPDATE": return "📦";
      case "DROP_ALERT": return "🔥";
      default: return "⚡";
    }
  };

  const formatTime = (ts) => {
    if (!ts) return "Just now";
    const date = new Date(ts);
    const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  return (
    <div className="notification-dropdown-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={"notification-bell-btn " + (isOpen ? "active" : "")}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notifications"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-panel-header">
            <div className="panel-title">
              <h3>NOTIFICATIONS</h3>
              {unreadCount > 0 && <span className="unread-counter">{unreadCount} New</span>}
            </div>
            <div className="panel-actions">
              {pushPermission !== "granted" && (
                <button
                  type="button"
                  className="push-enable-btn"
                  onClick={requestPushPermission}
                  title="Enable device push popups"
                >
                  ⚡ Push Alerts
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="mark-all-btn"
                  onClick={() => markAllAsRead(brand)}
                >
                  Mark all read
                </button>
              )}
              <Link
                to="/profile#push-settings"
                className="notif-settings-btn"
                onClick={() => setIsOpen(false)}
                title="Alert & Push Settings"
                style={{
                  textDecoration: "none",
                  fontSize: "15px",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  background: "rgba(255, 255, 255, 0.08)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ⚙️
              </Link>
            </div>
          </div>

          <div className="notification-filters">
            <button
              type="button"
              className={filter === "ALL" ? "active" : ""}
              onClick={() => setFilter("ALL")}
            >
              ALL ({notifications.length})
            </button>
            <button
              type="button"
              className={filter === "UNREAD" ? "active" : ""}
              onClick={() => setFilter("UNREAD")}
            >
              UNREAD ({unreadCount})
            </button>
            <button
              type="button"
              className={filter === "REQUESTS" ? "active" : ""}
              onClick={() => setFilter("REQUESTS")}
            >
              REQUESTS
            </button>
          </div>

          <div className="notification-list">
            {filteredNotifications.length === 0 ? (
              <div className="notification-empty">
                <span className="empty-icon">📭</span>
                <p>No notifications right now</p>
                <small>You're all caught up!</small>
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const reqId = n.data?.requestId;
                const actionState =
                  handledActions[n._id] ||
                  handledActions[reqId] ||
                  (n.data?.status === "accepted" ? "accept" : null);

                return (
                  <div
                    key={n._id}
                    className={"notification-card " + (!n.isRead ? "unread " : "") + (n.type.toLowerCase())}
                    onClick={() => {
                      if (!n.isRead) markAsRead(n._id);
                      if (n.type === "RIDE_INVITE" && n.data?.rideId) {
                        setIsOpen(false);
                        window.location.href = `/businesses/mototribe/ride/${n.data.rideId}`;
                      }
                    }}
                  >
                    <div className="notif-icon-col">
                      <span className="notif-type-icon">{getNotifIcon(n.type)}</span>
                    </div>
                    <div className="notif-content-col">
                      <div className="notif-card-header">
                        <strong>{n.title}</strong>
                        <span className="notif-time">{formatTime(n.createdAt)}</span>
                      </div>
                      <p className="notif-message">{n.message}</p>

                      {/* CONNECTION REQUEST ACTIONS OR STATUS BADGE */}
                      {n.type === "CONNECTION_REQUEST" && reqId && (
                        <div className="notif-action-row" onClick={(e) => e.stopPropagation()}>
                          {actionState === "accept" ? (
                            <span className="notif-status-badge connected">
                              Connected ✓
                            </span>
                          ) : actionState === "ignore" ? (
                            <span className="notif-status-badge ignored">
                              Request Ignored
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn-notif-accept"
                                disabled={actionLoading[n._id]}
                                onClick={() => handleAction(reqId, "accept", n._id)}
                              >
                                {actionLoading[n._id] ? "Connecting..." : "✓ Accept Request"}
                              </button>
                              <button
                                type="button"
                                className="btn-notif-decline"
                                disabled={actionLoading[n._id]}
                                onClick={() => handleAction(reqId, "ignore", n._id)}
                              >
                                Ignore
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* RIDE INVITATION ACTIONS */}
                      {n.type === "RIDE_INVITE" && (
                        <div className="notif-action-row" onClick={(e) => e.stopPropagation()}>
                          {actionState === "accept" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span className="notif-status-badge connected">
                                Ride Joined ✓
                              </span>
                              {n.data?.rideId && (
                                <button
                                  type="button"
                                  className="btn-notif-accept"
                                  style={{ padding: "4px 10px", fontSize: "11px", fontWeight: "600" }}
                                  onClick={() => {
                                    setIsOpen(false);
                                    window.location.href = `/businesses/mototribe/ride/${n.data.rideId}`;
                                  }}
                                >
                                  View Ride →
                                </button>
                              )}
                            </div>
                          ) : actionState === "ignore" ? (
                            <span className="notif-status-badge ignored">
                              Dismissed
                            </span>
                          ) : actionState === "error" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span className="notif-status-badge ignored">
                                {handledActions[`${n._id}_errorMsg`] || "Ride Unavailable / Expired"}
                              </span>
                              {n.data?.rideId && (
                                <button
                                  type="button"
                                  className="btn-notif-accept"
                                  style={{ padding: "4px 10px", fontSize: "11px", fontWeight: "600" }}
                                  onClick={() => {
                                    setIsOpen(false);
                                    window.location.href = `/businesses/mototribe/ride/${n.data.rideId}`;
                                  }}
                                >
                                  View Ride →
                                </button>
                              )}
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn-notif-accept"
                                disabled={actionLoading[n._id]}
                                onClick={async () => {
                                  setActionLoading((prev) => ({ ...prev, [n._id]: true }));
                                  try {
                                    // 1. Client-side expiration check (24 hours)
                                    const notifAge = n.createdAt
                                      ? Date.now() - new Date(n.createdAt).getTime()
                                      : 0;
                                    if (notifAge > 24 * 60 * 60 * 1000) {
                                      alert("This ride invitation has expired.");
                                      await markAsRead(n._id);
                                      setHandledActions((prev) => ({ ...prev, [n._id]: "error" }));
                                      return;
                                    }

                                    if (n.data?.rideId) {
                                      try {
                                        await apiClient.post(
                                          `/api/mototribe/rides/${n.data.rideId}/join`,
                                          { notificationId: n._id }
                                        );
                                      } catch (postErr) {
                                        const serverMsg =
                                          postErr.response?.data?.message ||
                                          postErr.message ||
                                          "";
                                        // If user is already the organizer or already a participant, treat as successful & navigate
                                        const isAlreadyInRide =
                                          serverMsg.toLowerCase().includes("already") ||
                                          serverMsg.toLowerCase().includes("organizer") ||
                                          serverMsg.toLowerCase().includes("participant");

                                        if (isAlreadyInRide) {
                                          await markAsRead(n._id);
                                          setHandledActions((prev) => ({ ...prev, [n._id]: "accept" }));
                                          setIsOpen(false);
                                          window.location.href = `/businesses/mototribe/ride/${n.data.rideId}`;
                                          return;
                                        }

                                        throw postErr;
                                      }
                                    } else {
                                      alert("Ride details are missing or invalid.");
                                      return;
                                    }

                                    await markAsRead(n._id);
                                    setHandledActions((prev) => ({ ...prev, [n._id]: "accept" }));
                                    setIsOpen(false);
                                    window.location.href = `/businesses/mototribe/ride/${n.data.rideId}`;
                                  } catch (err) {
                                    const errMsg =
                                      err.response?.data?.message ||
                                      err.message ||
                                      "Could not join ride.";
                                    alert(errMsg);
                                    await markAsRead(n._id);
                                    setHandledActions((prev) => ({
                                      ...prev,
                                      [n._id]: "error",
                                      [`${n._id}_errorMsg`]: errMsg,
                                    }));
                                  } finally {
                                    setActionLoading((prev) => ({ ...prev, [n._id]: false }));
                                  }
                                }}
                              >
                                {actionLoading[n._id] ? "Joining..." : "✓ Accept & View Ride"}
                              </button>
                              <button
                                type="button"
                                className="btn-notif-decline"
                                disabled={actionLoading[n._id]}
                                onClick={async () => {
                                  await markAsRead(n._id);
                                  setHandledActions((prev) => ({ ...prev, [n._id]: "ignore" }));
                                }}
                              >
                                Dismiss
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
