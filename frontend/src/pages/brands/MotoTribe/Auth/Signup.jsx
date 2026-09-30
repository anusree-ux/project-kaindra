import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Signup.css";

const TEST_OTP = "123456";
const OTP_EXPIRY_MS = 5 * 60 * 1000;

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);

      setFormData((current) => ({
        ...current,
        phone: digitsOnly,
      }));

      return;
    }

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const validateForm = () => {
    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!name) {
      return "Please enter your full name.";
    }

    if (name.length < 2) {
      return "Name must contain at least 2 characters.";
    }

    if (!email) {
      return "Please enter your email address.";
    }

    if (!emailPattern.test(email)) {
      return "Please enter a valid email address.";
    }

    if (!phone) {
      return "Please enter your phone number.";
    }

    if (phone.length !== 10) {
      return "Phone number must contain exactly 10 digits.";
    }

    if (!formData.password) {
      return "Please create a password.";
    }

    if (formData.password.length < 8) {
      return "Password must contain at least 8 characters.";
    }

    if (!formData.confirmPassword) {
      return "Please confirm your password.";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match.";
    }

    if (!agreeTerms) {
      return "Please accept the Terms and Privacy Policy.";
    }

    return "";
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");

    const normalizedData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone,
      otp: TEST_OTP,
      otpExpiresAt: Date.now() + OTP_EXPIRY_MS,
      createdAt: Date.now(),
    };

    /*
     * Do not store the raw password in localStorage.
     * Password handling should be done by the backend once authentication
     * is connected. The current frontend flow only needs the user's
     * basic signup information for OTP verification and profile setup.
     */
    localStorage.setItem(
      "mototribe_pending_signup",
      JSON.stringify(normalizedData)
    );

    navigate("/businesses/mototribe/verify-otp");
  };

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
            <p className="moto-signup-eyebrow">JOIN THE COMMUNITY</p>

            <h1>
              Ride Further.
              <br />
              <span>Ride Together.</span>
            </h1>

            <p className="moto-signup-description">
              Create your MotoTribe account and connect with riders,
              discover new routes, plan group rides, and build your riding
              journey.
            </p>

            <div className="moto-signup-features">
              <div className="moto-signup-feature">
                <div className="moto-signup-feature-icon">01</div>

                <div>
                  <h3>Connect With Riders</h3>
                  <p>
                    Discover riders with similar interests, experience, and
                    riding styles.
                  </p>
                </div>
              </div>

              <div className="moto-signup-feature">
                <div className="moto-signup-feature-icon">02</div>

                <div>
                  <h3>Plan Better Rides</h3>
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
              Join MotoTribe and become part of the rider community.
            </p>
          </div>

          <form
            className="moto-signup-form"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* NAME */}
            <div className="moto-form-group">
              <label htmlFor="signup-name">
                Full Name
                <span>*</span>
              </label>

              <input
                id="signup-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
                required
                aria-invalid={Boolean(error && !formData.name.trim())}
              />
            </div>

            {/* EMAIL */}
            <div className="moto-form-group">
              <label htmlFor="signup-email">
                Email Address
                <span>*</span>
              </label>

              <input
                id="signup-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            {/* PHONE */}
            <div className="moto-form-group">
              <label htmlFor="signup-phone">
                Phone Number
                <span>*</span>
              </label>

              <div className="moto-phone-input">
                <span className="moto-phone-prefix">+91</span>

                <input
                  id="signup-phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  autoComplete="tel"
                  inputMode="numeric"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="moto-form-group">
              <label htmlFor="signup-password">
                Password
                <span>*</span>
              </label>

              <div className="moto-password-input">
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="moto-password-toggle"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>

              <small className="moto-field-hint">
                Use at least 8 characters.
              </small>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="moto-form-group">
              <label htmlFor="signup-confirm-password">
                Confirm Password
                <span>*</span>
              </label>

              <div className="moto-password-input">
                <input
                  id="signup-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="moto-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirmed password"
                      : "Show confirmed password"
                  }
                >
                  {showConfirmPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {/* TERMS */}
            <label className="moto-terms">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(event) =>
                  setAgreeTerms(event.target.checked)
                }
              />

              <span className="moto-custom-checkbox"></span>

              <span className="moto-terms-text">
                I agree to the MotoTribe Terms and Privacy Policy.
              </span>
            </label>

            {/* ERROR */}
            {error && (
              <div
                className="moto-signup-error"
                role="alert"
                aria-live="assertive"
              >
                <span className="moto-error-icon">!</span>
                <span>{error}</span>
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              className="moto-signup-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="moto-submit-spinner"></span>
                  Creating Account...
                </>
              ) : (
                <>
                  Create MotoTribe Account
                  <span className="moto-submit-arrow">→</span>
                </>
              )}
            </button>
          </form>

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