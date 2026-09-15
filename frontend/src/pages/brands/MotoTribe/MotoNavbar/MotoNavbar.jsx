import { useEffect, useState } from "react";
import "./MotoNavbar.css";

function MotoNavbar() {
  const [active, setActive] = useState("CONNECT");
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    {
      label: "CONNECT",
      target: "live-riders",
    },
    {
      label: "PLAN",
      target: "ride-planner",
    },
    {
      label: "RIDE",
      target: "upcoming-rides",
    },
    {
      label: "RECORD",
      target: "digital-ride-record",
    },
    {
      label: "SHARE",
      target: "community-guide",
    },
    {
      label: "GUIDE",
      target: "ride-assistant",
    },
  ];

  const handleNavigation = (item) => {
    setActive(item.label);
    setMenuOpen(false);

    const section = document.getElementById(item.target);

    if (section) {
      const navbarHeight = 76;

      const sectionPosition =
        section.getBoundingClientRect().top +
        window.scrollY -
        navbarHeight;

      window.scrollTo({
        top: sectionPosition,
        behavior: "smooth",
      });
    }
  };

  const handleBrandClick = () => {
    setActive("CONNECT");
    setMenuOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems
        .map((item) => ({
          label: item.label,
          element: document.getElementById(item.target),
        }))
        .filter((item) => item.element);

      if (!sections.length) {
        return;
      }

      const scrollPosition = window.scrollY + 220;

      let currentSection = sections[0];

      sections.forEach((section) => {
        if (section.element.offsetTop <= scrollPosition) {
          currentSection = section;
        }
      });

      setActive(currentSection.label);
    };

    const handleResize = () => {
      if (window.innerWidth > 850) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    window.addEventListener("resize", handleResize);

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add("moto-menu-open");
    } else {
      document.body.classList.remove("moto-menu-open");
    }

    return () => {
      document.body.classList.remove("moto-menu-open");
    };
  }, [menuOpen]);

  return (
    <header className="moto-navbar">
      <div className="moto-navbar-inner">

        {/* BRAND */}

        <button
          type="button"
          className="moto-brand"
          onClick={handleBrandClick}
          aria-label="Go to MotoTribe home"
        >
          <span className="moto-brand-main">
            MOTO
          </span>

          <span className="moto-brand-sub">
            TRIBE
          </span>
        </button>

        {/* DESKTOP / MOBILE NAVIGATION */}

        <nav
  id="mototribe-navigation"
  className={`moto-nav ${
    menuOpen ? "open" : ""
  }`}
          aria-label="MotoTribe navigation"
        >
          <div className="moto-nav-mobile-label">
            <span>MOTOTRIBE</span>
            <small>NAVIGATION</small>
          </div>

          {navItems.map((item, index) => (
            <button
              type="button"
              key={item.label}
              className={`moto-nav-link ${
                active === item.label ? "active" : ""
              }`}
              onClick={() =>
                handleNavigation(item)
              }
            >
              <span className="moto-nav-number">
                {String(index + 1).padStart(2, "0")}
              </span>

              <span className="moto-nav-text">
                {item.label}
              </span>

              <span className="moto-nav-arrow">
                →
              </span>
            </button>
          ))}
        </nav>

        {/* MOBILE MENU BUTTON */}

        <button
          type="button"
          className={`moto-menu ${
            menuOpen ? "open" : ""
          }`}
          onClick={() =>
            setMenuOpen(
              (previous) => !previous
            )
          }
          aria-label={
            menuOpen
              ? "Close navigation"
              : "Open navigation"
          }
          aria-expanded={menuOpen}
          aria-controls="mototribe-navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* STATUS */}

        <div className="moto-navbar-status">
          <span className="moto-status-dot"></span>

          <span>RIDER NETWORK</span>
        </div>
      </div>
    </header>
  );
}

export default MotoNavbar;