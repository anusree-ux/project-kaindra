import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCommunityAuth } from "../../context/CommunityAuthContext";
import { setReturnToPath } from "../../utils/authReturnTo";
import "./RequireAuth.css";

/**
 * Reusable route guard for protected pages and routes.
 *
 * Requirements handled:
 * - While session is loading (silent refresh cookie restore): displays a clean loader, not the login prompt.
 * - Supports both Kaindra global session and dedicated Community session.
 * - When logged out: saves current safe path to sessionStorage, opens auth modal,
 *   and renders a short "Log in to continue" message in place of the page.
 * - When authenticated: renders children or outlet.
 */
export default function RequireAuth({ children, message = "Please sign in to continue." }) {
  const { isAuthenticated, loading: authLoading, openAuthModal } = useAuth();
  const { isCommunityAuth, loading: commLoading } = useCommunityAuth();
  const location = useLocation();

  const authenticated = isAuthenticated || isCommunityAuth;
  const loading = authLoading || commLoading;

  useEffect(() => {
    if (!loading && !authenticated) {
      const currentPath = location.pathname + location.search;
      setReturnToPath(currentPath);
      openAuthModal("login");
    }
  }, [loading, authenticated, location.pathname, location.search, openAuthModal]);

  // 1. Session restore in progress (prevent screen flashing or premature login prompt)
  if (loading) {
    return (
      <div className="require-auth-loading-container" role="status" aria-live="polite">
        <div className="require-auth-spinner" />
        <p className="require-auth-loading-text">Verifying your Kaindra session...</p>
      </div>
    );
  }

  // 2. Unauthenticated: show short prompt in place of page while auth modal opens
  if (!authenticated) {
    const isCommunityPage = location.pathname.includes("/communities");

    return (
      <div className="require-auth-unauth-container">
        <div className="require-auth-unauth-card">
          <div className="require-auth-icon-badge" aria-hidden="true">
            🔒
          </div>
          <h2 className="require-auth-title">Log in to continue</h2>
          <p className="require-auth-desc">{message}</p>
          <div className="require-auth-actions">
            {isCommunityPage ? (
              <>
                <Link to="/communities/login" className="require-auth-btn-primary" style={{ textDecoration: "none", textAlign: "center" }}>
                  Community Sign In
                </Link>
                <Link to="/communities/signup" className="require-auth-btn-secondary" style={{ textDecoration: "none", textAlign: "center" }}>
                  Join Community (Sign Up)
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="require-auth-btn-primary"
                  onClick={() => {
                    setReturnToPath(location.pathname + location.search);
                    openAuthModal("login");
                  }}
                >
                  Log In
                </button>
                <button
                  type="button"
                  className="require-auth-btn-secondary"
                  onClick={() => {
                    setReturnToPath(location.pathname + location.search);
                    openAuthModal("signup");
                  }}
                >
                  Create Account
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return children || null;
}
