
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleAuthButton from "../components/GoogleAuthButton/GoogleAuthButton";

function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  return (
    <main
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "16px",
        background: "#f7f7f7",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          minWidth: 0,
          boxSizing: "border-box",
          padding: "clamp(20px, 6vw, 35px)",
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            marginBottom: "8px",
            fontSize: "26px",
            fontWeight: "700",
          }}
        >
          Welcome Back
        </h1>

        <p
          style={{
            color: "#6b7280",
            fontSize: "14px",
            marginBottom: "28px",
            lineHeight: 1.6,
          }}
        >
          Sign in to your Kaindra account to continue.
        </p>

        {error && (
          <div
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px",
              marginBottom: "20px",
              background: "#fee2e2",
              color: "#991b1b",
              borderRadius: "6px",
              fontSize: "14px",
              overflowWrap: "anywhere",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            width: "100%",
            minWidth: 0,
            maxWidth: "100%",
            overflow: "hidden",
          }}
        >
          <GoogleAuthButton
            theme="light"
            buttonText="Sign in with Google"
            onSuccess={() => navigate("/")}
            onError={(err) => setError(err)}
          />
        </div>

        <p
          style={{
            marginTop: "28px",
            fontSize: "13px",
            color: "#6b7280",
            lineHeight: 1.6,
          }}
        >
          Don't have an account?{" "}

          <Link
            to="/signup"
            style={{
              color: "#111827",
              fontWeight: "600",
              textDecoration: "underline",
            }}
          >
            Sign up with Google
          </Link>
        </p>
      </div>
    </main>
  );
}

export default Login;
