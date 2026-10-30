import apiClient from "./apiClient";

/**
 * Convert URL-safe base64 string to Uint8Array for applicationServerKey
 * @param {string} base64String
 * @returns {Uint8Array}
 */
export function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if the browser supports Web Push and Service Workers
 */
export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Detect iOS devices (iPhone, iPad, iPod)
 */
export function isIOS() {
  if (typeof window === "undefined" || !navigator) return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * Detect if running in standalone PWA / Home Screen app mode
 */
export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.navigator.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

/**
 * Register public/sw.js service worker
 */
export async function registerServiceWorker() {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    return registration;
  } catch (error) {
    console.warn("[WebPush] Service Worker registration failed:", error);
    return null;
  }
}

/**
 * Get current browser push subscription from PushManager
 */
export async function getCurrentPushSubscription() {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.warn("[WebPush] Failed getting subscription:", error);
    return null;
  }
}

/**
 * Request notification permission and subscribe to browser Web Push.
 * Must be triggered by explicit user gesture (click), never on page load.
 */
export async function subscribeUserToPush() {
  if (!isPushSupported()) {
    return { success: false, reason: "unsupported" };
  }

  // 1. Request OS permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { success: false, permission };
  }

  try {
    // 2. Ensure Service Worker is active
    let registration = await navigator.serviceWorker.getRegistration("/");
    if (!registration) {
      registration = await registerServiceWorker();
    }
    await navigator.serviceWorker.ready;

    // 3. Fetch VAPID public key from backend
    const keyRes = await apiClient.get("/api/core/notifications/push/public-key");
    const publicKey = keyRes.data?.data?.publicKey;

    if (!publicKey) {
      throw new Error("Push server public key not available");
    }

    // 4. Subscribe with PushManager
    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    // 5. Send subscription JSON to backend (never stored in localStorage)
    const subJson = subscription.toJSON();
    await apiClient.post("/api/core/notifications/push/subscriptions", {
      endpoint: subJson.endpoint,
      keys: subJson.keys,
    });

    return { success: true, permission: "granted", subscription };
  } catch (error) {
    console.error("[WebPush] Subscription error:", error);
    return {
      success: false,
      permission: Notification.permission,
      error: error.response?.data?.message || error.message,
    };
  }
}

/**
 * Unsubscribe current device from push alerts
 */
export async function unsubscribeUserFromPush() {
  if (!isPushSupported()) return { success: true };

  try {
    const subscription = await getCurrentPushSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      // Notify backend first
      try {
        await apiClient.delete("/api/core/notifications/push/subscriptions", {
          data: { endpoint },
        });
      } catch (err) {
        // Ignore backend deletion failures on logout/unsub
      }

      await subscription.unsubscribe();
    }
    return { success: true };
  } catch (error) {
    console.warn("[WebPush] Unsubscribe error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Re-register existing browser subscription with backend upon login
 */
export async function syncExistingSubscriptionOnLogin() {
  if (!isPushSupported() || Notification.permission !== "granted") {
    return;
  }

  try {
    const subscription = await getCurrentPushSubscription();
    if (subscription) {
      const subJson = subscription.toJSON();
      await apiClient.post("/api/core/notifications/push/subscriptions", {
        endpoint: subJson.endpoint,
        keys: subJson.keys,
      });
    }
  } catch (err) {
    // Non-blocking sync failure
    console.warn("[WebPush] Login subscription sync error:", err.message);
  }
}

/**
 * Fetch push notification preferences from backend
 */
export async function getPushPreferences() {
  const res = await apiClient.get("/api/core/notifications/push/preferences");
  return res.data?.data || { push: { enabled: true, muted: [] }, mutableTypes: {} };
}

/**
 * Update push notification preferences
 */
export async function updatePushPreferences({ enabled, muted }) {
  const payload = {};
  if (enabled !== undefined) payload.enabled = enabled;
  if (muted !== undefined) payload.muted = muted;

  const res = await apiClient.patch("/api/core/notifications/push/preferences", payload);
  return res.data?.data?.push;
}

/**
 * Send a test push alert to current user
 */
export async function sendTestPushAlert() {
  const res = await apiClient.post("/api/core/notifications/push/test");
  return res.data;
}
