import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import apiClient from "../services/apiClient";

import { subscribeUserToPush } from "../services/pushNotificationService";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pushPermission, setPushPermission] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );

  const initialLoadRef = useRef(true);

  // Request Native Browser Push Permission and subscribe
  const requestPushPermission = useCallback(async () => {
    try {
      const res = await subscribeUserToPush();
      if (typeof window !== "undefined" && "Notification" in window) {
        setPushPermission(Notification.permission);
      }
      return res;
    } catch (err) {
      console.warn("Could not subscribe to push alerts:", err);
      return { success: false, error: err.message };
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

      // Filter out notifications older than 24 hours
      const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
      const validList = list.filter((item) => {
        if (!item.createdAt) return true;
        return Date.now() - new Date(item.createdAt).getTime() <= TWENTY_FOUR_HOURS_MS;
      });

      initialLoadRef.current = false;
      setNotifications(validList);
      setUnreadCount(count);
    } catch (err) {
      // Ignore polling auth errors
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [isAuthenticated]);

  // Listen for Service Worker postMessage events when page is visible and focused
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const handleServiceWorkerMessage = (event) => {
      if (event.data?.type === "PUSH_NOTIFICATION_RECEIVED") {
        fetchNotifications(false);
      }
    };

    navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
    };
  }, [fetchNotifications]);

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
