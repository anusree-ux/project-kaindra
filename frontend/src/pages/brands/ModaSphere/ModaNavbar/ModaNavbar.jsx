import { Link } from "react-router-dom";
import { Menu } from "lucide-react";

import "./ModaNavbar.css";

export default function ModaNavbar() {
  return (
    <nav className="moda-navbar">

      {/* MODASPHERE BRAND */}
      <Link to="/#modasphere" className="moda-brand">
        <div className="moda-brand-mark">
          M
        </div>

        <div>
          <div className="moda-brand-name">
            MODASPHERE
          </div>

          <div className="moda-brand-tagline">
            STYLE. CONNECT. EMPOWER.
          </div>
        </div>
      </Link>


      {/* NAVIGATION */}
      <div className="moda-nav-links">

        {/* KAINDRA HOME */}
        <a
  href="/"
  className="moda-home-link"
>
  Home
</a>

        <Link to="/#vision">
          Vision
        </Link>

        <Link to="/#ecosystem">
          Ecosystem
        </Link>

        <Link to="/#pillars">
          Pillars
        </Link>

        <Link to="/#value">
          Value
        </Link>

        <Link to="/#verticals">
          Verticals
        </Link>

        <Link to="/#stakeholders">
          Stakeholders
        </Link>

        <Link to="/#revenue">
          Revenue
        </Link>

        <Link to="/#technology">
          Technology
        </Link>

        <Link to="/#go-to-market">
          Go-To-Market
        </Link>

        <Link to="/#impact">
          Impact
        </Link>

        <Link to="/#success">
          Success
        </Link>

      </div>


      {/* MOBILE MENU */}
      <button
        type="button"
        className="moda-menu"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

    </nav>
  );
}