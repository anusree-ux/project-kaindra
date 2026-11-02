import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCommunityAuth } from "../../context/CommunityAuthContext";
import { getAndClearReturnToPath } from "../../utils/authReturnTo";
import { LogIn, ArrowLeft, Shield } from "lucide-react";
import "./CommunityAuth.css";

export default function CommunityLogin() {
  const navigate = useNavigate();
  const { login } = useCommunityAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    const res = await login({
      email: formData.email,
      password: formData.password,
    });

    setSubmitting(false);

    if (res.success) {
      if (!res.user?.isProfileComplete) {
        navigate("/communities/profile-setup");
      } else {
        const returnPath = getAndClearReturnToPath();
        navigate(returnPath || "/businesses/mototribe");
      }
    } else {
      setErrorMsg(res.message || "Failed to log in.");
    }
  };

  return (
    <div className="community-auth-page">
      {/* Ambient MotoTribe Glow Background */}
      <div className="community-auth-bg">
        <div className="community-auth-glow-1" />
        <div className="community-auth-glow-2" />
        <div className="community-auth-grid" />
      </div>

      <div className="community-auth-card">
        <div style={{ marginBottom: "20px" }}>
          <Link
            to="/businesses/mototribe"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              color: "#9ca3af",
              textDecoration: "none",
              letterSpacing: "0.5px",
            }}
          >
            <ArrowLeft size={14} />
            <span>BACK TO MOTOTRIBE</span>
          </Link>
        </div>

        {/* Brand Header */}
        <div className="community-auth-header">
          <Link to="/businesses/mototribe" className="community-auth-brand-logo">
            <span className="community-auth-logo-badge">MT</span>
            <span className="community-auth-logo-title">
              MOTO<span>TRIBE</span>
            </span>
          </Link>

          <div className="community-auth-eyebrow">
            <Shield size={13} color="#d6a84f" />
            <span>COMMUNITY RIDER CREDENTIAL</span>
          </div>

          <h1>Rider Sign In</h1>
          <p>
            Sign in to access your MotoTribe verified passport, live rider convoys,
            and crowdsourced route intelligence.
          </p>
        </div>

        {errorMsg && <div className="community-auth-alert error">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="community-auth-form">
          <div className="community-auth-field">
            <label htmlFor="comm-email">Rider Email Address</label>
            <input
              id="comm-email"
              type="email"
              name="email"
              placeholder="rider@kaindra.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="community-auth-field">
            <label htmlFor="comm-password">Password</label>
            <input
              id="comm-password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="community-auth-submit-btn"
            disabled={submitting}
          >
            <LogIn size={16} />
            <span>{submitting ? "Signing In..." : "Sign In to MotoTribe"}</span>
          </button>
        </form>

        <div className="community-auth-footer">
          Don&apos;t have a rider credential yet?
          <Link to="/communities/signup">Join the Tribe here</Link>
        </div>
      </div>
    </div>
  );
}
