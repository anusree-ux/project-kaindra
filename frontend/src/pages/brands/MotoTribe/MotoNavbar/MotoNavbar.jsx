import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import "./MotoNavbar.css";

function MotoNavbar() {
  const [active, setActive] = useState("CONNECT");
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, openAuthModal, loading } = useAuth();

  const navItems = [
    { label: "CONNECT", target: "live-riders" },
    { label: "PLAN", target: "ride-planner" },
    { label: "RIDE", target: "upcoming-rides" },
    { label: "RECORD", target: "ride-record" },
    { label: "SHARE", target: "trusted-tribe" },
    { label: "GUIDE", target: "ride-assistant" },
  ];

  const handleNavigation = (item) => {
    setActive(item.label);
    setMenuOpen(false);

    const section = document.getElementById(item.target);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const renderAuthContent = (isMobile = false) => {
    if (loading) {
      return (
        <div className="moto-auth-loading">
          <span className="moto-loading-dot"></span>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="moto-auth-nav-actions">
          <button
            className="moto-auth-nav-btn login"
            onClick={() => {
              if (isMobile) setMenuOpen(false);
              openAuthModal("login");
            }}
          >
            LOGIN
          </button>
          <button
            className="moto-auth-nav-btn signup"
            onClick={() => {
              if (isMobile) setMenuOpen(false);
              openAuthModal("signup");
            }}
          >
            SIGN UP
          </button>
        </div>
      );
    }

    return (
      <div className="moto-user-pill">
        <Link
          to="/businesses/mototribe/profile-setup"
          className="moto-user-name"
        >
          👤 {user?.name || "Rider"}
        </Link>
        <button className="moto-logout-btn" onClick={logout}>
          LOGOUT
        </button>
      </div>
    );
  };

  return (
    <header className="moto-navbar">
      <div className="moto-navbar-inner">

        <button
          className="moto-brand"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
        >
          <span className="moto-brand-main">MOTO</span>
          <span className="moto-brand-sub">TRIBE</span>
        </button>

        <nav className={`moto-nav ${menuOpen ? "open" : ""}`}>
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`moto-nav-link ${
                active === item.label ? "active" : ""
              }`}
              onClick={() => handleNavigation(item)}
            >
              {item.label}
            </button>
          ))}

          {/* Auth Controls inside nav for mobile view */}
          <div className="moto-mobile-auth">
            {renderAuthContent(true)}
          </div>
        </nav>

        {/* Desktop Auth Controls */}
        <div className="moto-desktop-auth">
          {renderAuthContent(false)}
        </div>

        <button
          className="moto-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

      </div>
    </header>
  );
}

export default MotoNavbar;