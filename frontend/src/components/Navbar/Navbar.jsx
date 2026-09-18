import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, openAuthModal, loading } = useAuth();

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">

        <Link
          to="/"
          className="navbar-logo"
          onClick={closeMenu}
        >
          KAINDRA
        </Link>

        <nav className={`navbar-links ${menuOpen ? "active" : ""}`}>
          <Link
  to="/"
  onClick={() => {
    window.history.replaceState(null, "", "/");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }}
>
  Home
</Link>

          <Link to="/businesses" onClick={closeMenu}>
            Businesses
          </Link>

          <Link to="/communities" onClick={closeMenu}>
            Communities
          </Link>

          <Link to="/about" onClick={closeMenu}>
            About
          </Link>

          <Link to="/news" onClick={closeMenu}>
            News
          </Link>

          <Link to="/careers" onClick={closeMenu}>
            Careers
          </Link>

          <Link to="/contact" onClick={closeMenu}>
            Contact
          </Link>

          {/* Mobile auth action */}
          <div className="navbar-mobile-auth">
            {!loading && (
              !isAuthenticated ? (
                <button
                  className="mobile-login"
                  onClick={() => {
                    closeMenu();
                    openAuthModal("login");
                  }}
                >
                  Login
                </button>
              ) : (
                <div className="mobile-user-area">
                  <Link
                    to="/profile"
                    className="mobile-user-name"
                    onClick={closeMenu}
                  >
                    👤 {user?.name || "User"}
                  </Link>
                  <button
                    className="mobile-logout-btn"
                    onClick={() => {
                      closeMenu();
                      logout();
                    }}
                  >
                    Logout
                  </button>
                </div>
              )
            )}
          </div>
        </nav>

        {/* Desktop auth area */}
        {!loading && (
          !isAuthenticated ? (
            <button
              className="navbar-login"
              onClick={() => openAuthModal("login")}
            >
              Login
            </button>
          ) : (
            <div className="navbar-user-area">
              <Link
                to="/profile"
                className="navbar-user-name"
              >
                👤 {user?.name || "User"}
              </Link>
              <button className="navbar-logout-btn" onClick={logout}>
                Logout
              </button>
            </div>
          )
        )}

        <button
          type="button"
          className="navbar-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

      </div>
    </header>
  );
}

export default Navbar;