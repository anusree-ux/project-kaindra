import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";

function Contact() {
  return (
    <>
      <Navbar />

      <main className="page-section">
        <div className="container">

          <p className="section-label">CONTACT US</p>

          <h1 className="section-title">
            Let&apos;s start a conversation.
          </h1>

          <form
            style={{
              maxWidth: "600px",
              marginTop: "40px",
              display: "grid",
              gap: "16px",
            }}
          >
            <input
              type="text"
              placeholder="Your name"
              style={inputStyle}
            />

            <input
              type="email"
              placeholder="Email address"
              style={inputStyle}
            />

            <textarea
              placeholder="Message"
              rows="6"
              style={inputStyle}
            />

            <button
              type="submit"
              style={{
                padding: "14px",
                background: "#111",
                color: "#fff",
                border: 0,
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Send Message
            </button>
          </form>

        </div>
      </main>

      <Footer />
    </>
  );
}

const inputStyle = {
  width: "100%",
  padding: "14px",
  border: "1px solid #ddd",
  borderRadius: "5px",
  fontSize: "14px",
};

export default Contact;