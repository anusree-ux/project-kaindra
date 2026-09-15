import { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

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
          <Link to="/" onClick={closeMenu}>
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

          <Link to="/contact" onClick={closeMenu}>
            Contact
          </Link>

          <Link
            to="/login"
            className="mobile-login"
            onClick={closeMenu}
          >
            Login
          </Link>
        </nav>

        <Link to="/login" className="navbar-login">
          Login
        </Link>

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