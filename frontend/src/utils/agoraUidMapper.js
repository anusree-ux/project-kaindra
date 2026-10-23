/**
 * Agora UID and Participant Name Resolution Utility
 * 
 * Computes deterministic Agora numeric UIDs from MongoDB ObjectIds
 * matching the exact backend implementation in:
 * backend/src/services/mototribe/agoraService.js (Lines 85-87)
 */

/**
 * Deterministically computes the 32-bit integer Agora UID from a MongoDB ObjectId string.
 * Must match backend logic: parseInt(userId.toString().slice(-8), 16) % 2147483647
 * 
 * @param {string|Object} userId - MongoDB ObjectId string or populated User object
 * @returns {number|null} 32-bit positive integer UID, or null if invalid
 */
export function computeAgoraUidFromUserId(userId) {
  if (!userId) return null;
  const rawId = typeof userId === "object" ? String(userId._id || userId.id || "") : String(userId);
  if (!rawId || rawId.length < 8) return null;

  try {
    const last8Hex = rawId.slice(-8);
    const parsed = parseInt(last8Hex, 16);
    if (isNaN(parsed)) return null;
    return parsed % 2147483647;
  } catch {
    return null;
  }
}

/**
 * Builds a Map of Agora UID -> Rider Display Name for all other riders (participants + organizer).
 * If two riders collide onto the exact same UID, both are marked as "Rider" to prevent showing a wrong name.
 * 
 * @param {Array} participants - List of participants from GET /rides/:id/participants
 * @param {Object} organizer - Organizer user object from ride details
 * @param {string} currentUserId - The authenticated user's ID (excluded from other-riders map)
 * @returns {Map<number, string>} Map of UID -> resolved display name
 */
export function buildParticipantUidMap(participants = [], organizer = null, currentUserId = null) {
  const uidToCandidates = new Map();

  const addCandidate = (userObj, defaultRole = "Rider") => {
    if (!userObj) return;
    const uidStr = String(userObj._id || userObj.id || userObj.userId || "");
    if (!uidStr || (currentUserId && uidStr === String(currentUserId))) {
      return; // Skip self or missing id
    }

    const agoraUid = computeAgoraUidFromUserId(uidStr);
    if (agoraUid === null) return;

    const displayName = userObj.name || userObj.username || defaultRole;
    if (!uidToCandidates.has(agoraUid)) {
      uidToCandidates.set(agoraUid, []);
    }
    uidToCandidates.get(agoraUid).push(displayName);
  };

  // Add organizer
  if (organizer) {
    addCandidate(organizer, "Organizer");
  }

  // Add participants
  if (Array.isArray(participants)) {
    participants.forEach((p) => {
      const user = p.userId || p.user || p;
      addCandidate(user, "Rider");
    });
  }

  // Resolve collisions
  const resolvedMap = new Map();
  for (const [uid, names] of uidToCandidates.entries()) {
    if (names.length === 1) {
      resolvedMap.set(uid, names[0]);
    } else {
      // Collision detected: multiple riders mapped to this same UID
      // Display "Rider" for both rather than attributing the wrong name
      resolvedMap.set(uid, "Rider");
    }
  }

  return resolvedMap;
}

/**
 * Resolves a display name for an Agora UID using the precomputed map.
 * 
 * @param {Map<number, string>} uidMap
 * @param {number} uid
 * @returns {string} Resolved rider name or clean fallback
 */
export function getRiderNameForUid(uidMap, uid) {
  if (uidMap && uidMap.has(Number(uid))) {
    return uidMap.get(Number(uid));
  }
  return `Rider #${uid}`;
}
