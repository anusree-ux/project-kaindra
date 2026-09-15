import { useState } from "react";
import "./MotoNavbar.css";

function MotoNavbar() {
  const [active, setActive] = useState("CONNECT");
  const [menuOpen, setMenuOpen] = useState(false);

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
        </nav>

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