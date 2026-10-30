const webpush = require("web-push");
const PushSubscription = require("../../models/mototribe/PushSubscription");
const NotificationPreference = require("../../models/mototribe/NotificationPreference");

let isConfigured = false;
let hasLoggedWarning = false;

const initVapid = () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (
    publicKey &&
    privateKey &&
    subject &&
    !publicKey.startsWith("your_") &&
    !privateKey.startsWith("your_")
  ) {
    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      isConfigured = true;
    } catch (err) {
      if (!hasLoggedWarning) {
        console.warn("[WebPush] Failed to initialize VAPID:", err.message);
        hasLoggedWarning = true;
      }
      isConfigured = false;
    }
  } else {
    if (!hasLoggedWarning) {
      console.warn(
        "[WebPush] VAPID keys not configured. Web Push alerts will be skipped."
      );
      hasLoggedWarning = true;
    }
    isConfigured = false;
  }
};

// Initialize on module load
initVapid();

const isPushConfigured = () => isConfigured;

const getVapidPublicKey = () => {
  if (!isConfigured) return null;
  return process.env.VAPID_PUBLIC_KEY || null;
};

// Allowlisted push provider hosts (Chrome, Firefox, Safari, Edge/WNS)
const ALLOWED_PUSH_HOSTS = [
  "fcm.googleapis.com",
  "updates.push.services.mozilla.com",
];

const ALLOWED_PUSH_DOMAINS = [
  ".push.apple.com",
  ".notify.windows.com",
];

/**
 * Validates push subscription endpoint.
 * Requires https, rejects localhost and IP addresses, allows only known browser push hosts.
 *
 * @param {string} endpoint
 * @returns {boolean}
 */
const isValidPushEndpoint = (endpoint) => {
  if (!endpoint || typeof endpoint !== "string") return false;
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:") return false;

    const hostname = url.hostname.toLowerCase();

    // Reject localhost, IPv4, and IPv6
    if (
      hostname === "localhost" ||
      /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) ||
      hostname.includes(":") ||
      hostname.endsWith(".localhost")
    ) {
      return false;
    }

    // Exact host matches
    if (ALLOWED_PUSH_HOSTS.includes(hostname)) {
      return true;
    }

    // Allowed domain suffix matches (e.g. *.push.apple.com, *.notify.windows.com)
    if (ALLOWED_PUSH_DOMAINS.some((domain) => hostname.endsWith(domain))) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
};

const MUTABLE_PUSH_TYPES = [
  { type: "CONNECTION_REQUEST", label: "Connection Requests", brand: "mototribe" },
  { type: "CONNECTION_ACCEPTED", label: "Accepted Connections", brand: "mototribe" },
  { type: "RIDE_INVITE", label: "Ride Invitations", brand: "mototribe" },
  { type: "CHAT_MESSAGE", label: "Ride Group Chat Messages", brand: "mototribe" },
  { type: "GROUP_CALL", label: "Ride Voice & Video Calls", brand: "mototribe" },
  { type: "ORDER_UPDATE", label: "Order & Shipment Updates", brand: "modasphere" },
  { type: "DROP_ALERT", label: "Exclusive Drop Alerts", brand: "modasphere" },
  { type: "SYSTEM", label: "System & Platform Announcements", brand: "core" },
];

const VALID_PUSH_TYPE_KEYS = MUTABLE_PUSH_TYPES.map((t) => t.type);

// Sensitive regex patterns to sanitize before displaying on lock screens
const SENSITIVE_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // emails
  /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, // phone numbers
  /\b\d{1,3}\.\d{4,8}\s*,\s*\d{1,3}\.\d{4,8}\b/g, // GPS coordinates (lat, lng)
  /\b[A-Z]{2}[-\s]?\d{1,2}[-\s]?[A-Z]{1,2}[-\s]?\d{1,4}\b/g, // Vehicle registration (e.g. MH-12-AB-1234)
];

const sanitizeLockScreenText = (text) => {
  if (!text || typeof text !== "string") return "";
  let clean = text;
  for (const pattern of SENSITIVE_PATTERNS) {
    clean = clean.replace(pattern, "[redacted]");
  }
  return clean.slice(0, 120);
};

/**
 * Dispatch web push notification to all registered devices of a user.
 *
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {Object} options
 * @param {string} options.type
 * @param {string} options.title
 * @param {string} options.body
 * @param {string} options.url
 * @param {string} [options.tag]
 * @returns {Promise<{ sent: number, removed: number, failed: number }>}
 */
const sendPushToUser = async (userId, { type, title, body, url, tag } = {}) => {
  // 1. Refuse any type containing "SOS"
  if (type && typeof type === "string" && type.toUpperCase().includes("SOS")) {
    return { sent: 0, removed: 0, failed: 0 };
  }

  // 2. Check VAPID configuration
  if (!isConfigured) {
    return { sent: 0, removed: 0, failed: 0 };
  }

  if (!userId) {
    return { sent: 0, removed: 0, failed: 0 };
  }

  try {
    // 3. Check NotificationPreference (master switch and muted list)
    const pref = await NotificationPreference.findOne({ userId });
    if (pref) {
      if (pref.push && pref.push.enabled === false) {
        return { sent: 0, removed: 0, failed: 0 };
      }
      if (
        type &&
        pref.push &&
        Array.isArray(pref.push.muted) &&
        pref.push.muted.includes(type)
      ) {
        return { sent: 0, removed: 0, failed: 0 };
      }
    }

    // 4. Fetch subscriptions for the user
    const subscriptions = await PushSubscription.find({ userId });
    if (!subscriptions || subscriptions.length === 0) {
      return { sent: 0, removed: 0, failed: 0 };
    }

    // 5. Construct payload
    const payload = JSON.stringify({
      type: type || "SYSTEM",
      title: title || "Kaindra Notification",
      body: sanitizeLockScreenText(body || ""),
      url: url || "/",
      tag: tag || undefined,
      data: {
        type: type || "SYSTEM",
        url: url || "/",
      },
    });

    const pushOptions = {
      TTL: 3600, // 1 hour
      urgency: "normal",
    };

    let sent = 0;
    let removed = 0;
    let failed = 0;
    const successfulSubIds = [];
    const removedSubIds = [];

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.keys.p256dh,
                auth: sub.keys.auth,
              },
            },
            payload,
            pushOptions
          );
          sent++;
          successfulSubIds.push(sub._id);
        } catch (err) {
          const status = err.statusCode || (err.response && err.response.statusCode);
          if (status === 404 || status === 410) {
            removedSubIds.push(sub._id);
            removed++;
          } else {
            console.warn(
              `[WebPush] Failed sending push alert to endpoint: ${err.message}`
            );
            failed++;
          }
        }
      })
    );

    // Bulk delete stale 404/410 subscriptions
    if (removedSubIds.length > 0) {
      await PushSubscription.deleteMany({ _id: { $in: removedSubIds } }).catch(
        () => null
      );
    }

    // Bulk update lastUsedAt in one database operation
    if (successfulSubIds.length > 0) {
      await PushSubscription.updateMany(
        { _id: { $in: successfulSubIds } },
        { $set: { lastUsedAt: new Date() } }
      ).catch(() => null);
    }

    return { sent, removed, failed };
  } catch (error) {
    console.error("[WebPush] Error during sendPushToUser:", error.message);
    return { sent: 0, removed: 0, failed: 0 };
  }
};

module.exports = {
  isPushConfigured,
  initVapid,
  getVapidPublicKey,
  isValidPushEndpoint,
  ALLOWED_PUSH_HOSTS,
  ALLOWED_PUSH_DOMAINS,
  MUTABLE_PUSH_TYPES,
  VALID_PUSH_TYPE_KEYS,
  sanitizeLockScreenText,
  sendPushToUser,
};
