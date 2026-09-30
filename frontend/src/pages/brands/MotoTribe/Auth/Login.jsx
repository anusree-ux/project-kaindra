import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

const ACCESS_TOKEN_DURATION = 15 * 60 * 1000;
const REFRESH_TOKEN_DURATION = 30 * 24 * 60 * 60 * 1000;

const getStoredVerifiedUser = () => {
  try {
    const storedUser = localStorage.getItem(
      "mototribe_verified_signup"
    );

    if (!storedUser) {
      return null;
    }

    const parsedUser = JSON.parse(storedUser);

    if (!parsedUser || typeof parsedUser !== "object") {
      return null;
    }

    return parsedUser;
  } catch {
    return null;
  }
};

const isValidEmail = (value) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
};

const isValidPhone = (value) => {
  return /^\d{10}$/.test(value);
};

const createToken = (prefix) => {
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 12)}`;
};

function Login() {
  const navigate = useNavigate();
  const loginTimerRef = useRef(null);

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (loginTimerRef.current) {
        window.clearTimeout(loginTimerRef.current);
      }
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "identifier") {
      setFormData((current) => ({
        ...current,
        identifier: value,
      }));
    } else {
      setFormData((current) => ({
        ...current,
        [name]: value,
      }));
    }

    if (error) {
      setError("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const clearExistingSessions = () => {
    localStorage.removeItem("mototribe_auth_session");
    sessionStorage.removeItem("mototribe_auth_session");

    localStorage.removeItem("mototribe_user");
    sessionStorage.removeItem("mototribe_user");

    sessionStorage.removeItem("mototribe_session_mode");
  };

  const createDemoSession = (user) => {
    const now = Date.now();

    const session = {
      accessToken: createToken("access"),
      refreshToken: createToken("refresh"),
      accessTokenExpiresAt: now + ACCESS_TOKEN_DURATION,
      refreshTokenExpiresAt:
        now + REFRESH_TOKEN_DURATION,
      user,
      loggedInAt: now,
    };

    clearExistingSessions();

    if (rememberMe) {
      localStorage.setItem(
        "mototribe_auth_session",
        JSON.stringify(session)
      );

      localStorage.setItem(
        "mototribe_user",
        JSON.stringify(user)
      );

      sessionStorage.setItem(
        "mototribe_session_mode",
        "persistent"
      );
    } else {
      sessionStorage.setItem(
        "mototribe_auth_session",
        JSON.stringify(session)
      );

      sessionStorage.setItem(
        "mototribe_user",
        JSON.stringify(user)
      );

      sessionStorage.setItem(
        "mototribe_session_mode",
        "temporary"
      );
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const identifier = formData.identifier.trim();
    const password = formData.password;

    if (!identifier) {
      setError("Please enter your email or phone number.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    const normalizedIdentifier = identifier.toLowerCase();

    const isEmail = identifier.includes("@");
    const isPhone = /^\d+$/.test(identifier);

    if (isEmail && !isValidEmail(normalizedIdentifier)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (isPhone && !isValidPhone(identifier)) {
      setError("Phone number must contain exactly 10 digits.");
      return;
    }

    if (!isEmail && !isPhone) {
      setError(
        "Enter a valid email address or 10-digit phone number."
      );
      return;
    }

    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    loginTimerRef.current = window.setTimeout(() => {
      const verifiedUser = getStoredVerifiedUser();

      let user;

      if (verifiedUser) {
        const matchesEmail =
          isEmail &&
          verifiedUser.email?.toLowerCase() ===
            normalizedIdentifier;

        const matchesPhone =
          isPhone &&
          verifiedUser.phone === identifier;

        if (matchesEmail || matchesPhone) {
          user = {
            id:
              verifiedUser.id ||
              `rider-${Date.now()}`,
            name: verifiedUser.name || "MotoTribe Rider",
            email: verifiedUser.email || "",
            phone: verifiedUser.phone || "",
            phoneVerified:
              verifiedUser.phoneVerified || false,
            role: "RIDER",
          };
        }
      }

      /*
       * Frontend demo mode:
       * If no previously verified signup matches,
       * a demo rider account is created.
       *
       * Passwords are deliberately not stored in browser
       * storage. Backend authentication will handle that
       * when the API is connected.
       */
      if (!user) {
        user = {
          id: `demo-rider-${Date.now()}`,
          name: "MotoTribe Rider",
          email: isEmail ? normalizedIdentifier : "",
          phone: isPhone ? identifier : "",
          phoneVerified: false,
          role: "RIDER",
          demoAccount: true,
        };
      }

      createDemoSession(user);

      setIsLoading(false);
      setSuccessMessage("Login successful.");

      loginTimerRef.current = window.setTimeout(() => {
        navigate("/businesses/mototribe");
      }, 400);
    }, 700);
  };

  const handleForgotPassword = () => {
    setError("");
    setSuccessMessage(
      "Password reset will be available when backend authentication is connected."
    );
  };

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

          <form
            className="moto-login-form"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* IDENTIFIER */}
            <div className="moto-login-form-group">
              <label htmlFor="login-identifier">
                Email or Phone
                <span>*</span>
              </label>

              <input
                id="login-identifier"
                name="identifier"
                type="text"
                value={formData.identifier}
                onChange={handleChange}
                placeholder="you@example.com or 9876543210"
                autoComplete="username"
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="moto-login-form-group">
              <div className="moto-login-label-row">
                <label htmlFor="login-password">
                  Password
                  <span>*</span>
                </label>

                <button
                  type="button"
                  className="moto-forgot-password"
                  onClick={handleForgotPassword}
                >
                  Forgot Password?
                </button>
              </div>

              <div className="moto-login-password">
                <input
                  id="login-password"
                  name="password"
                  type={
                    showPassword ? "text" : "password"
                  }
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="moto-login-password-toggle"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {/* REMEMBER ME */}
            <label className="moto-remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) =>
                  setRememberMe(event.target.checked)
                }
              />

              <span className="moto-login-checkbox"></span>

              <span>Remember me on this device</span>
            </label>

            {/* ERROR */}
            {error && (
              <div
                className="moto-login-message moto-login-error"
                role="alert"
                aria-live="assertive"
              >
                <span>!</span>
                {error}
              </div>
            )}

            {/* SUCCESS */}
            {successMessage && (
              <div
                className="moto-login-message moto-login-success"
                role="status"
                aria-live="polite"
              >
                <span>✓</span>
                {successMessage}
              </div>
            )}

            {/* LOGIN */}
            <button
              type="submit"
              className="moto-login-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="moto-login-spinner"></span>
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* DIVIDER */}
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

        {/* COMMUNITY STATS */}
        <div className="moto-login-stats">
          <div className="moto-login-stat">
            <strong>RIDER</strong>
            <span>COMMUNITY</span>
          </div>

          <div className="moto-login-stat-divider"></div>

          <div className="moto-login-stat">
            <strong>GROUP</strong>
            <span>JOURNEYS</span>
          </div>

          <div className="moto-login-stat-divider"></div>

          <div className="moto-login-stat">
            <strong>ROUTES</strong>
            <span>&amp; RIDES</span>
          </div>
        </div>

        <p className="moto-login-footer">
          Secure rider authentication powered by MotoTribe
        </p>
      </div>
    </main>
  );
}

export default Login;