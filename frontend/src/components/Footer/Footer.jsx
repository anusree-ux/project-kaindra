import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">

      <div className="container footer-grid">

        <div className="footer-brand">
          <h2>KAINDRA</h2>
          <p>
            Building businesses, communities and experiences
            for a better future.
          </p>
        </div>

        <div className="footer-column">
          <h4>Businesses</h4>
          <Link to="/businesses">All Businesses</Link>
          <Link to="/businesses/modasphere">ModaSphere</Link>
          <Link to="/businesses/mototribe">MotoTribe</Link>
        </div>

        <div className="footer-column">
          <h4>Company</h4>
          <Link to="/about">About</Link>
          <Link to="/careers">Careers</Link>
          <Link to="/news">News</Link>
          <Link to="/contact">Contact</Link>
        </div>

        <div className="footer-column">
          <h4>Community</h4>
          <Link to="/communities">Communities</Link>
          <Link to="/contact">Partner with us</Link>
          <Link to="/signup">Join us</Link>
        </div>

      </div>

      <div className="container footer-bottom">
        <span>© 2026 KAINDRA</span>
        <span>All rights reserved.</span>
      </div>

    </footer>
  );
}

export default Footer;