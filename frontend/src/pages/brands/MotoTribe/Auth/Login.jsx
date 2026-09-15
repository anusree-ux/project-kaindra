import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    setError("");

    if (!form.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!form.password) {
      setError("Please enter your password.");
      return;
    }

    const savedAccount = localStorage.getItem(
      "mototribeSignupAccount"
    );

    if (!savedAccount) {
      setError(
        "No MotoTribe rider account found. Please create an account first."
      );
      return;
    }

    const account = JSON.parse(savedAccount);

    if (
      form.email.trim().toLowerCase() !==
      account.email.trim().toLowerCase()
    ) {
      setError("Email or password is incorrect.");
      return;
    }

    if (form.password !== account.password) {
      setError("Email or password is incorrect.");
      return;
    }

    if (!account.verified) {
      setError(
        "Your rider account is not verified. Please complete OTP verification."
      );
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const session = {
        loggedIn: true,
        riderName: account.name,
        email: account.email,
        loginTime: new Date().toISOString(),
        rememberMe,
      };

      localStorage.setItem(
        "mototribeSession",
        JSON.stringify(session)
      );

      setLoading(false);

      navigate("/businesses/mototribe");
    }, 700);
  };

  return (
    <div className="moto-login-page">

      <div className="moto-login-background">
        <div className="login-glow login-glow-one"></div>
        <div className="login-glow login-glow-two"></div>
      </div>

      <div className="moto-login-card">

        <div className="moto-login-brand">
          <span>MOTO</span>
          <strong>TRIBE</strong>
        </div>

        <div className="moto-login-badge">
          RIDER ACCESS
        </div>

        <h1>Welcome back</h1>

        <p className="moto-login-description">
          Sign in to continue your journeys, connect
          with riders and access your MotoTribe.
        </p>

        <form
          className="moto-login-form"
          onSubmit={handleSubmit}
        >

          <div className="moto-login-field">
            <label>EMAIL ADDRESS *</label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="rider@example.com"
              autoComplete="email"
            />
          </div>

          <div className="moto-login-field">
            <label>PASSWORD *</label>

            <div className="login-password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>

          <div className="moto-login-options">

            <label className="remember-option">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) =>
                  setRememberMe(event.target.checked)
                }
              />

              <span>REMEMBER ME</span>
            </label>

            <button
              type="button"
              className="forgot-password"
              onClick={() =>
                setError(
                  "Password recovery will be connected to the backend."
                )
              }
            >
              FORGOT PASSWORD?
            </button>

          </div>

          {error && (
            <div className="moto-login-error">
              {error}
            </div>
          )}

          <button
            className="moto-login-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "SIGNING IN..." : "ENTER MOTOTRIBE →"}
          </button>

        </form>

        <div className="moto-create-account">
          <span>NEW TO MOTOTRIBE?</span>

          <Link to="/businesses/mototribe/signup">
            CREATE RIDER ACCOUNT
          </Link>
        </div>

        <button
          className="moto-login-home"
          onClick={() =>
            navigate("/businesses/mototribe")
          }
        >
          ← BACK TO MOTOTRIBE
        </button>

        <div className="moto-login-footer">
          FRONTEND PROTOTYPE • SESSION STORED LOCALLY
        </div>

      </div>

    </div>
  );
}

export default Login;