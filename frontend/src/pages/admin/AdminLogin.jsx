import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff, LogIn } from "lucide-react";
import "./AdminLogin.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const inputEmail = email.trim().toLowerCase();
    const inputPassword = password;

    const validEmails = ["admin@kaindra.com"];
    const validPasswords = ["admin123", "Admin@123"];

    if (
      validEmails.includes(inputEmail) &&
      validPasswords.includes(inputPassword)
    ) {
      // Isolate admin authentication strictly to sessionStorage
      sessionStorage.setItem("kaindraAdminAuthenticated", "true");
      sessionStorage.setItem(
        "kaindraAdminUser",
        JSON.stringify({
          email: inputEmail,
          role: "admin",
          name: "Kaindra Administrator",
        })
      );

      navigate("/admin");
      return;
    }

    setError("Invalid admin email or password.");
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          KAINDRA
        </div>

        <div className="admin-login-icon">
          <Lock size={24} />
        </div>

        <div className="admin-login-header">
          <span>ADMIN PORTAL</span>
          <h1>Welcome back</h1>
          <p>
            Sign in to access the Kaindra administration panel.
          </p>
        </div>

        <form
          className="admin-login-form"
          onSubmit={handleSubmit}
        >
          <div className="admin-login-field">
            <label htmlFor="admin-email">
              Email
            </label>

            <div className="admin-login-input-wrapper">
              <Mail size={18} />
              <input
                id="admin-email"
                type="email"
                placeholder="Enter admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="admin-login-field">
            <label htmlFor="admin-password">
              Password
            </label>

            <div className="admin-login-input-wrapper">
              <Lock size={18} />
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="admin-login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="admin-login-button"
          >
            <LogIn size={18} />
            Sign In
          </button>
        </form>

        <p className="admin-login-footer">
          Kaindra Administration
        </p>
      </div>
    </div>
  );
}

export default AdminLogin;