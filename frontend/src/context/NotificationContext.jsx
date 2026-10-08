import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import apiClient from "../services/apiClient";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pushPermission, setPushPermission] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );

  const seenIdsRef = useRef(new Set());
  const initialLoadRef = useRef(true);

  // Request Native Browser Push Permission
  const requestPushPermission = useCallback(async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setPushPermission(perm);
        return perm;
      } catch (err) {
        console.warn("Could not request notification permission:", err);
      }
    }
    return "denied";
  }, []);

  // Trigger Native Device Notification Popup
  const triggerDeviceNotification = useCallback((item) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        const n = new Notification(item.title || "Kaindra Alert", {
          body: item.message,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: item._id || String(Date.now()),
        });
        n.onclick = () => {
          window.focus();
          n.close();
        };
      } catch (err) {
        console.warn("Device notification error:", err);
      }
    }
  }, []);

  // Fetch live notifications from backend API
  const fetchNotifications = useCallback(async (isPolling = false) => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    if (!isPolling) setLoading(true);

    try {
      const res = await apiClient.get("/api/core/notifications?limit=30");
      const list = res.data.data?.notifications || [];
      const count = res.data.data?.unreadCount || 0;

      // Check for brand new unread notifications to trigger OS device push popup
      if (!initialLoadRef.current && isPolling) {
        list.forEach((item) => {
          if (!item.isRead && !seenIdsRef.current.has(item._id)) {
            triggerDeviceNotification(item);
          }
        });
      }

      list.forEach((item) => seenIdsRef.current.add(item._id));
      initialLoadRef.current = false;

      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      // Ignore polling auth errors
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [isAuthenticated, triggerDeviceNotification]);

  // Initial fetch and 5-second real-time polling interval
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(false);
      const interval = setInterval(() => {
        fetchNotifications(true);
      }, 5000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      seenIdsRef.current.clear();
      initialLoadRef.current = true;
    }
  }, [isAuthenticated, fetchNotifications]);

  // Mark single notification as read
  const markAsRead = async (id) => {
    try {
      await apiClient.patch(`/api/core/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async (brand = "all") => {
    try {
      await apiClient.patch("/api/core/notifications/read-all", { brand });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  // Respond to connection request (Accept or Ignore) directly from notification
  const respondToConnection = async (requestId, action, notificationId) => {
    try {
      await apiClient.patch(`/api/core/connections/requests/${requestId}/respond`, { action });
      
      if (notificationId) {
        await markAsRead(notificationId);
      }

      // Re-fetch notifications and trigger custom event for rider network refresh
      await fetchNotifications(false);
      window.dispatchEvent(new CustomEvent("kaindra:connection_updated", { detail: { requestId, action } }));
      return true;
    } catch (err) {
      console.error("Failed to respond to connection request:", err);
      throw err;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        pushPermission,
        requestPushPermission,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        respondToConnection,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
