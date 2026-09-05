import { Link } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";

const businesses = [
  ["ModaSphere", "/businesses/modasphere"],
  ["MotoTribe", "/businesses/mototribe"],
  
];

function Businesses() {
  return (
    <>
      <Navbar />

      <main className="page-section">
        <div className="container">

          <p className="section-label">BUSINESSES</p>

          <h1 className="section-title">
            Our businesses
          </h1>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "18px",
              marginTop: "45px",
            }}
          >
            {businesses.map(([name, path]) => (
              <Link
                to={path}
                key={name}
                style={{
                  padding: "30px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                }}
              >
                <h2>{name}</h2>
                <p style={{ marginTop: "20px", color: "#666" }}>
                  Explore →
                </p>
              </Link>
            ))}
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}

export default Businesses;