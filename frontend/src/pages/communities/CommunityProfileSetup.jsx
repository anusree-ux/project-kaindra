import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCommunityAuth } from "../../context/CommunityAuthContext";
import { Sparkles, ArrowRight, Shield, Award } from "lucide-react";
import "./CommunityAuth.css";

const RIDER_FOCUS_AREAS = [
  "High Altitude Passes",
  "Coastal Cruising",
  "Night Convoys",
  "Moto-Camping & Trails",
  "Cross-Country Endurance",
  "Technical Hill Climbs",
  "Safety & Formation Riding",
  "Route Scouting & Mapping",
];

export default function CommunityProfileSetup() {
  const navigate = useNavigate();
  const { communityUser, isCommunityAuth, profileSetup, loading } = useCommunityAuth();

  const [handle, setHandle] = useState("");
  const [role, setRole] = useState("creator");
  const [bio, setBio] = useState("");
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [city, setCity] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (communityUser) {
      if (communityUser.handle) setHandle(communityUser.handle);
      if (communityUser.role) setRole(communityUser.role);
      if (communityUser.bio) setBio(communityUser.bio);
      if (Array.isArray(communityUser.interests) && communityUser.interests.length > 0) {
        setSelectedInterests(communityUser.interests);
      }
      if (communityUser.city) setCity(communityUser.city);
      if (communityUser.portfolioLink) setPortfolioLink(communityUser.portfolioLink);
    }
  }, [communityUser]);

  useEffect(() => {
    if (!loading && !isCommunityAuth) {
      navigate("/communities/login");
    }
  }, [loading, isCommunityAuth, navigate]);

  const toggleInterest = (tag) => {
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    const res = await profileSetup({
      handle: handle.trim(),
      role,
      bio: bio.trim(),
      interests: selectedInterests,
      city: city.trim(),
      portfolioLink: portfolioLink.trim(),
    });

    setSubmitting(false);

    if (res.success) {
      // Return straight to MotoTribe with active verified credential!
      navigate("/businesses/mototribe");
    } else {
      setErrorMsg(res.message || "Failed to save rider profile setup.");
    }
  };

  if (loading) {
    return (
      <div className="community-auth-page">
        <p style={{ color: "#d6a84f" }}>Loading rider setup...</p>
      </div>
    );
  }

  return (
    <div className="community-auth-page">
      {/* Ambient MotoTribe Glow Background */}
      <div className="community-auth-bg">
        <div className="community-auth-glow-1" />
        <div className="community-auth-glow-2" />
        <div className="community-auth-grid" />
      </div>

      <div className="community-auth-card community-setup-card">
        {/* Brand Header */}
        <div className="community-auth-header">
          <Link to="/businesses/mototribe" className="community-auth-brand-logo">
            <span className="community-auth-logo-badge">MT</span>
            <span className="community-auth-logo-title">
              MOTO<span>TRIBE</span>
            </span>
          </Link>

          <div className="community-auth-eyebrow">
            <Award size={13} color="#d6a84f" />
            <span>RIDER CREDENTIAL ONBOARDING</span>
          </div>

          <h1>Complete Your Rider Setup</h1>
          <p>
            Welcome, <strong>{communityUser?.name || "Rider"}</strong>! Customize your official
            community road identity, riding discipline, and milestone preferences.
          </p>
        </div>

        {errorMsg && <div className="community-auth-alert error">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="community-auth-form">
          {/* RIDER HANDLE */}
          <div className="community-auth-field">
            <label htmlFor="handle">Rider Road Handle</label>
            <input
              id="handle"
              type="text"
              placeholder="@shreya_moto"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              required
            />
            <span className="community-field-helper">
              Your official callsign across MotoTribe convoys, ride passports, and route reports.
            </span>
          </div>

          {/* RIDING DISCIPLINE */}
          <div className="community-auth-field">
            <label htmlFor="role">Rider Discipline / Category</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="creator">Adventure &amp; Dual-Sport Explorer</option>
              <option value="designer">Long-Distance Highway Touring</option>
              <option value="brand">Urban Daily Commuter &amp; Scrambler</option>
              <option value="artisan">Track &amp; Performance Rider</option>
              <option value="enthusiast">Vintage &amp; Custom Cruiser</option>
            </select>
          </div>

          {/* BIO / ROAD MOTTO */}
          <div className="community-auth-field">
            <label htmlFor="bio">Road Motto / Rider Bio</label>
            <textarea
              id="bio"
              rows={3}
              placeholder="e.g. Chasing mountain passes and remote coastal routes. Safety first, throttle second."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          {/* RIDER FOCUS AREAS */}
          <div className="community-auth-field">
            <label>Riding Interests &amp; Milestone Goals</label>
            <div className="community-interest-grid">
              {RIDER_FOCUS_AREAS.map((tag) => {
                const selected = selectedInterests.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    className={`community-interest-pill ${selected ? "selected" : ""}`}
                    onClick={() => toggleInterest(tag)}
                  >
                    {selected ? "✓ " : "+ "}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CITY & MOTORCYCLE */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="community-auth-field">
              <label htmlFor="city">Base Riding City / Region</label>
              <input
                id="city"
                type="text"
                placeholder="e.g. Bengaluru, Karnataka"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="community-auth-field">
              <label htmlFor="portfolio">Primary Motorcycle Make / Model</label>
              <input
                id="portfolio"
                type="text"
                placeholder="e.g. Royal Enfield Himalayan 450"
                value={portfolioLink}
                onChange={(e) => setPortfolioLink(e.target.value)}
              />
            </div>
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            className="community-auth-submit-btn"
            disabled={submitting}
          >
            <Sparkles size={16} />
            <span>{submitting ? "Saving Credential..." : "Complete Setup & Launch MotoTribe"}</span>
            <ArrowRight size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
