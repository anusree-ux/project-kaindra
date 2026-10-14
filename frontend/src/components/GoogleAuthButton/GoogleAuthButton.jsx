import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "./GoogleAuthButton.css";

export default function GoogleAuthButton({
  buttonText = "Continue with Google",
  theme = "light",
  onSuccess,
  onError,
}) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const googleBtnContainerRef = useRef(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Initialize official Google Identity Services if a client ID is provided
  useEffect(() => {
    if (!clientId) return;

    let isMounted = true;

    const loadGsiScript = () => {
      if (window.google?.accounts?.id) {
        initGsi();
        return;
      }

      const existingScript = document.getElementById("google-gsi-client");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "google-gsi-client";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (isMounted) initGsi();
        };
        document.body.appendChild(script);
      } else {
        existingScript.addEventListener("load", () => {
          if (isMounted) initGsi();
        });
      }
    };

    const initGsi = () => {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });

        if (googleBtnContainerRef.current) {
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: theme === "dark" ? "filled_black" : "outline",
            size: "large",
            width: "100%",
            text: "continue_with",
            shape: "rectangular",
          });
        }
      } catch (err) {
        console.warn("[GoogleAuthButton] GSI init notice:", err);
      }
    };

    loadGsiScript();

    return () => {
      isMounted = false;
    };
  }, [clientId, theme]);

  // Handle credential response from real Google OAuth popup
  const handleCredentialResponse = async (response) => {
    if (!response?.credential) {
      if (onError) onError("No credential returned from Google.");
      return;
    }

    setLoading(true);
    try {
      const res = await loginWithGoogle({ credential: response.credential });
      if (res.success) {
        if (onSuccess) onSuccess(res.user);
      } else {
        if (onError) onError(res.message);
      }
    } catch (err) {
      console.error("[GoogleAuthButton] OAuth verification error:", err);
      if (onError) onError(err.message || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  // Click handler
  const handleClick = () => {
    if (clientId && window.google?.accounts?.id) {
      // Trigger Google One Tap / account prompt
      window.google.accounts.id.prompt();
    } else {
      // Prompt modal for instant Google OAuth verification in dev environment
      setShowSimulatedModal(true);
    }
  };

  // Direct 1-click Google account simulator
  const authenticateSimulated = async (email, name) => {
    setLoading(true);
    setShowSimulatedModal(false);

    try {
      const res = await loginWithGoogle({
        email: email.trim(),
        name: name.trim(),
        googleId: `google_dev_${Date.now()}`,
        picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      });

      if (res.success) {
        if (onSuccess) onSuccess(res.user);
      } else {
        if (onError) onError(res.message);
      }
    } catch (err) {
      console.error("[GoogleAuthButton] Simulated Google Auth failed:", err);
      if (onError) onError(err.message || "Failed to authenticate with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="google-auth-wrapper">
      {clientId ? (
        <div ref={googleBtnContainerRef} className="google-gsi-render-target" />
      ) : (
        <button
          type="button"
          className={`google-auth-btn ${theme === "dark" ? "theme-dark" : "theme-light"}`}
          onClick={handleClick}
          disabled={loading}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.41 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.59 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span className="google-auth-btn-text">
            {loading ? "Connecting to Google..." : buttonText}
          </span>
        </button>
      )}

      {/* Dev Environment Google Account Simulator Modal */}
      {showSimulatedModal && (
        <div className="google-sim-overlay" onClick={() => setShowSimulatedModal(false)}>
          <div className="google-sim-card" onClick={(e) => e.stopPropagation()}>
            <div className="google-sim-header">
              <svg viewBox="0 0 24 24" width="28" height="28">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.41 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.59 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <h3>Sign in with Google</h3>
              <p>Choose an account to continue to Kaindra (No OTP required)</p>
            </div>

            <div className="google-sim-accounts">
              <button
                type="button"
                className="google-sim-account-item"
                disabled={loading}
                onClick={() => authenticateSimulated("rider.kaindra@gmail.com", "Kaindra Rider")}
              >
                <div className="google-sim-avatar">KR</div>
                <div className="google-sim-acc-info">
                  <strong>Kaindra Rider</strong>
                  <span>rider.kaindra@gmail.com</span>
                </div>
              </button>

              <button
                type="button"
                className="google-sim-account-item"
                disabled={loading}
                onClick={() => authenticateSimulated("shreya120956@gmail.com", "Shreya")}
              >
                <div className="google-sim-avatar" style={{ background: "#8e24aa" }}>S</div>
                <div className="google-sim-acc-info">
                  <strong>Shreya</strong>
                  <span>shreya120956@gmail.com</span>
                </div>
              </button>

              <button
                type="button"
                className="google-sim-account-item"
                disabled={loading}
                onClick={() => authenticateSimulated("user@kaindra.com", "Kaindra User")}
              >
                <div className="google-sim-avatar" style={{ background: "#0284c7" }}>KU</div>
                <div className="google-sim-acc-info">
                  <strong>Kaindra User</strong>
                  <span>user@kaindra.com</span>
                </div>
              </button>
            </div>

            <div className="google-sim-actions" style={{ justifyContent: "center", marginTop: "16px" }}>
              <button
                type="button"
                className="google-sim-btn-cancel"
                onClick={() => setShowSimulatedModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
