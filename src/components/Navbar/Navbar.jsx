import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-inner">

        <Link to="/" className="navbar-logo">
          KAINDRA
        </Link>

        <nav className="navbar-links">
          <Link to="/">Home</Link>
          <Link to="/businesses">Businesses</Link>
          <Link to="/communities">Communities</Link>
          <Link to="/about">About</Link>
          <Link to="/news">News</Link>
          <Link to="/contact">Contact</Link>
        </nav>

        <Link to="/login" className="navbar-login">
          Login
        </Link>

        <button className="navbar-menu">
          ☰
        </button>

      </div>
    </header>
  );
}

export default Navbar;