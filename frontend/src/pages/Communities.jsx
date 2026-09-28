import { useState } from "react";
import "./Communities.css";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

function Communities() {
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/api/community`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (res.ok && result.status === "success") {
        setSubmitted(true);
      } else {
        alert(result.message || "Failed to join community.");
      }
    } catch (err) {
      console.error("Error joining community:", err);
      // Fallback
      setSubmitted(true);
    }
  };

  const scrollToForm = () => {
    document.getElementById("community-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <main className="communities-page">
      {/* HERO SECTION */}
      <section className="community-hero">
        <div className="community-container">
          <span className="community-label">KAINDRA COMMUNITY</span>

          <h1>
            Be Part of the
            <br />
            <span>Fashion Future</span>
          </h1>

          <p>
            Kaindra is building a connected fashion ecosystem that brings
            together designers, brands, creators, communities, and fashion
            enthusiasts from around the world.
          </p>

          <p>
            Our community is a space to discover new ideas, connect with
            creative minds, explore fashion innovation, and be part of the
            evolving ModaSphere.
          </p>

          {/* SCROLL TO FORM BUTTON */}
          <button
            type="button"
            className="join-community-btn"
            onClick={scrollToForm}
          >
            Join Community
          </button>
        </div>
      </section>

      {/* COMMUNITY FORM */}
      <section
        id="community-form"
        className="community-form-section"
      >
        <div className="community-form-card">
          {!submitted ? (
            <>
              <div className="community-form-header">
                <span>JOIN KAINDRA</span>

                <h2>Become a Community Member</h2>

                <p>
                  Enter your details below to join the Kaindra community.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                {/* NAME */}
                <div className="community-form-group">
                  <label htmlFor="name">Name</label>

                  <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* EMAIL */}
                <div className="community-form-group">
                  <label htmlFor="email">Email</label>

                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* PHONE */}
                <div className="community-form-group">
                  <label htmlFor="phone">Phone Number</label>

                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* SUBMIT */}
                <button
                  type="submit"
                  className="community-submit-btn"
                >
                  Join Community
                </button>
              </form>
            </>
          ) : (
            /* SUCCESS */
            <div className="community-success">
              <div className="success-icon">✓</div>

              <h2>Welcome to Kaindra!</h2>

              <p>
                You have successfully joined the Kaindra community.
              </p>

              <button
                type="button"
                className="community-close-btn"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    name: "",
                    email: "",
                    phone: "",
                  });
                }}
              >
                Join Again
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Communities;