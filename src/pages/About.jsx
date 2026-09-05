import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";

function About() {
  return (
    <>
      <Navbar />

      <main className="page-section">
        <div className="container">

          <p className="section-label">ABOUT US</p>

          <h1 className="section-title">
            We build businesses
            <br />
            with purpose.
          </h1>

          <p style={{ maxWidth: "650px", marginTop: "25px", lineHeight: "1.7", color: "#666" }}>
            KAINDRA is an ecosystem bringing together businesses,
            technology, communities and experiences.
          </p>

        </div>
      </main>

      <Footer />
    </>
  );
}

export default About;