/**
 * Utility functions for safely storing and retrieving return-to navigation paths
 * in sessionStorage to prevent open-redirect vulnerabilities.
 */

const STORAGE_KEY = "kaindra_auth_return_to";
const ACTION_KEY = "kaindra_pending_action";

/**
 * Validates that a path is strictly a relative path on this site.
 * Rejects external URLs, protocol-relative URLs (//), and dangerous schemes (javascript:, etc.).
 *
 * @param {string} path
 * @returns {boolean}
 */
export function isValidRelativePath(path) {
  if (typeof path !== "string" || !path) return false;

  const trimmed = path.trim();

  // Must begin with a single "/"
  if (!trimmed.startsWith("/")) return false;

  // Reject protocol-relative URLs like "//evil.com" or backslash bypasses like "/\evil.com"
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) return false;

  // Reject anything containing URL schemes before a query/hash (e.g., "/login:https://evil.com" or "javascript:")
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return false;

  return true;
}

/**
 * Stores a safe relative path to return to after authentication.
 *
 * @param {string} path
 */
export function setReturnToPath(path) {
  if (!isValidRelativePath(path)) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, path.trim());
  } catch (err) {
    console.warn("[authReturnTo] Unable to save return-to path:", err);
  }
}

/**
 * Retrieves the stored return-to path, validates it, and immediately removes it from sessionStorage.
 *
 * @returns {string | null}
 */
export function getAndClearReturnToPath() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);

    if (stored && isValidRelativePath(stored)) {
      return stored.trim();
    }
  } catch (err) {
    console.warn("[authReturnTo] Unable to retrieve return-to path:", err);
  }
  return null;
}

/**
 * Stores an in-page pending action to complete after successful authentication.
 *
 * @param {{ type: string, [key: string]: any }} action
 */
export function setPendingAction(action) {
  if (!action || typeof action !== "object") return;
  try {
    sessionStorage.setItem(ACTION_KEY, JSON.stringify(action));
  } catch (err) {
    console.warn("[authReturnTo] Unable to save pending action:", err);
  }
}

/**
 * Retrieves and clears the stored pending action.
 *
 * @returns {{ type: string, [key: string]: any } | null}
 */
export function getAndClearPendingAction() {
  try {
    const raw = sessionStorage.getItem(ACTION_KEY);
    sessionStorage.removeItem(ACTION_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("[authReturnTo] Unable to retrieve pending action:", err);
  }
  return null;
}
