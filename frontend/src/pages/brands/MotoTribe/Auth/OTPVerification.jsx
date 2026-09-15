import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OTPVerification.css";

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 120;
const RESEND_COOLDOWN_SECONDS = 30;

function generateDemoOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function OTPVerification() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [demoOtp, setDemoOtp] = useState(() => generateDemoOtp());
  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRY_SECONDS);
  const [resendTime, setResendTime] = useState(
    RESEND_COOLDOWN_SECONDS
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    const account = localStorage.getItem("mototribeSignupAccount");

    if (!account) {
      navigate("/businesses/mototribe/signup");
      return;
    }

    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, [navigate]);

  // OTP expiry timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendTime <= 0) return;

    const timer = setInterval(() => {
      setResendTime((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendTime]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const digit = value.slice(-1);

    const updatedOtp = [...otp];
    updatedOtp[index] = digit;

    setOtp(updatedOtp);
    setError("");

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (
      event.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }

    if (
      event.key === "ArrowLeft" &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }

    if (
      event.key === "ArrowRight" &&
      index < OTP_LENGTH - 1
    ) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();

    const pastedValue = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pastedValue) return;

    const pastedOtp = Array(OTP_LENGTH).fill("");

    pastedValue.split("").forEach((digit, index) => {
      pastedOtp[index] = digit;
    });

    setOtp(pastedOtp);

    const nextIndex = Math.min(
      pastedValue.length,
      OTP_LENGTH - 1
    );

    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = () => {
    const enteredOtp = otp.join("");

    setError("");
    setSuccess("");

    if (enteredOtp.length !== OTP_LENGTH) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    if (timeLeft <= 0) {
      setError("This OTP has expired. Please request a new OTP.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (enteredOtp !== demoOtp) {
        setError("Invalid OTP. Please check the code and try again.");
        setLoading(false);
        return;
      }

      const accountData = JSON.parse(
        localStorage.getItem("mototribeSignupAccount")
      );

      const verifiedAccount = {
        ...accountData,
        verified: true,
      };

      localStorage.setItem(
        "mototribeSignupAccount",
        JSON.stringify(verifiedAccount)
      );

      localStorage.setItem("mototribeOtpVerified", "true");

      setSuccess("Rider verified successfully.");
      setLoading(false);

      setTimeout(() => {
        navigate("/businesses/mototribe/profile-setup");
      }, 1000);
    }, 700);
  };

  const handleResend = () => {
    if (resendTime > 0) return;

    const newOtp = generateDemoOtp();

    setDemoOtp(newOtp);
    setOtp(Array(OTP_LENGTH).fill(""));
    setTimeLeft(OTP_EXPIRY_SECONDS);
    setResendTime(RESEND_COOLDOWN_SECONDS);
    setError("");
    setSuccess("");

    inputRefs.current[0]?.focus();
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  return (
    <div className="moto-otp-page">
      <div className="moto-otp-background">
        <div className="moto-otp-glow glow-one"></div>
        <div className="moto-otp-glow glow-two"></div>
      </div>

      <div className="moto-otp-card">

        <div className="moto-otp-brand">
          <span>MOTO</span>
          <strong>TRIBE</strong>
        </div>

        <div className="moto-otp-badge">
          VERIFY RIDER
        </div>

        <h1>Verify your number</h1>

        <p className="moto-otp-description">
          Enter the 6-digit verification code generated
          for your MotoTribe rider account.
        </p>

        {/* Development-only demo OTP */}
        <div className="moto-demo-otp">
          <span>DEMO OTP</span>
          <strong>{demoOtp || "------"}</strong>
          <small>
            Frontend prototype — no SMS service connected
          </small>
        </div>

        <div className="moto-otp-inputs">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              type="text"
              inputMode="numeric"
              maxLength="1"
              value={digit}
              onChange={(event) =>
                handleChange(index, event.target.value)
              }
              onKeyDown={(event) =>
                handleKeyDown(index, event)
              }
              onPaste={handlePaste}
              aria-label={`OTP digit ${index + 1}`}
            />
          ))}
        </div>

        <div className="moto-otp-timer">
          <span>
            OTP expires in{" "}
            <strong>{formatTime(timeLeft)}</strong>
          </span>
        </div>

        {error && (
          <div className="moto-otp-message error">
            {error}
          </div>
        )}

        {success && (
          <div className="moto-otp-message success">
            {success}
          </div>
        )}

        <button
          className="moto-verify-button"
          onClick={handleVerify}
          disabled={loading}
        >
          {loading ? "VERIFYING..." : "VERIFY RIDER"}
        </button>

        <div className="moto-resend">
          {resendTime > 0 ? (
            <span>
              Resend OTP in{" "}
              <strong>{resendTime}s</strong>
            </span>
          ) : (
            <button onClick={handleResend}>
              RESEND OTP
            </button>
          )}
        </div>

        <button
          className="moto-back-signup"
          onClick={() =>
            navigate("/businesses/mototribe/signup")
          }
        >
          ← BACK TO SIGNUP
        </button>

        <div className="moto-otp-footer">
          FRONTEND PROTOTYPE • OTP SIMULATED LOCALLY
        </div>

      </div>
    </div>
  );
}

export default OTPVerification;