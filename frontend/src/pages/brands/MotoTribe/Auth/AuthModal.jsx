import { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import GoogleAuthButton from "../../../../components/GoogleAuthButton/GoogleAuthButton";
import "./AuthModal.css";

export default function AuthModal() {
  const {
    authModalOpen,
    authModalTab,
    openAuthModal,
    closeAuthModal,
  } = useAuth();

  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // Reset messages when modal or tab changes
  useEffect(() => {
    setErrorMsg("");
    setInfoMsg("");
  }, [authModalOpen, authModalTab]);

  if (!authModalOpen) return null;

  return (
    <div className="auth-overlay" onClick={closeAuthModal}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="auth-close-btn" onClick={closeAuthModal} aria-label="Close modal">
          &times;
        </button>

        {/* Modal Branding Header */}
        <div className="auth-brand-header">
          <span className="auth-brand-main">KAINDRA</span>
          <span className="auth-brand-sub">IDENTITY</span>
        </div>

        {/* Tab Navigation */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${authModalTab === "login" ? "active" : ""}`}
            onClick={() => openAuthModal("login")}
          >
            LOG IN
          </button>
          <button
            className={`auth-tab ${authModalTab === "signup" ? "active" : ""}`}
            onClick={() => openAuthModal("signup")}
          >
            SIGN UP
          </button>
        </div>

        {/* Error / Info Banners */}
        {errorMsg && <div className="auth-alert error">{errorMsg}</div>}
        {infoMsg && <div className="auth-alert info">{infoMsg}</div>}

        <div className="auth-form-container" style={{ textAlign: "center", padding: "10px 0" }}>
          <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "22px" }}>
            {authModalTab === "login"
              ? "Sign in to your Kaindra account to continue."
              : "Create your Kaindra account to get started."}
          </p>

          <GoogleAuthButton
            theme="dark"
            buttonText={authModalTab === "login" ? "Continue with Google" : "Continue with Google"}
            onSuccess={() => closeAuthModal()}
            onError={(err) => setErrorMsg(err)}
          />

          <div style={{ marginTop: "24px", color: "#6b7280", fontSize: "12px" }}>
            Fast, secure access to your account
          </div>
        </div>
      </div>
    </div>
  );
}
