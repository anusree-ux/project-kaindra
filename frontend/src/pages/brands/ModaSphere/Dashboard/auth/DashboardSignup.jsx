import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  Factory,
  LockKeyhole,
  Mail,
} from "lucide-react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import "./DashboardSignup.css";

const DashboardSignup = () => {
  const navigate = useNavigate();

  const [accountType, setAccountType] =
    useState("seller");

  const [form, setForm] = useState({
    businessName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] =
    useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.businessName.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("Please complete all fields.");
      return;
    }

    if (form.password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (
      form.password !== form.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      /*
        FRONTEND ONLY.

        Your backend teammate can connect the real
        registration API here later.

        Data ready to send:

        {
          accountType,
          businessName: form.businessName,
          email: form.email,
          password: form.password
        }
      */

      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      );

      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="moda-signup-success-page">
        <div className="moda-signup-success-card">
          <span className="moda-signup-eyebrow">
            MODASPHERE
          </span>

          <h1>Account details ready</h1>

          <p>
            The frontend registration flow is working.
            Backend account creation can be connected
            when the registration API is available.
          </p>

          <button
            type="button"
            className="moda-signup-primary"
            onClick={() =>
              navigate(
                "/businesses/modasphere/dashboard/login"
              )
            }
          >
            Continue to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="moda-signup-page">
      <div className="moda-signup-container">
        <header className="moda-signup-header">
          <Link
            to="/businesses/modasphere/dashboard/login"
            className="moda-signup-back"
          >
            <ArrowLeft size={17} />
            Back to login
          </Link>

          <div className="moda-signup-logo">
            KAINDRA
          </div>
        </header>

        <main className="moda-signup-content">
          <div className="moda-signup-intro">
            <span>MODASPHERE BUSINESS</span>

            <h1>Create your business account</h1>

            <p>
              Choose your business type and complete
              your ModaSphere profile information.
            </p>
          </div>

          <form
            className="moda-signup-card"
            onSubmit={handleSubmit}
          >
            <div className="moda-signup-section">
              <div className="moda-signup-section-title">
                <span>01</span>

                <div>
                  <h2>Business type</h2>
                  <p>
                    Select how you will use the
                    ModaSphere dashboard.
                  </p>
                </div>
              </div>

              <div className="moda-account-types">
                <button
                  type="button"
                  className={`moda-account-type ${
                    accountType === "seller"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setAccountType("seller")
                  }
                >
                  <Building2 size={23} />

                  <div>
                    <strong>Seller</strong>
                    <span>
                      Manage products, orders, drops
                      and customers.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`moda-account-type ${
                    accountType === "manufacturer"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setAccountType(
                      "manufacturer"
                    )
                  }
                >
                  <Factory size={23} />

                  <div>
                    <strong>Manufacturer</strong>
                    <span>
                      Manage production requests and
                      manufacturing work.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <div className="moda-signup-section">
              <div className="moda-signup-section-title">
                <span>02</span>

                <div>
                  <h2>Account information</h2>
                  <p>
                    Enter your basic business
                    information.
                  </p>
                </div>
              </div>

              {error && (
                <div className="moda-signup-error">
                  {error}
                </div>
              )}

              <div className="moda-signup-grid">
                <div className="moda-signup-field full">
                  <label>Business name</label>

                  <div className="moda-signup-input">
                    <Building2 size={17} />

                    <input
                      name="businessName"
                      value={form.businessName}
                      onChange={handleChange}
                      placeholder="Your business name"
                    />
                  </div>
                </div>

                <div className="moda-signup-field full">
                  <label>Email address</label>

                  <div className="moda-signup-input">
                    <Mail size={17} />

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="moda-signup-field">
                  <label>Password</label>

                  <div className="moda-signup-input">
                    <LockKeyhole size={17} />

                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                </div>

                <div className="moda-signup-field">
                  <label>Confirm password</label>

                  <div className="moda-signup-input">
                    <LockKeyhole size={17} />

                    <input
                      type="password"
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat password"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="moda-signup-footer">
              <div>
                <span>Selected account</span>
                <strong>
                  {accountType === "seller"
                    ? "Seller"
                    : "Manufacturer"}
                </strong>
              </div>

              <button
                type="submit"
                className="moda-signup-primary"
                disabled={submitting}
              >
                {submitting
                  ? "Creating..."
                  : "Create account"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default DashboardSignup;