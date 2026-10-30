import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleAuthButton from "../components/GoogleAuthButton/GoogleAuthButton";

function Signup() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

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
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          textAlign: "center",
        }}
      >
        <h1 style={{ marginBottom: "8px", fontSize: "26px", fontWeight: "700" }}>Create Account</h1>
        <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "28px" }}>
          Create your Kaindra account to get started.
        </p>

        {error && (
          <div
            style={{
              padding: "10px",
              marginBottom: "20px",
              background: "#fee2e2",
              color: "#991b1b",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        <GoogleAuthButton
          theme="light"
          buttonText="Sign up with Google"
          onSuccess={() => navigate("/")}
          onError={(err) => setError(err)}
        />

        <p
          style={{
            marginTop: "28px",
            fontSize: "13px",
            color: "#6b7280",
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "#111827",
              fontWeight: "600",
              textDecoration: "underline",
            }}
          >
            Sign in with Google
          </Link>
        </p>
      </div>
    </main>
  );
}

export default Signup;