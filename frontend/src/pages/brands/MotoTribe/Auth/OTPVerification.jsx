import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OTPVerification.css";

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 5 * 60;
const RESEND_COOLDOWN_SECONDS = 30;
const DEMO_OTP = "123456";

function getPendingSignup() {
  try {
    const storedSignup = localStorage.getItem("mototribe_pending_signup");

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
    if (!signupData || timeLeft <= 0) {
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

    pastedValue.split("").forEach((digit, index) => {
      updatedOtp[index] = digit;
    });

    setOtp(updatedOtp);
    setError("");
    setSuccess("");

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
    setSuccess("");

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

      setSuccess(
        "Phone number verified successfully."
      );

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
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
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
    <section className="moto-otp-page">
      <div className="moto-otp-background">
        <div className="moto-otp-grid" />
        <div className="moto-otp-glow moto-otp-glow-one" />
        <div className="moto-otp-glow moto-otp-glow-two" />
      </div>

      <div className="moto-otp-wrapper">
        <a
          href="/businesses/mototribe"
          className="moto-otp-logo"
        >
          <span className="moto-otp-logo-mark">
            MT
          </span>

          <span className="moto-otp-logo-text">
            MOTO<span>TRIBE</span>
          </span>
        </a>

        <div className="moto-otp-card">
          <div className="moto-otp-icon">
            <span>✓</span>
          </div>

          <div className="moto-otp-header">
            <p className="moto-otp-eyebrow">
              MOTOTRIBE / VERIFICATION
            </p>

            <h1>
              VERIFY
              <br />
              YOUR RIDE.
            </h1>

            <p>
              Enter the verification code sent to your
              registered mobile number.
            </p>

            <strong>
              {signupData.phone || "Registered number"}
            </strong>
          </div>

          <form
            className="moto-otp-form"
            onSubmit={verifyOtp}
          >
            <div
              className="moto-otp-inputs"
              onPaste={handlePaste}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputRefs.current[index] = element;
                  }}
                  className={
                    error
                      ? "moto-otp-input moto-otp-input-error"
                      : "moto-otp-input"
                  }
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

            <div className="moto-otp-status">
              {timeLeft > 0 ? (
                <div className="moto-otp-timer">
                  <span className="moto-otp-timer-dot" />

                  <span>
                    CODE EXPIRES IN
                  </span>

                  <strong>
                    {formatTime(timeLeft)}
                  </strong>
                </div>
              ) : (
                <span className="moto-otp-expired">
                  OTP EXPIRED
                </span>
              )}
            </div>

            {error && (
              <div
                className="moto-otp-message moto-otp-message-error"
                role="alert"
              >
                <span>!</span>
                <div>{error}</div>
              </div>
            )}

            {success && (
              <div
                className="moto-otp-message moto-otp-message-success"
                role="status"
              >
                <span>✓</span>
                <div>{success}</div>
              </div>
            )}

            <button
              type="submit"
              className="moto-otp-verify"
              disabled={
                isVerifying ||
                timeLeft <= 0
              }
            >
              {isVerifying ? (
                <>
                  <span className="moto-otp-spinner" />
                  <span>VERIFYING...</span>
                </>
              ) : (
                <>
                  <span>VERIFY OTP</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          <div className="moto-otp-resend">
            <span>
              HAVEN&apos;T RECEIVED THE CODE?
            </span>

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

          <div className="moto-otp-help">
            <p>DEMO MODE</p>

            <strong>{DEMO_OTP}</strong>
          </div>

          <a
            href="/businesses/mototribe/signup"
            className="moto-otp-back"
          >
            ← BACK TO SIGN UP
          </a>
        </div>

        <div className="moto-otp-footer">
          MOTOTRIBE / RIDE TOGETHER
        </div>
      </div>
    </section>
  );
}

export default OTPVerification;