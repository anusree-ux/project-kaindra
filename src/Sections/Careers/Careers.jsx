import { Link } from "react-router-dom";
import "./Careers.css";

function CareersSection() {
  return (
    <section className="careers-section">
      <div className="container careers-inner">

        <div>
          <p className="section-label">CAREERS</p>

          <h2>
            Build something
            <br />
            meaningful with us.
          </h2>

          <p>
            Join people who want to create useful businesses,
            products and experiences.
          </p>
        </div>

        <Link to="/careers">
          Explore Careers →
        </Link>

      </div>
    </section>
  );
}

export default CareersSection;