import { Link } from "react-router-dom";
import "./Brands.css";

const brands = [
  {
    name: "ModaSphere",
    category: "Fashion & Lifestyle",
    path: "/businesses/modasphere",
  },
  {
    name: "MotoTribe",
    category: "Automotive Community",
    path: "/businesses/mototribe",
  },
];

function Brands() {
  return (
    <section className="brands" id="businesses">
      <div className="container">

        <div className="brands-header">
          <div>
            <p className="section-label">OUR BRANDS</p>
            <h2 className="section-title">
              Businesses with different
              <br />
              ideas and one vision.
            </h2>
          </div>

          <Link to="/businesses" className="view-link">
            View all →
          </Link>
        </div>

        <div className="brands-grid">
          {brands.map((brand) => (
            <Link
              to={brand.path}
              className="brand-card"
              key={brand.name}
            >
              <div>
                <span>{brand.category}</span>
                <h3>{brand.name}</h3>
              </div>

              <strong>Explore →</strong>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}

export default Brands;