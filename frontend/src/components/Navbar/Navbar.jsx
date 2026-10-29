import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

import NotificationDropdown from "../NotificationDropdown/NotificationDropdown";

import "./Navbar.css";

function Navbar() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const navbarRef = useRef(null);
  const { user, isAuthenticated, logout, openAuthModal, loading } = useAuth();
  const { cartCount } = useCart();

  /* ========================================
     CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  ======================================== */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        navbarRef.current &&
        !navbarRef.current.contains(event.target)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /* ========================================
     DROPDOWN
  ======================================== */

  const toggleDropdown = (dropdown) => {
    setOpenDropdown((current) =>
      current === dropdown ? null : dropdown
    );
  };

  /* ========================================
     CLOSE MENU
  ======================================== */

  const closeDropdown = () => {
    setOpenDropdown(null);
    setMenuOpen(false);
  };

  /* ========================================
     ADMIN CHECK
  ======================================== */

  const isAdmin =
    isAuthenticated && user?.role === "admin";

  return (
    <nav
      className="navbar"
      ref={navbarRef}
    >
      <div className="navbar-container">

        {/* =================================
            KAINDRA LOGO
        ================================= */}

        <Link
          to="/"
          className="navbar-logo"
          onClick={closeDropdown}
        >
          KAINDRA
        </Link>

        {/* =================================
            MAIN NAVIGATION
        ================================= */}

        <div
          className={`navbar-links ${
            menuOpen
              ? "navbar-links-mobile-open"
              : ""
          }`}
        >

          {/* HOME */}

          <Link
            to="/"
            className="navbar-link"
            onClick={closeDropdown}
          >
            Home
          </Link>

          {/* ABOUT */}

          <Link
            to="/about"
            className="navbar-link"
            onClick={closeDropdown}
          >
            About
          </Link>

          {/* BUSINESSES */}

          <Link
            to="/businesses"
            className="navbar-link"
            onClick={closeDropdown}
          >
            Businesses
          </Link>

          {/* CAREERS */}

          <Link
            to="/careers"
            className="navbar-link"
            onClick={closeDropdown}
          >
            Careers
          </Link>

          {/* NEWS / BLOGS */}

          <Link
            to="/news"
            className="navbar-link"
            onClick={closeDropdown}
          >
            News / Blogs
          </Link>

          {/* COMMUNITIES */}

          <Link
            to="/communities"
            className="navbar-link"
            onClick={closeDropdown}
          >
            Communities
          </Link>

          {/* CONTACT */}

          <Link
            to="/contact"
            className="navbar-link"
            onClick={closeDropdown}
          >
            Contact
          </Link>

          {/* SELLER DASHBOARD */}

          <Link
            to="/businesses/modasphere/dashboard"
            className="seller-dashboard-nav-btn"
            onClick={closeDropdown}
          >
            Seller Dashboard
          </Link>

          {/* =================================
              MOBILE AUTH AREA
          ================================= */}

          <div className="navbar-mobile-auth">

            {!loading && (
              !isAuthenticated ? (

                /* MOBILE LOGIN */

                <button
                  className="mobile-login"
                  onClick={() => {
                    closeDropdown();
                    openAuthModal("login");
                  }}
                >
                  Login
                </button>

              ) : isAdmin ? (

                /* MOBILE ADMIN */

                <div className="mobile-user-area">
                  <Link
                    to="/admin"
                    className="mobile-user-name"
                    onClick={closeDropdown}
                  >
                    🛡️ Admin Panel
                  </Link>

                  <button
                    className="mobile-logout-btn"
                    onClick={() => {
                      closeDropdown();
                      logout();
                    }}
                  >
                    Logout
                  </button>

                </div>

              ) : (

                /* MOBILE NORMAL USER */

                <div className="mobile-user-area">

                  <NotificationDropdown brand="modasphere" />

                  <Link
                    to="/profile"
                    className="mobile-user-name"
                    onClick={closeDropdown}
                  >
                    👤 {user?.name || "User"}
                  </Link>
                  <button
                    className="mobile-logout-btn"
                    onClick={() => {
                      closeDropdown();
                      logout();
                    }}
                  >
                    Logout
                  </button>

                </div>
              )
            )}

          </div>

        </div>

        {/* =================================
            DESKTOP AUTH AREA
        ================================= */}

        {!loading && (
          !isAuthenticated ? (

            /* LOGIN */

            <button
              className="navbar-login"
              onClick={() =>
                openAuthModal("login")
              }
            >
              Login
            </button>

          ) : isAdmin ? (

            /* =================================
               ADMIN AREA
            ================================= */

            <div className="navbar-user-area">

              <NotificationDropdown brand="modasphere" />
              <Link
                to="/admin"
                className="navbar-user-name"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <ShieldCheck size={16} />
                Admin Panel
              </Link>

              <button
                className="navbar-logout-btn"
                onClick={logout}
              >
                Logout
              </button>

            </div>

          ) : (

            /* =================================
               NORMAL USER AREA
            ================================= */

            <div className="navbar-user-area">

              {/* NOTIFICATIONS */}

              <NotificationDropdown brand="modasphere" />
              <Link
                to="/businesses/modamart/cart"
                className="navbar-cart-icon"
                title="View Cart"
              >
                <ShoppingBag size={18} />

                {cartCount > 0 && (
                  <span className="navbar-cart-badge">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* PROFILE */}

              <Link
                to="/profile"
                className="navbar-user-name"
              >
                👤 {user?.name || "User"}
              </Link>

              {/* LOGOUT */}

              <button
                className="navbar-logout-btn"
                onClick={logout}
              >
                Logout
              </button>

            </div>
          )
        )}

        {/* =================================
            MOBILE HAMBURGER
        ================================= */}

        <button
          type="button"
          className="navbar-menu"
          onClick={() =>
            setMenuOpen(!menuOpen)
          }
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

      </div>
    </nav>
  );
}

export default Navbar;