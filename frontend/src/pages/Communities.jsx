import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCommunityAuth } from "../context/CommunityAuthContext";
import { setReturnToPath, setPendingAction, getAndClearPendingAction } from "../utils/authReturnTo";
import { ShieldCheck, Sparkles, MessageSquare, ArrowRight, CheckCircle2, UserCheck, LogOut, Settings } from "lucide-react";
import "./Communities.css";

const API_BASE = "";

export default function Communities() {
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal, loading: authLoading } = useAuth();
  const { communityUser, isCommunityAuth, logout: communityLogout } = useCommunityAuth();

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Check if current user is already recorded as a community member locally
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      const storedMember = localStorage.getItem(`kaindra_member_${user.email.toLowerCase()}`);
      if (storedMember) {
        setAlreadyMember(true);
      }
    } else {
      setAlreadyMember(false);
    }
  }, [isAuthenticated, user?.email]);

  // Keep form data synchronized with logged-in user profile
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [isAuthenticated, user]);

  // Handle post-login resumption if user initiated an action while logged out
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const pending = getAndClearPendingAction();
      if (pending?.type === "join_community") {
        document.getElementById("community-form")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else if (pending?.type === "open_member_hub") {
        navigate("/communities/member-hub");
      }
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  /**
   * Action: Join Community from hero or section
   * If logged out: stores return-to and pending action, then opens auth modal.
   * If logged in: scrolls directly to the registration form.
   */
  const handleJoinClick = () => {
    if (!isAuthenticated) {
      setReturnToPath("/communities#community-form");
      setPendingAction({ type: "join_community" });
      openAuthModal("login");
      return;
    }

    document.getElementById("community-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  /**
   * Action: Open Member Hub or Create Post
   * If logged out: stores return-to path and opens auth modal.
   * If logged in: navigates to member hub.
   */
  const handleMemberHubClick = () => {
    if (!isAuthenticated) {
      setReturnToPath("/communities/member-hub");
      setPendingAction({ type: "open_member_hub" });
      openAuthModal("login");
      return;
    }

    navigate("/communities/member-hub");
  };

  /**
   * Form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setReturnToPath("/communities#community-form");
      setPendingAction({ type: "join_community" });
      openAuthModal("login");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/community`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (res.ok && result.status === "success") {
        if (user?.email) {
          localStorage.setItem(`kaindra_member_${user.email.toLowerCase()}`, "true");
        }
        setAlreadyMember(true);
        setSubmitted(true);
      } else {
        alert(result.message || "Failed to join community.");
      }
    } catch (err) {
      console.error("Error joining community:", err);
      // Fallback optimistic completion
      if (user?.email) {
        localStorage.setItem(`kaindra_member_${user.email.toLowerCase()}`, "true");
      }
      setAlreadyMember(true);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="communities-page">
      {/* HERO SECTION */}
      <section className="community-hero">
        <div className="community-container">
          <div className="community-hero-badge-row">
            <span className="community-label">KAINDRA COMMUNITY</span>
            {isCommunityAuth && communityUser ? (
              <span className="community-auth-pill" style={{ background: "#ecfdf5", color: "#065f46", borderColor: "#a7f3d0" }}>
                <UserCheck size={14} />
                <span>
                  Community Member: <strong>{communityUser.handle || communityUser.name}</strong> ({communityUser.role})
                </span>
              </span>
            ) : isAuthenticated && (
              <span className="community-auth-pill">
                <ShieldCheck size={14} />
                <span>Logged in as {user?.name || user?.email}</span>
              </span>
            )}
          </div>

          <h1>
            Be Part of the
            <br />
            <span>Fashion Future</span>
          </h1>

          <p>
            Kaindra is building a connected fashion ecosystem that brings
            together designers, brands, creators, communities, and fashion
            enthusiasts from around the world.
          </p>

          <p>
            Our community is a space to discover new ideas, connect with
            creative minds, explore fashion innovation, and participate in
            the evolving ModaSphere.
          </p>

          {/* HERO CTAS */}
          <div className="community-hero-ctas">
            {isCommunityAuth ? (
              <>
                <Link to="/communities/member-hub" className="join-community-btn" style={{ textDecoration: "none" }}>
                  Enter Member Hub &amp; Feed
                </Link>
                <Link to="/communities/profile-setup" className="member-portal-btn" style={{ textDecoration: "none" }}>
                  <Settings size={15} />
                  <span>Edit Profile Setup</span>
                </Link>
                <button
                  type="button"
                  className="member-portal-btn"
                  onClick={communityLogout}
                  style={{ color: "#ef4444", borderColor: "#fca5a5" }}
                >
                  <LogOut size={15} />
                  <span>Log Out of Community</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/communities/signup" className="join-community-btn" style={{ textDecoration: "none" }}>
                  Join Community (Sign Up)
                </Link>
                <Link to="/communities/login" className="member-portal-btn" style={{ textDecoration: "none" }}>
                  <span>Community Sign In</span>
                  <ArrowRight size={14} />
                </Link>
                <Link to="/communities/member-hub" className="member-portal-btn" style={{ textDecoration: "none" }}>
                  <MessageSquare size={15} />
                  <span>Preview Member Hub</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* COMMUNITY PILLARS PREVIEW */}
      <section className="community-pillars-section">
        <div className="community-container">
          <div className="community-section-header">
            <span>DISCOVER THE ECOSYSTEM</span>
            <h2>Why Join the Kaindra Community?</h2>
            <p>A global network of creators, designers, and enthusiasts shaping conscious fashion.</p>
          </div>

          <div className="community-pillars-grid">
            <div className="community-pillar-card">
              <div className="pillar-icon">✨</div>
              <h3>Collaborative Design</h3>
              <p>Work directly with emerging labels and independent creators to co-develop limited release capsules.</p>
            </div>
            <div className="community-pillar-card">
              <div className="pillar-icon">🚀</div>
              <h3>Priority Drop Access</h3>
              <p>Verified members receive 24-hour advance access to curated ModaDrop garment releases and tech runs.</p>
            </div>
            <div className="community-pillar-card">
              <div className="pillar-icon">💬</div>
              <h3>Member-Only Discussions</h3>
              <p>Exchange blueprints, manufacturing insights, and sustainable material findings in our private hub.</p>
            </div>
          </div>
        </div>
      </section>

      {/* COMMUNITY FORM & MEMBERSHIP STATUS */}
      <section id="community-form" className="community-form-section">
        <div className="community-form-card">
          {alreadyMember ? (
            /* ACTIVE MEMBER CARD */
            <div className="community-member-status-card">
              <div className="member-status-icon-badge">
                <CheckCircle2 size={36} color="#10b981" />
              </div>
              <span className="member-status-tag">ACTIVE COMMUNITY MEMBER</span>
              <h2>You are part of Kaindra</h2>
              <p>
                Welcome back, <strong>{user?.name || "Creator"}</strong>. Your membership gives you
                unrestricted access to exclusive drops, private community discussions, and creative showcases.
              </p>
              <div className="member-action-row">
                <Link to="/communities/member-hub" className="community-submit-btn">
                  Open Member Hub & Discussions
                </Link>
              </div>
            </div>
          ) : !submitted ? (
            /* REGISTRATION FORM */
            <>
              <div className="community-form-header">
                <span>JOIN KAINDRA</span>
                <h2>Become a Community Member</h2>
                <p>
                  Enter your details below to join the Kaindra community.
                </p>
              </div>

              {!isAuthenticated && (
                <div className="community-login-hint-banner">
                  <Sparkles size={16} />
                  <span>
                    Already have a Kaindra account?{" "}
                    <button
                      type="button"
                      className="community-login-link-btn"
                      onClick={() => {
                        setReturnToPath("/communities#community-form");
                        openAuthModal("login");
                      }}
                    >
                      Log in to auto-fill
                    </button>
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* NAME */}
                <div className="community-form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* EMAIL */}
                <div className="community-form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* PHONE */}
                <div className="community-form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  className="community-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Joining..."
                    : !isAuthenticated
                    ? "Log in & Join Community"
                    : "Confirm & Join Community"}
                </button>
              </form>
            </>
          ) : (
            /* SUCCESS CARD */
            <div className="community-success">
              <div className="success-icon">✓</div>
              <h2>Welcome to Kaindra!</h2>
              <p>
                You have successfully joined the Kaindra community.
              </p>
              <button
                type="button"
                className="community-submit-btn"
                onClick={() => navigate("/communities/member-hub")}
              >
                Go to Member Hub
              </button>
              <button
                type="button"
                className="community-close-btn"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    name: "",
                    email: "",
                    phone: "",
                  });
                }}
              >
                Register Another Member
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}