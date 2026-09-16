import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Signup.css";

function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const getPasswordStrength = () => {
    const password = form.password;

    if (!password) return "";

    if (password.length < 6) return "weak";

    if (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    ) {
      return "strong";
    }

    return "medium";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !form.name ||
      !form.email ||
      !form.phone ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!/^[0-9]{10}$/.test(form.phone)) {
      setError("Phone number must contain exactly 10 digits.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agree) {
      setError("Please accept the terms and conditions.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const account = {
        id: `MT-${Date.now()}`,
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        createdAt: new Date().toISOString(),
        verified: false,
      };

      localStorage.setItem(
        "mototribeSignupAccount",
        JSON.stringify(account)
      );

      setLoading(false);
      setSuccess("Account created successfully. Continue to OTP verification.");

      setTimeout(() => {
        navigate("/businesses/mototribe/verify-otp");
      }, 1200);
    }, 1000);
  };

  const passwordStrength = getPasswordStrength();

  return (
    <section className="moto-signup">
      <div className="moto-signup-background">
        <div className="moto-glow moto-glow-one"></div>
        <div className="moto-glow moto-glow-two"></div>
      </div>

      <div className="moto-signup-wrapper">
        <div className="moto-signup-brand">
          <span>MOTO</span>
          <strong>TRIBE</strong>
        </div>

        <div className="moto-signup-card">
          <div className="signup-heading">
            <span>JOIN THE TRIBE</span>

            <h1>Create your rider account</h1>

            <p>
              Start your journey with MotoTribe. Connect, plan, ride,
              record and share.
            </p>
          </div>

          {error && <div className="signup-message error">{error}</div>}

          {success && (
            <div className="signup-message success">{success}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="signup-field">
              <label>RIDER NAME *</label>

              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="signup-row">
              <div className="signup-field">
                <label>EMAIL *</label>

                <input
                  type="email"
                  name="email"
                  placeholder="rider@example.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div className="signup-field">
                <label>PHONE NUMBER *</label>

                <input
                  type="tel"
                  name="phone"
                  maxLength="10"
                  placeholder="10 digit mobile number"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="signup-row">
              <div className="signup-field">
                <label>PASSWORD *</label>

                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create password"
                    value={form.password}
                    onChange={handleChange}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>

                {passwordStrength && (
                  <div className={`password-strength ${passwordStrength}`}>
                    <span></span>
                    <span></span>
                    <span></span>

                    <small>
                      {passwordStrength === "weak" && "Weak password"}
                      {passwordStrength === "medium" && "Medium password"}
                      {passwordStrength === "strong" && "Strong password"}
                    </small>
                  </div>
                )}
              </div>

              <div className="signup-field">
                <label>CONFIRM PASSWORD *</label>

                <div className="password-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                  >
                    {showConfirmPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>
            </div>

            <label className="signup-terms">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />

              <span>
                I agree to the MotoTribe terms and privacy guidelines.
              </span>
            </label>

            <button
              type="submit"
              className="signup-submit"
              disabled={loading}
            >
              {loading ? "CREATING ACCOUNT..." : "CREATE RIDER ACCOUNT"}
            </button>
          </form>

          <div className="signup-login">
            <span>Already have an account?</span>

            <Link to="/businesses/mototribe/login">
              LOGIN
            </Link>
          </div>

          <div className="signup-note">
            FRONTEND PROTOTYPE • ACCOUNT DATA STORED LOCALLY
          </div>
        </div>
      </div>
    </section>
  );
}

export default Signup;