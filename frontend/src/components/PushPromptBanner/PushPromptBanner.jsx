import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  isPushSupported,
  isIOS,
  isStandalone,
  subscribeUserToPush,
} from "../../services/pushNotificationService";
import "./PushPromptBanner.css";

const DISMISS_KEY = "kaindra_push_prompt_dismissed_until";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default function PushPromptBanner() {
  const { isAuthenticated } = useAuth();
  const [visible, setVisible] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setVisible(false);
      return;
    }

    if (!isPushSupported()) {
      setVisible(false);
      return;
    }

    // iOS outside PWA cannot receive Web Push without Add to Home Screen first
    if (isIOS() && !isStandalone()) {
      setVisible(false);
      return;
    }

    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "default") {
        setVisible(false);
        return;
      }
    }

    // Check 7-day dismissal timestamp
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      setVisible(false);
      return;
    }

    setVisible(true);
  }, [isAuthenticated]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + SEVEN_DAYS_MS));
    setVisible(false);
  };

  const handleEnable = async () => {
    setSubscribing(true);
    try {
      const res = await subscribeUserToPush();
      if (res.success || res.permission === "granted" || res.permission === "denied") {
        setVisible(false);
      }
    } catch (err) {
      console.warn("[PushPromptBanner] Enable error:", err);
    } finally {
      setSubscribing(false);
    }
  };

  if (!visible) return null;

  return (
    <aside className="push-soft-prompt" role="region" aria-label="Web push notification invitation">
      <div className="push-prompt-content">
        <div className="push-prompt-text">
          <span className="push-prompt-icon" aria-hidden="true">🔔</span>
          <p>
            <strong>Enable Real-Time Alerts</strong>
            <span>Get instant notifications for connections, group rides, and orders right on your desktop or phone.</span>
          </p>
        </div>
        <div className="push-prompt-actions">
          <button
            type="button"
            className="push-prompt-accept"
            onClick={handleEnable}
            disabled={subscribing}
          >
            {subscribing ? "Activating..." : "Enable Alerts"}
          </button>
          <button
            type="button"
            className="push-prompt-dismiss"
            onClick={handleDismiss}
            aria-label="Dismiss notification prompt for 7 days"
          >
            ✕
          </button>
        </div>
      </div>
    </aside>
  );
}
