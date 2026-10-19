import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleAuthButton from "../../../../components/GoogleAuthButton/GoogleAuthButton";
import "./Signup.css";

function Signup() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  return (
    <main className="moto-signup-page">
      <div className="moto-signup-background">
        <div className="moto-signup-glow moto-signup-glow-one"></div>
        <div className="moto-signup-glow moto-signup-glow-two"></div>
        <div className="moto-signup-grid"></div>
      </div>

      <div className="moto-signup-wrapper">
        {/* LEFT SIDE */}
        <section className="moto-signup-intro">
          <Link
            to="/businesses/mototribe"
            className="moto-signup-logo"
            aria-label="MotoTribe home"
          >
            <span className="moto-signup-logo-mark">MT</span>

            <span className="moto-signup-logo-text">
              MOTO<span>TRIBE</span>
            </span>
          </Link>

          <div className="moto-signup-intro-content">
            <span className="moto-signup-badge">JOIN THE TRIBE</span>

            <h1>Ride Together. Explore Further.</h1>

            <p>
              Connect with verified riders, plan routes, track community
              journeys, and build your digital ride record.
            </p>

            <div className="moto-signup-features">
              <div className="moto-signup-feature">
                <div className="moto-signup-feature-icon">01</div>

                <div>
                  <h3>Discover Rider Communities</h3>
                  <p>
                    Find nearby motorcyclists, join group rides, and share
                    real-time locations with trusted riders.
                  </p>
                </div>
              </div>

              <div className="moto-signup-feature">
                <div className="moto-signup-feature-icon">02</div>

                <div>
                  <h3>Smart Route Planning</h3>
                  <p>
                    Create rides, explore routes, estimate fuel costs, and
                    organize your journey.
                  </p>
                </div>
              </div>

              <div className="moto-signup-feature">
                <div className="moto-signup-feature-icon">03</div>

                <div>
                  <h3>Build Your Ride Passport</h3>
                  <p>
                    Track your journeys, vehicles, achievements, and riding
                    history.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SIGNUP CARD */}
        <section className="moto-signup-card">
          <div className="moto-signup-card-header">
            <p className="moto-signup-card-eyebrow">CREATE ACCOUNT</p>

            <h2>Start Your Journey</h2>

            <p>
              Join the MotoTribe community and start your journey.
            </p>
          </div>

          {error && (
            <div
              className="moto-signup-error"
              role="alert"
              aria-live="assertive"
              style={{ marginBottom: "20px" }}
            >
              <span className="moto-error-icon">!</span>
              <span>{error}</span>
            </div>
          )}

          <div style={{ marginTop: "14px", marginBottom: "26px" }}>
            <GoogleAuthButton
              theme="dark"
              buttonText="Sign up with Google"
              onSuccess={() => navigate("/businesses/mototribe")}
              onError={(err) => setError(err)}
            />
          </div>

          <div className="moto-signup-divider">
            <span>ALREADY A RIDER?</span>
          </div>

          <Link
            to="/businesses/mototribe/login"
            className="moto-login-link"
          >
            Sign in to MotoTribe
            <span>→</span>
          </Link>

          <Link
            to="/businesses/mototribe"
            className="moto-signup-back"
          >
            ← Back to MotoTribe
          </Link>
        </section>
      </div>
    </main>
  );
}

export default Signup;