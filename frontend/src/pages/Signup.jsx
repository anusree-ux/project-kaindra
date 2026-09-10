import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";
      // Ensure url endpoint works with both /api/v1/auth/signup and /api/auth/signup
      const endpoint = apiBase.endsWith("/")
        ? `${apiBase}v1/auth/signup`
        : `${apiBase}/v1/auth/signup`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed. Please try again.");
      }

      // Store tokens
      if (data.accessToken) {
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("user", JSON.stringify(data.data.user));
      }

      setSuccess("Account created successfully! Redirecting...");
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "30px",
        background: "#f7f7f7",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "35px",
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <h1>Create Account</h1>

        {error && (
          <div
            style={{
              padding: "10px",
              marginTop: "15px",
              background: "#fee2e2",
              color: "#991b1b",
              borderRadius: "5px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: "10px",
              marginTop: "15px",
              background: "#dcfce7",
              color: "#166534",
              borderRadius: "5px",
              fontSize: "14px",
            }}
          >
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gap: "15px",
            marginTop: "25px",
          }}
        >
          <input
            type="text"
            name="name"
            placeholder="Full name"
            value={formData.name}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            style={inputStyle}
          />

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p style={{ marginTop: "20px", fontSize: "14px" }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </main>
  );
}

const inputStyle = {
  padding: "14px",
  border: "1px solid #ddd",
  borderRadius: "5px",
};

const buttonStyle = {
  padding: "14px",
  background: "#111",
  color: "#fff",
  border: 0,
  borderRadius: "5px",
  cursor: "pointer",
};

export default Signup;