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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password.");
      }

      const user = data?.data?.user;
      const accessToken = data?.accessToken;

      if (!accessToken || !user) {
        throw new Error("Invalid login response from server.");
      }

      if (user.role !== "admin") {
        throw new Error(
          "You are not authorized to access the admin panel."
        );
      }

      sessionStorage.setItem(
        "kaindraAdminAccessToken",
        accessToken
      );

      sessionStorage.setItem(
        "kaindraAdminAuthenticated",
        "true"
      );

      sessionStorage.setItem(
        "kaindraAdminUser",
        JSON.stringify(user)
      );

      navigate("/admin");
    } catch (error) {
      console.error("Admin login error:", error);

      setError(
        error.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
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
                disabled={loading}
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
                disabled={loading}
              />

              <button
                type="button"
                className="admin-password-toggle"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                disabled={loading}
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
            disabled={loading}
          >
            <LogIn size={18} />

            {loading ? "Signing in..." : "Sign In"}
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