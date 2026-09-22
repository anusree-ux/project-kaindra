import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import "./Navbar.css";

function Navbar() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const navbarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        navbarRef.current &&
        !navbarRef.current.contains(event.target)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const toggleDropdown = (dropdown) => {
    setOpenDropdown((current) =>
      current === dropdown ? null : dropdown
    );
  };

  const closeDropdown = () => {
    setOpenDropdown(null);
  };

  return (
    <nav className="navbar" ref={navbarRef}>
      <div className="navbar-container">

        {/* LOGO */}
        <Link
          to="/"
          className="navbar-logo"
          onClick={closeDropdown}
        >
          KAINDRA
        </Link>

        <div className="navbar-links">

          {/* HOME */}
          <Link
            to="/"
            className="navbar-link"
            onClick={closeDropdown}
          >
            Home
          </Link>

          {/* ABOUT */}
          <div className="navbar-dropdown">
            <button
              type="button"
              className="navbar-dropdown-button"
              onClick={() => toggleDropdown("about")}
            >
              About
              <ChevronDown
                size={16}
                className={
                  openDropdown === "about"
                    ? "dropdown-arrow open"
                    : "dropdown-arrow"
                }
              />
            </button>

            {openDropdown === "about" && (
              <div className="navbar-dropdown-menu">
                <Link to="/about" onClick={closeDropdown}>
                  About Kaindra
                </Link>

                <Link
                  to="/businesses"
                  onClick={closeDropdown}
                >
                  Businesses
                </Link>

                <Link
                  to="/careers"
                  onClick={closeDropdown}
                >
                  Careers
                </Link>

                <Link to="/news" onClick={closeDropdown}>
                  News / Blogs
                </Link>

                <Link
                  to="/communities"
                  onClick={closeDropdown}
                >
                  Communities
                </Link>
              </div>
            )}
          </div>

          {/* MODAMART */}
          <Link
            to="/businesses/modamart"
            className="navbar-link"
            onClick={closeDropdown}
          >
            ModaMart
          </Link>

          {/* MODADROP */}
          <Link
            to="/businesses/modadrop"
            className="navbar-link"
            onClick={closeDropdown}
          >
            ModaDrop
          </Link>

          {/* MODASPHERE */}
          <div className="navbar-dropdown modasphere-dropdown">

            <button
              type="button"
              className="navbar-dropdown-button"
              onClick={() => toggleDropdown("modasphere")}
            >
              ModaSphere

              <ChevronDown
                size={16}
                className={
                  openDropdown === "modasphere"
                    ? "dropdown-arrow open"
                    : "dropdown-arrow"
                }
              />
            </button>

            {openDropdown === "modasphere" && (
              <div className="navbar-dropdown-menu modasphere-menu">

                <Link
                  to="/businesses/modastudio"
                  onClick={closeDropdown}
                >
                  ModaStudio
                </Link>

                <Link
                  to="/businesses/modamanufacture"
                  onClick={closeDropdown}
                >
                  ModaManufacture
                </Link>

                <Link
                  to="/businesses/modalogix"
                  onClick={closeDropdown}
                >
                  ModaLogix
                </Link>

                <Link
                  to="/businesses/modapay"
                  onClick={closeDropdown}
                >
                  ModaPay
                </Link>

                <Link
                  to="/businesses/modainfluence"
                  onClick={closeDropdown}
                >
                  ModaInfluence
                </Link>

                <Link
                  to="/businesses/modatales"
                  onClick={closeDropdown}
                >
                  ModaTales
                </Link>

                <Link
                  to="/businesses/modaacademy"
                  onClick={closeDropdown}
                >
                  ModaAcademy
                </Link>

                <Link
                  to="/businesses/modainsights"
                  onClick={closeDropdown}
                >
                  ModaInsights
                </Link>

              </div>
            )}
          </div>

          {/* CONTACT */}
          <Link
            to="/contact"
            className="navbar-link"
            onClick={closeDropdown}
          >
            Contact
          </Link>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;