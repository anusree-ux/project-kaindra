import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";

function Communities() {
  return (
    <>
      <Navbar />

      <main className="page-section">
        <div className="container">

          <p className="section-label">COMMUNITIES</p>

          <h1 className="section-title">
            Communities that connect people.
          </h1>

          <p
            style={{
              maxWidth: "650px",
              marginTop: "25px",
              color: "#666",
              lineHeight: "1.7",
            }}
          >
            Discover communities built around shared interests,
            experiences and opportunities.
          </p>

        </div>
      </main>

      <Footer />
    </>
  );
}

export default Communities;