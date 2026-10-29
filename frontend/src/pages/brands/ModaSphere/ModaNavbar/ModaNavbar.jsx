import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";
import "./ModaNavbar.css";

const modaLinks = [
  {
    name: "ModaMart",
    path: "/businesses/modamart",
  },
  {
    name: "ModaDrop",
    path: "/businesses/modadrop",
  },
  {
    name: "ModaStudio",
    path: "/businesses/modastudio",
  },
  {
    name: "ModaManufacture",
    path: "/businesses/modamanufacture",
  },
  {
    name: "ModaLogix",
    path: "/businesses/modalogix",
  },
  {
    name: "ModaPay",
    path: "/businesses/modapay",
  },
  {
    name: "ModaInfluence",
    path: "/businesses/modainfluence",
  },
  {
    name: "ModaTales",
    path: "/businesses/modatales",
  },
  {
    name: "ModaAcademy",
    path: "/businesses/modaacademy",
  },
  {
    name: "ModaInsights",
    path: "/businesses/modainsights",
  },
  {
    name: "About ModaSphere",
    path: "/businesses/modasphere",
  },
];

export default function ModaNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const openMenu = () => {
    setMenuOpen(true);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  /* ========================================
     STOP PAGE SCROLL WHEN MENU IS OPEN
  ======================================== */

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  /* ========================================
     CLOSE MENU WITH ESC KEY
  ======================================== */

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  return (
    <>
      {/* =====================================
          MODASPHERE SECOND NAVBAR
      ===================================== */}

      <nav className="moda-secondary-navbar">
        <div className="moda-secondary-container">

          {/* HAMBURGER */}

          <button
            type="button"
            className="moda-hamburger"
            onClick={openMenu}
            aria-label="Open ModaSphere menu"
            aria-expanded={menuOpen}
          >
            <Menu size={21} />
          </button>

          {/* MODASPHERE TITLE */}

          <NavLink
            to="/businesses/modasphere"
            className="moda-secondary-brand"
            onClick={closeMenu}
          >
            MODASPHERE
          </NavLink>

          {/* SMALL DESCRIPTION */}

          <span className="moda-secondary-description">
            Fashion Ecosystem
          </span>

        </div>
      </nav>

      {/* =====================================
          DARK BACKGROUND OVERLAY
      ===================================== */}

      <div
        className={`moda-menu-overlay ${
          menuOpen ? "open" : ""
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* =====================================
          LEFT SIDE DRAWER
      ===================================== */}

      <aside
        className={`moda-menu-drawer ${
          menuOpen ? "open" : ""
        }`}
        aria-hidden={!menuOpen}
      >

        {/* DRAWER HEADER */}

        <div className="moda-drawer-header">

          <NavLink
            to="/businesses/modasphere"
            className="moda-drawer-logo"
            onClick={closeMenu}
          >
            MODASPHERE
          </NavLink>

          <button
            type="button"
            className="moda-drawer-close"
            onClick={closeMenu}
            aria-label="Close ModaSphere menu"
          >
            <X size={22} />
          </button>

        </div>

        {/* DRAWER CONTENT */}

        <div className="moda-drawer-content">

          <div className="moda-drawer-heading">
            <span>EXPLORE</span>

            <p>
              Discover the ModaSphere ecosystem
            </p>
          </div>

          {/* LINKS */}

          <div className="moda-drawer-links">

            {modaLinks.map((item, index) => (

              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === "/businesses/modasphere"}
                onClick={closeMenu}
                className={({ isActive }) =>
                  isActive
                    ? "moda-drawer-link active"
                    : "moda-drawer-link"
                }
              >

                <span className="moda-drawer-number">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="moda-drawer-link-name">
                  {item.name}
                </span>

                <ArrowRight
                  size={16}
                  className="moda-drawer-arrow"
                />

              </NavLink>

            ))}

          </div>

          {/* BOTTOM */}

          <div className="moda-drawer-footer">
            <span>KAINDRA</span>

            <p>
              Fashion • Commerce • Technology
            </p>
          </div>

        </div>

      </aside>
    </>
  );
}