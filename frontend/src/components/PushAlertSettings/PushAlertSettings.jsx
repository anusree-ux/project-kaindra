import { useState, useEffect, useCallback } from "react";
import {
  isPushSupported,
  isIOS,
  isStandalone,
  subscribeUserToPush,
  unsubscribeUserFromPush,
  getPushPreferences,
  updatePushPreferences,
  sendTestPushAlert,
  getCurrentPushSubscription,
} from "../../services/pushNotificationService";
import "./PushAlertSettings.css";

export default function PushAlertSettings() {
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState("default");
  const [isIOSBrowser, setIsIOSBrowser] = useState(false);
  const [standalone, setStandalone] = useState(false);

  const [loading, setLoading] = useState(false);
  const [prefLoading, setPrefLoading] = useState(true);
  const [preferences, setPreferences] = useState({ enabled: true, muted: [] });
  const [mutableTypes, setMutableTypes] = useState({});
  const [testCooldown, setTestCooldown] = useState(0);
  const [feedback, setFeedback] = useState(null);

  // Check browser state and fetch preferences
  const loadState = useCallback(async () => {
    const isSup = isPushSupported();
    setSupported(isSup);

    const ios = isIOS();
    const appMode = isStandalone();
    setIsIOSBrowser(ios && !appMode);
    setStandalone(appMode);

    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }

    try {
      setPrefLoading(true);
      const data = await getPushPreferences();
      if (data.push) {
        setPreferences(data.push);
      }
      if (data.mutableTypes) {
        // Exclude any SOS keys if present
        const cleanTypes = {};
        Object.entries(data.mutableTypes).forEach(([key, label]) => {
          if (!key.toUpperCase().includes("SOS")) {
            cleanTypes[key] = label;
          }
        });
        setMutableTypes(cleanTypes);
      }
    } catch (err) {
      console.warn("[PushAlertSettings] Could not load preferences:", err);
    } finally {
      setPrefLoading(false);
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  // Cooldown timer ticker
  useEffect(() => {
    if (testCooldown <= 0) return;
    const interval = setInterval(() => {
      setTestCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [testCooldown]);

  const handleEnablePush = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await subscribeUserToPush();
      if (res.success) {
        setPermission("granted");
        setFeedback({ type: "success", message: "Push notifications successfully activated!" });
        await loadState();
      } else if (res.permission === "denied") {
        setPermission("denied");
        setFeedback({
          type: "error",
          message: "Notification permission was blocked in your browser settings.",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Failed to enable notifications. Please check your browser settings.",
        });
      }
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  const handleMasterToggle = async (e) => {
    const nextEnabled = e.target.checked;
    setPreferences((prev) => ({ ...prev, enabled: nextEnabled }));
    try {
      await updatePushPreferences({ enabled: nextEnabled });
      setFeedback({
        type: "success",
        message: nextEnabled ? "Push notifications enabled." : "Push notifications paused.",
      });
    } catch (err) {
      setPreferences((prev) => ({ ...prev, enabled: !nextEnabled }));
      setFeedback({ type: "error", message: "Failed to update preference." });
    }
  };

  const handleTypeToggle = async (typeKey) => {
    const isCurrentlyMuted = preferences.muted.includes(typeKey);
    let nextMuted;
    if (isCurrentlyMuted) {
      nextMuted = preferences.muted.filter((t) => t !== typeKey);
    } else {
      nextMuted = [...preferences.muted, typeKey];
    }

    setPreferences((prev) => ({ ...prev, muted: nextMuted }));
    try {
      await updatePushPreferences({ muted: nextMuted });
    } catch (err) {
      setPreferences((prev) => ({ ...prev, muted: isCurrentlyMuted ? [...prev.muted, typeKey] : prev.muted.filter((t) => t !== typeKey) }));
      setFeedback({ type: "error", message: "Failed to update category setting." });
    }
  };

  const handleSendTestAlert = async () => {
    if (testCooldown > 0) return;
    setLoading(true);
    setFeedback(null);
    try {
      await sendTestPushAlert();
      setTestCooldown(30);
      setFeedback({
        type: "success",
        message: "Test alert dispatched! Check your desktop or mobile notification bar.",
      });
    } catch (err) {
      if (err.response?.status === 429) {
        setTestCooldown(30);
        setFeedback({
          type: "warning",
          message: "Rate limit reached. Please wait 30 seconds before sending another test alert.",
        });
      } else {
        setFeedback({
          type: "error",
          message: err.response?.data?.message || "Failed to dispatch test notification.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="push-settings-container">
      <div className="push-settings-header">
        <div className="push-header-left">
          <span className="push-icon-badge">🔔</span>
          <div>
            <h3 className="push-settings-title">Web Push Notifications</h3>
            <p className="push-settings-desc">
              Real-time desktop and mobile OS notification bar alerts for connections, rides, and updates.
            </p>
          </div>
        </div>

        {permission === "granted" && (
          <label className="push-switch" title="Master Toggle">
            <input
              type="checkbox"
              checked={preferences.enabled}
              onChange={handleMasterToggle}
              disabled={loading}
            />
            <span className="push-slider"></span>
          </label>
        )}
      </div>

      {feedback && (
        <div className={`push-feedback-banner ${feedback.type}`}>
          <span>{feedback.type === "success" ? "✓" : feedback.type === "warning" ? "⏳" : "⚠️"}</span>
          <p>{feedback.message}</p>
        </div>
      )}

      {/* State: Unsupported Browser */}
      {!supported && (
        <div className="push-state-box unsupported">
          <span className="state-icon">🚫</span>
          <div className="state-info">
            <strong>Push alerts not supported</strong>
            <p>
              Your current web browser does not support the standard Web Push API or Service Workers.
              Try using modern Chrome, Firefox, Edge, or Safari 16+.
            </p>
          </div>
        </div>
      )}

      {/* State: iOS Safari outside standalone app */}
      {supported && isIOSBrowser && !standalone && (
        <div className="push-state-box ios-pwa">
          <span className="state-icon">📲</span>
          <div className="state-info">
            <strong>Add to Home Screen to get alerts</strong>
            <p>
              Apple iOS requires adding this website to your Home Screen to receive Web Push notifications.
            </p>
            <ol className="ios-steps">
              <li>Tap the <strong>Share</strong> button (box with upward arrow) at the bottom of Safari.</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              <li>Open Kaindra from your Home Screen to enable instant alerts.</li>
            </ol>
          </div>
        </div>
      )}

      {/* State: Permission Default (Not yet requested) */}
      {supported && (!isIOSBrowser || standalone) && permission === "default" && (
        <div className="push-state-box default-prompt">
          <div className="state-info">
            <strong>Stay updated on the go</strong>
            <p>
              Never miss a connection invite, ride call, or flash drop alert. Turn on native push notifications for your device.
            </p>
          </div>
          <button
            type="button"
            className="push-primary-btn"
            onClick={handleEnablePush}
            disabled={loading}
          >
            {loading ? "Activating..." : "⚡ Turn on alerts"}
          </button>
        </div>
      )}

      {/* State: Permission Denied */}
      {supported && permission === "denied" && (
        <div className="push-state-box denied">
          <span className="state-icon">🔒</span>
          <div className="state-info">
            <strong>Alerts are blocked in browser settings</strong>
            <p>
              Notification permission was denied. To re-enable push alerts:
            </p>
            <ul className="denied-steps">
              <li>Click the <strong>Lock / Site Settings</strong> icon on the left side of your browser's address bar.</li>
              <li>Look for <strong>Notifications</strong> and change it from <em>Block</em> to <em>Allow</em>.</li>
              <li>Reload the page to sync your notification status.</li>
            </ul>
          </div>
        </div>
      )}

      {/* State: Permission Granted -> Preferences & Toggles */}
      {supported && permission === "granted" && (
        <div className="push-active-content">
          <div className="push-meta-row">
            <span className="push-status-pill active">
              <span className="status-dot"></span> Device Connected
            </span>
            <button
              type="button"
              className="push-test-btn"
              onClick={handleSendTestAlert}
              disabled={loading || testCooldown > 0 || !preferences.enabled}
              title={!preferences.enabled ? "Enable notifications first" : "Dispatch a test alert"}
            >
              {testCooldown > 0 ? `Wait ${testCooldown}s` : "🧪 Send test alert"}
            </button>
          </div>

          <div className="push-categories-section">
            <h4 className="categories-heading">Notification Categories</h4>
            <p className="categories-sub">Choose which alerts appear in your system notification bar:</p>

            {prefLoading ? (
              <div className="push-loading-indicator">Loading preferences...</div>
            ) : (
              <div className="push-types-grid">
                {Object.entries(mutableTypes).map(([typeKey, typeLabel]) => {
                  const isChecked = !preferences.muted.includes(typeKey);
                  return (
                    <label
                      key={typeKey}
                      className={`push-type-card ${isChecked ? "active" : "muted"}`}
                    >
                      <div className="type-card-info">
                        <span className="type-name">{typeLabel}</span>
                        <span className="type-key-badge">{typeKey}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTypeToggle(typeKey)}
                        disabled={!preferences.enabled}
                      />
                      <span className="type-checkbox-custom"></span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
