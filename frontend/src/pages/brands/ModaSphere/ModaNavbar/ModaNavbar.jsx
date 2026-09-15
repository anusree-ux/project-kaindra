import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import "./ModaNavbar.css";

export default function ModaNavbar() {
  const handleHome = () => {
    window.location.assign("/");
  };

  return (
    <nav className="moda-navbar">

      {/* MODASPHERE BRAND */}
      <Link
        to="/businesses/modasphere"
        className="moda-brand"
      >
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

        <button
          type="button"
          onClick={handleHome}
          className="moda-home-button"
        >
          Home
        </button>

        <Link to="/businesses/modasphere/vision">
          Vision
        </Link>

        <Link to="/businesses/modasphere/ecosystem">
          Ecosystem
        </Link>

        <Link to="/businesses/modasphere/pillars">
          Pillars
        </Link>

        <Link to="/businesses/modasphere/value">
          Value
        </Link>

        <Link to="/businesses/modasphere/verticals">
          Verticals
        </Link>

        <Link to="/businesses/modasphere/stakeholders">
          Stakeholders
        </Link>

        <Link to="/businesses/modasphere/revenue">
          Revenue
        </Link>

        <Link to="/businesses/modasphere/technology">
          Technology
        </Link>

        <Link to="/businesses/modasphere/go-to-market">
          Go-To-Market
        </Link>

        <Link to="/businesses/modasphere/impact">
          Impact
        </Link>

        <Link to="/businesses/modasphere/success">
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