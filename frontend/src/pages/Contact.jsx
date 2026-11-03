
import Footer from "../components/Footer/Footer";
import "./Contact.css";

function Contact() {
  return (
    <>
      <main className="contact-page">

        <div className="contact-container">

          {/* CONTACT HEADING */}
          <div className="contact-heading">

            <span className="contact-label">
              <span className="contact-label-line" />
              CONTACT KAINDRA
            </span>

            <h1>
              Let's start a
              <br />
              <span>conversation.</span>
            </h1>

            <p>
              Every meaningful connection begins with a conversation.
              Whether you are interested in our businesses, exploring
              partnerships, sharing an idea or simply learning more
              about Kaindra, we would love to hear from you.
            </p>

            <div className="contact-bottom-note">
              CONNECT <span>✳</span> COLLABORATE <span>✳</span> GROW
            </div>

          </div>


          {/* CONTACT FORM */}
          <div className="contact-form-wrapper">

            <div className="contact-form-heading">
              <span>GET IN TOUCH</span>
              <h2>Send us a message.</h2>
              <p>
                Share your details and tell us how we can help.
              </p>
            </div>

            <form className="contact-form">

              <div className="contact-field">
                <label htmlFor="contact-name">
                  Your Name
                </label>

                <input
                  id="contact-name"
                  type="text"
                  placeholder="Enter your name"
                />
              </div>

              <div className="contact-field">
                <label htmlFor="contact-email">
                  Email Address
                </label>

                <input
                  id="contact-email"
                  type="email"
                  placeholder="Enter your email address"
                />
              </div>

              <div className="contact-field">
                <label htmlFor="contact-message">
                  Your Message
                </label>

                <textarea
                  id="contact-message"
                  placeholder="How can we help you?"
                  rows="6"
                />
              </div>

              <button
                type="submit"
                className="contact-submit-btn"
              >
                Send Message
                <span>↗</span>
              </button>

            </form>

          </div>

        </div>

      </main>

      <Footer />
    </>
  );
}

export default Contact;
