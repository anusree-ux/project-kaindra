import { useState, useRef, useEffect } from "react";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
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
    if (filter === "UNREAD") return !n.isRead;
    if (filter === "REQUESTS") return n.type === "CONNECTION_REQUEST";
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
                    onClick={() => !n.isRead && markAsRead(n._id)}
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
