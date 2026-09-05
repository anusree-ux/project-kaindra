import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";

const jobs = [
  {
    title: "Frontend Developer",
    location: "India",
    type: "Full Time",
  },
  {
    title: "Product Designer",
    location: "India",
    type: "Full Time",
  },
  {
    title: "Marketing Associate",
    location: "India",
    type: "Full Time",
  },
];

function Careers() {
  return (
    <>
      <Navbar />

      <main className="page-section">
        <div className="container">

          <p className="section-label">CAREERS</p>

          <h1 className="section-title">
            Find your next opportunity.
          </h1>

          <div style={{ marginTop: "50px" }}>
            {jobs.map((job) => (
              <div
                key={job.title}
                style={{
                  padding: "25px 0",
                  borderTop: "1px solid #ddd",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "20px",
                }}
              >
                <div>
                  <h2 style={{ fontSize: "20px" }}>
                    {job.title}
                  </h2>

                  <p style={{ color: "#777", marginTop: "8px" }}>
                    {job.location} · {job.type}
                  </p>
                </div>

                <button
                  style={{
                    border: "1px solid #111",
                    background: "#fff",
                    padding: "10px 16px",
                    borderRadius: "5px",
                  }}
                >
                  Apply →
                </button>
              </div>
            ))}
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}

export default Careers;