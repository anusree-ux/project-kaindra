const AUTH_STORAGE_KEY = "mototribe_auth_session";

const ACCESS_TOKEN_DURATION = 15 * 60 * 1000;
const REFRESH_TOKEN_DURATION = 30 * 24 * 60 * 60 * 1000;

function readSession() {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!stored) {
      return null;
    }

    const session = JSON.parse(stored);

    if (!session || typeof session !== "object") {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

function saveSession(session) {
  try {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(session)
    );

    return true;
  } catch {
    return false;
  }
}

export function getMotoTribeSession() {
  return readSession();
}

export function isMotoTribeLoggedIn() {
  const session = readSession();

  if (!session) {
    return false;
  }

  if (!session.refreshTokenExpiresAt) {
    return false;
  }

  return (
    Date.now() <
    new Date(session.refreshTokenExpiresAt).getTime()
  );
}

export function isAccessTokenExpired(session = readSession()) {
  if (!session?.accessTokenExpiresAt) {
    return true;
  }

  return (
    Date.now() >=
    new Date(session.accessTokenExpiresAt).getTime()
  );
}

export function isRefreshTokenExpired(session = readSession()) {
  if (!session?.refreshTokenExpiresAt) {
    return true;
  }

  return (
    Date.now() >=
    new Date(session.refreshTokenExpiresAt).getTime()
  );
}

export function refreshMotoTribeSession() {
  const session = readSession();

  if (!session) {
    return null;
  }

  if (isRefreshTokenExpired(session)) {
    clearMotoTribeSession();
    return null;
  }

  const refreshedSession = {
    ...session,

    accessToken: `mt_access_${Date.now()}`,

    accessTokenExpiresAt: new Date(
      Date.now() + ACCESS_TOKEN_DURATION
    ).toISOString(),

    refreshTokenExpiresAt:
      session.refreshTokenExpiresAt ||
      new Date(
        Date.now() + REFRESH_TOKEN_DURATION
      ).toISOString(),

    refreshedAt: new Date().toISOString(),
  };

  const saved = saveSession(refreshedSession);

  return saved ? refreshedSession : null;
}

export function getValidMotoTribeSession() {
  const session = readSession();

  if (!session) {
    return null;
  }

  if (isRefreshTokenExpired(session)) {
    clearMotoTribeSession();
    return null;
  }

  if (isAccessTokenExpired(session)) {
    return refreshMotoTribeSession();
  }

  return session;
}

export function clearMotoTribeSession() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem("mototribe_user");
  } catch {
    // Ignore storage errors.
  }
}

export function startMotoTribeTokenRefresh() {
  const checkSession = () => {
    const session = readSession();

    if (!session) {
      return;
    }

    if (isRefreshTokenExpired(session)) {
      clearMotoTribeSession();
      return;
    }

    const accessTokenExpiresAt = new Date(
      session.accessTokenExpiresAt
    ).getTime();

    const timeUntilExpiry =
      accessTokenExpiresAt - Date.now();

    const refreshThreshold = 2 * 60 * 1000;

    if (timeUntilExpiry <= refreshThreshold) {
      refreshMotoTribeSession();
    }
  };

  checkSession();

  const interval = window.setInterval(
    checkSession,
    60 * 1000
  );

  return () => {
    window.clearInterval(interval);
  };
}