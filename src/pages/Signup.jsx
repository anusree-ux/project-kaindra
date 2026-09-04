import { Link } from "react-router-dom";

function Signup() {
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

        <form
          style={{
            display: "grid",
            gap: "15px",
            marginTop: "25px",
          }}
        >
          <input placeholder="Full name" style={inputStyle} />

          <input
            type="email"
            placeholder="Email"
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Password"
            style={inputStyle}
          />

          <button style={buttonStyle}>
            Create Account
          </button>
        </form>

        <p style={{ marginTop: "20px", fontSize: "14px" }}>
          Already have an account?{" "}
          <Link to="/login">Login</Link>
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
};

export default Signup;