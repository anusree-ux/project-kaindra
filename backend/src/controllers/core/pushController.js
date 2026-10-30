const PushSubscription = require("../../models/mototribe/PushSubscription");
const NotificationPreference = require("../../models/mototribe/NotificationPreference");
const {
  getVapidPublicKey,
  sendPushToUser,
  isValidPushEndpoint,
  MUTABLE_PUSH_TYPES,
  VALID_PUSH_TYPE_KEYS,
} = require("../../services/mototribe/pushService");
const AppError = require("../../utils/AppError");

// In-memory test push cooldown map: userId -> timestamp
const testPushCooldownMap = new Map();
const TEST_PUSH_COOLDOWN_MS = 30 * 1000;

/**
 * @desc    Get VAPID public key
 * @route   GET /api/core/notifications/push/public-key
 * @access  Public
 */
const getPublicKey = async (req, res, next) => {
  try {
    const publicKey = getVapidPublicKey();
    if (!publicKey) {
      throw new AppError("Push alerts are not configured", 503);
    }

    res.status(200).json({
      status: "success",
      data: {
        publicKey,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Subscribe device to web push alerts
 * @route   POST /api/core/notifications/push/subscriptions
 * @access  Private
 */
const subscribe = async (req, res, next) => {
  try {
    const publicKey = getVapidPublicKey();
    if (!publicKey) {
      throw new AppError("Push alerts are not configured", 503);
    }

    const { endpoint, keys } = req.body || {};

    if (!endpoint || typeof endpoint !== "string" || !isValidPushEndpoint(endpoint)) {
      throw new AppError("A valid browser push service endpoint URL is required", 400);
    }

    if (
      !keys ||
      typeof keys !== "object" ||
      !keys.p256dh ||
      typeof keys.p256dh !== "string" ||
      !keys.auth ||
      typeof keys.auth !== "string"
    ) {
      throw new AppError("Push subscription keys (p256dh and auth) are required", 400);
    }

    // Upsert subscription: if endpoint exists, reassign to current user & update keys
    const subscription = await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        userId: req.user._id,
        keys: {
          p256dh: keys.p256dh.trim(),
          auth: keys.auth.trim(),
        },
        userAgent: req.headers["user-agent"] || "",
        lastUsedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Enforce 10 subscription limit per user (evicting oldest by lastUsedAt)
    await PushSubscription.enforceSubscriptionLimit(req.user._id);

    res.status(201).json({
      status: "success",
      data: {
        subscription,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unsubscribe device from web push alerts
 * @route   DELETE /api/core/notifications/push/subscriptions
 * @access  Private
 */
const unsubscribe = async (req, res, next) => {
  try {
    const { endpoint } = req.body || {};
    if (!endpoint || typeof endpoint !== "string") {
      throw new AppError("Endpoint is required", 400);
    }

    await PushSubscription.findOneAndDelete({
      endpoint,
      userId: req.user._id,
    });

    res.status(200).json({
      status: "success",
      message: "Subscription removed successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get notification push preferences
 * @route   GET /api/core/notifications/push/preferences
 * @access  Private
 */
const getPreferences = async (req, res, next) => {
  try {
    let pref = await NotificationPreference.findOne({ userId: req.user._id });
    if (!pref) {
      pref = await NotificationPreference.create({ userId: req.user._id });
    }

    res.status(200).json({
      status: "success",
      data: {
        push: pref.push,
        mutableTypes: MUTABLE_PUSH_TYPES,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update notification push preferences
 * @route   PATCH /api/core/notifications/push/preferences
 * @access  Private
 */
const updatePreferences = async (req, res, next) => {
  try {
    const { enabled, muted } = req.body || {};

    if (enabled !== undefined && typeof enabled !== "boolean") {
      throw new AppError("Enabled must be a boolean", 400);
    }

    if (muted !== undefined) {
      if (!Array.isArray(muted)) {
        throw new AppError("Muted must be an array of notification types", 400);
      }
      for (const t of muted) {
        if (!VALID_PUSH_TYPE_KEYS.includes(t)) {
          throw new AppError(`Invalid notification type in muted list: ${t}`, 400);
        }
      }
    }

    let pref = await NotificationPreference.findOne({ userId: req.user._id });
    if (!pref) {
      pref = new NotificationPreference({ userId: req.user._id });
    }

    if (enabled !== undefined) {
      pref.push.enabled = enabled;
    }
    if (muted !== undefined) {
      pref.push.muted = muted;
    }

    await pref.save();

    res.status(200).json({
      status: "success",
      data: {
        push: pref.push,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send a test push notification to the logged-in user
 * @route   POST /api/core/notifications/push/test
 * @access  Private
 */
const sendTestPush = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const now = Date.now();
    const lastSent = testPushCooldownMap.get(userId) || 0;

    if (now - lastSent < TEST_PUSH_COOLDOWN_MS) {
      throw new AppError("Please wait before requesting another test alert", 429);
    }

    testPushCooldownMap.set(userId, now);

    const result = await sendPushToUser(req.user._id, {
      type: "SYSTEM",
      title: "Test Alert",
      body: "Web push notifications are working!",
      url: "/",
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicKey,
  subscribe,
  unsubscribe,
  getPreferences,
  updatePreferences,
  sendTestPush,
};
