import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OTPVerification.css";

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 5 * 60;
const RESEND_COOLDOWN_SECONDS = 30;
const DEMO_OTP = "123456";

function getPendingSignup() {
  try {
    const storedSignup = localStorage.getItem(
      "mototribe_pending_signup"
    );

    if (!storedSignup) {
      return null;
    }

    const parsedSignup = JSON.parse(storedSignup);

    if (!parsedSignup || typeof parsedSignup !== "object") {
      return null;
    }

    return parsedSignup;
  } catch {
    return null;
  }
}

function OTPVerification() {
  const navigate = useNavigate();

  const [signupData] = useState(getPendingSignup);

  const [otp, setOtp] = useState(
    Array(OTP_LENGTH).fill("")
  );

  const [timeLeft, setTimeLeft] = useState(() => {
    const signup = getPendingSignup();

    if (!signup?.otpExpiresAt) {
      return OTP_EXPIRY_SECONDS;
    }

    const remaining = Math.floor(
      (signup.otpExpiresAt - Date.now()) / 1000
    );

    return Math.max(0, remaining);
  });

  const [resendCooldown, setResendCooldown] = useState(
    RESEND_COOLDOWN_SECONDS
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const inputRefs = useRef([]);

  /*
   * Redirect when there is no pending signup.
   *
   * This effect performs navigation, not a synchronous
   * local state update.
   */
  useEffect(() => {
    if (!signupData) {
      navigate("/businesses/mototribe/signup", {
        replace: true,
      });
      return;
    }

    inputRefs.current[0]?.focus();
  }, [signupData, navigate]);

  /*
   * OTP expiry countdown.
   */
  useEffect(() => {
    if (!signupData) {
      return undefined;
    }

    if (timeLeft <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [signupData, timeLeft]);

  /*
   * Resend cooldown.
   */
  useEffect(() => {
    if (resendCooldown <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setResendCooldown((current) =>
        Math.max(0, current - 1)
      );
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [resendCooldown]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) {
      return;
    }

    const digit = value.slice(-1);

    setError("");
    setSuccess("");

    setOtp((current) => {
      const updated = [...current];
      updated[index] = digit;
      return updated;
    });

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

    if (!pastedValue) {
      return;
    }

    const updatedOtp = Array(OTP_LENGTH).fill("");

    pastedValue
      .split("")
      .forEach((digit, index) => {
        updatedOtp[index] = digit;
      });

    setOtp(updatedOtp);
    setError("");

    const focusIndex = Math.min(
      pastedValue.length,
      OTP_LENGTH - 1
    );

    inputRefs.current[focusIndex]?.focus();
  };

  const verifyOtp = (event) => {
    event.preventDefault();

    const enteredOtp = otp.join("");

    if (enteredOtp.length !== OTP_LENGTH) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    if (timeLeft <= 0) {
      setError(
        "This OTP has expired. Please request a new OTP."
      );
      return;
    }

    setIsVerifying(true);
    setError("");

    /*
     * Demo OTP.
     * Replace this comparison with backend verification later.
     */
    if (enteredOtp !== DEMO_OTP) {
      setError("Invalid OTP. Please check and try again.");
      setIsVerifying(false);
      return;
    }

    try {
      const verifiedUser = {
        ...signupData,
        phoneVerified: true,
        verifiedAt: new Date().toISOString(),
        createdAt:
          signupData.createdAt ||
          new Date().toISOString(),
      };

      /*
       * Never store password or OTP after verification.
       */
      delete verifiedUser.password;
      delete verifiedUser.otp;
      delete verifiedUser.otpCode;
      delete verifiedUser.otpExpiresAt;

      localStorage.setItem(
        "mototribe_verified_signup",
        JSON.stringify(verifiedUser)
      );

      localStorage.removeItem(
        "mototribe_pending_signup"
      );

      setSuccess("Phone number verified successfully.");

      window.setTimeout(() => {
        navigate("/businesses/mototribe/profile-setup");
      }, 700);
    } catch {
      setError(
        "Unable to save verification details. Please try again."
      );
      setIsVerifying(false);
    }
  };

  const resendOtp = () => {
    if (resendCooldown > 0) {
      return;
    }

    if (!signupData) {
      navigate("/businesses/mototribe/signup", {
        replace: true,
      });
      return;
    }

    try {
      const newExpiry =
        Date.now() + OTP_EXPIRY_SECONDS * 1000;

      const updatedSignup = {
        ...signupData,
        otpCode: DEMO_OTP,
        otpExpiresAt: newExpiry,
      };

      localStorage.setItem(
        "mototribe_pending_signup",
        JSON.stringify(updatedSignup)
      );

      setOtp(Array(OTP_LENGTH).fill(""));
      setTimeLeft(OTP_EXPIRY_SECONDS);
      setResendCooldown(
        RESEND_COOLDOWN_SECONDS
      );
      setError("");
      setSuccess("A new OTP has been sent.");

      inputRefs.current[0]?.focus();
    } catch {
      setError(
        "Unable to resend OTP. Please try again."
      );
    }
  };

  if (!signupData) {
    return null;
  }

  return (
    <section className="otp-verification-page">
      <div className="otp-verification-container">
        <div className="otp-verification-card">
          <div className="otp-header">
            <span className="otp-eyebrow">
              MOTOTRIBE / VERIFICATION
            </span>

            <h1>
              VERIFY
              <br />
              YOUR RIDE.
            </h1>

            <p>
              Enter the verification code sent to your
              registered mobile number.
            </p>
          </div>

          <div className="otp-contact">
            <span>VERIFICATION TARGET</span>

            <strong>
              {signupData.phone || "Registered number"}
            </strong>
          </div>

          <form onSubmit={verifyOtp}>
            <div
              className="otp-input-group"
              onPaste={handlePaste}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputRefs.current[index] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(event) =>
                    handleChange(
                      index,
                      event.target.value
                    )
                  }
                  onKeyDown={(event) =>
                    handleKeyDown(index, event)
                  }
                  aria-label={`OTP digit ${index + 1}`}
                  autoComplete={
                    index === 0
                      ? "one-time-code"
                      : "off"
                  }
                />
              ))}
            </div>

            <div className="otp-timer">
              <span>CODE EXPIRES IN</span>

              <strong
                className={
                  timeLeft <= 30
                    ? "otp-expiring"
                    : ""
                }
              >
                {formatTime(timeLeft)}
              </strong>
            </div>

            {error && (
              <div
                className="otp-message otp-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="otp-message otp-success"
                role="status"
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              className="verify-otp-button"
              disabled={isVerifying || timeLeft <= 0}
            >
              {isVerifying
                ? "VERIFYING..."
                : "VERIFY OTP"}
            </button>
          </form>

          <div className="otp-resend">
            <span>HAVEN&apos;T RECEIVED THE CODE?</span>

            <button
              type="button"
              onClick={resendOtp}
              disabled={resendCooldown > 0}
            >
              {resendCooldown > 0
                ? `RESEND IN ${resendCooldown}s`
                : "RESEND OTP"}
            </button>
          </div>

          <div className="otp-demo-note">
            <span>DEMO MODE</span>

            <p>
              Test OTP: <strong>123456</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default OTPVerification;