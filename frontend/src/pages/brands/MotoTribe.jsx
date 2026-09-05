import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

function MotoTribe() {
  return (
    <>
      <Navbar />
      <main className="page-section">
        <div className="container">
          <p className="section-label">AUTOMOTIVE COMMUNITY</p>
          <h1 className="section-title">MotoTribe</h1>
          <p style={{ marginTop: "25px", color: "#666" }}>
            A community and experience built around motorcycles.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default MotoTribe;