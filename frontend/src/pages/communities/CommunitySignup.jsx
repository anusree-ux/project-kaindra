import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCommunityAuth } from "../../context/CommunityAuthContext";
import { UserPlus, ArrowLeft, Shield } from "lucide-react";
import "./CommunityAuth.css";

export default function CommunitySignup() {
  const navigate = useNavigate();
  const { signup } = useCommunityAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
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

    if (formData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setSubmitting(true);

    const res = await signup({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
    });

    setSubmitting(false);

    if (res.success) {
      navigate("/communities/profile-setup");
    } else {
      setErrorMsg(res.message || "Failed to create rider account.");
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
            <span>JOIN THE RIDER COMMUNITY</span>
          </div>

          <h1>Create Rider Profile</h1>
          <p>
            Create your dedicated MotoTribe community profile to track ride passports,
            earn badges, and ride with verified convoys.
          </p>
        </div>

        {errorMsg && <div className="community-auth-alert error">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="community-auth-form">
          <div className="community-auth-field">
            <label htmlFor="comm-name">Rider Full Name</label>
            <input
              id="comm-name"
              type="text"
              name="name"
              placeholder="e.g. Shreya S Mahalingshetti"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="community-auth-field">
            <label htmlFor="comm-email">Rider Email Address</label>
            <input
              id="comm-email"
              type="email"
              name="email"
              placeholder="shreya@gmail.com"
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
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="community-auth-field">
            <label htmlFor="comm-phone">Emergency / Phone Contact</label>
            <input
              id="comm-phone"
              type="tel"
              name="phone"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="community-auth-submit-btn"
            disabled={submitting}
          >
            <UserPlus size={16} />
            <span>{submitting ? "Registering..." : "Join the Tribe"}</span>
          </button>
        </form>

        <div className="community-auth-footer">
          Already registered in MotoTribe?
          <Link to="/communities/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}
