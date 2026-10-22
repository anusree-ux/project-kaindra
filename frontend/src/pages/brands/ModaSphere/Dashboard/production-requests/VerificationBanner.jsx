import { ShieldCheck } from "lucide-react";

const VerificationBanner = () => (
  <div
    style={{
      padding: 17,
      background: "#eff6ff",
      border: "1px solid #dbeafe",
      borderRadius: 10,
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}
  >
    <ShieldCheck size={20} />

    <div>
      <strong style={{ fontSize: 13 }}>
        Business verification
      </strong>

      <div
        style={{
          marginTop: 3,
          color: "#555",
          fontSize: 12,
        }}
      >
        Verification information will be connected when
        the backend verification API is available.
      </div>
    </div>
  </div>
);

export default VerificationBanner;