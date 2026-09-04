import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

function ModaSphere() {
  return <BrandPage name="ModaSphere" category="Fashion & Lifestyle" />;
}

function BrandPage({ name, category }) {
  return (
    <>
      <Navbar />

      <main>
        <section className="page-section">
          <div className="container">

            <p className="section-label">{category}</p>

            <h1 className="section-title">
              {name}
            </h1>

            <p
              style={{
                maxWidth: "650px",
                marginTop: "25px",
                color: "#666",
                lineHeight: "1.7",
              }}
            >
              Discover {name}, a KAINDRA business focused on
              creating meaningful products and experiences.
            </p>

          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default ModaSphere;