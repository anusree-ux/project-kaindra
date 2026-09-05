import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";

function News() {
  return (
    <>
      <Navbar />

      <main className="page-section">
        <div className="container">

          <p className="section-label">NEWS / BLOG</p>

          <h1 className="section-title">
            Stories from KAINDRA.
          </h1>

          <div
            style={{
              marginTop: "50px",
              display: "grid",
              gap: "20px",
            }}
          >
            {[
              "KAINDRA expands its business ecosystem",
              "Building new experiences for communities",
              "New ideas and partnerships take shape",
            ].map((title) => (
              <article
                key={title}
                style={{
                  padding: "28px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                }}
              >
                <p style={{ color: "#777", fontSize: "12px" }}>
                  SEPTEMBER 2026
                </p>

                <h2 style={{ marginTop: "12px" }}>
                  {title}
                </h2>

                <p style={{ marginTop: "15px", color: "#666" }}>
                  Read the latest updates from KAINDRA.
                </p>
              </article>
            ))}
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}

export default News;