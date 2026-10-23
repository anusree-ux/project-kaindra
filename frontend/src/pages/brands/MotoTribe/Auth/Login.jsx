import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleAuthButton from "../../../../components/GoogleAuthButton/GoogleAuthButton";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  return (
    <main className="moto-login-page">
      <div className="moto-login-background">
        <div className="moto-login-glow moto-login-glow-one"></div>
        <div className="moto-login-glow moto-login-glow-two"></div>
        <div className="moto-login-grid"></div>
      </div>

      <div className="moto-login-wrapper">
        {/* LOGO */}
        <Link
          to="/businesses/mototribe"
          className="moto-login-logo"
          aria-label="MotoTribe home"
        >
          <span className="moto-login-logo-mark">MT</span>

          <span className="moto-login-logo-text">
            MOTO<span>TRIBE</span>
          </span>
        </Link>

        <section className="moto-login-card">
          <div className="moto-login-header">
            <p className="moto-login-eyebrow">
              WELCOME BACK
            </p>

            <h1>Return to the Ride</h1>

            <p>
              Sign in to continue your MotoTribe journey.
            </p>
          </div>

          {error && (
            <div
              className="moto-login-message moto-login-error"
              role="alert"
              aria-live="assertive"
              style={{ marginBottom: "20px" }}
            >
              <span>!</span>
              {error}
            </div>
          )}

          <div style={{ marginTop: "12px", marginBottom: "26px" }}>
            <GoogleAuthButton
              theme="dark"
              buttonText="Continue with Google"
              onSuccess={(user, meta) => {
                if (meta?.isNewUser || !user?.brands?.includes("mototribe")) {
                  navigate("/businesses/mototribe/profile-setup");
                } else {
                  navigate("/businesses/mototribe");
                }
              }}
              onError={(err) => setError(err)}
            />
          </div>

          <div className="moto-login-divider">
            <span>NEW TO MOTOTRIBE?</span>
          </div>

          <Link
            to="/businesses/mototribe/signup"
            className="moto-create-account"
          >
            Create Your Account
            <span>→</span>
          </Link>

          <Link
            to="/businesses/mototribe"
            className="moto-login-back"
          >
            ← Back to MotoTribe
          </Link>
        </section>
      </div>
    </main>
  );
}

export default Login;