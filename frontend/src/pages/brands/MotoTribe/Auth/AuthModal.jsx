import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../../context/AuthContext";
import "./AuthModal.css";

export default function AuthModal() {
  const {
    authModalOpen,
    authModalTab,
    pendingOtpData,
    openAuthModal,
    closeAuthModal,
    login,
    signup,
    verifyOtp,
    resendOtp,
  } = useAuth();

  // Login Form State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup Form State
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPhone, setSignupPhone] = useState("");

  // OTP Form State
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const r0 = useRef(null);
  const r1 = useRef(null);
  const r2 = useRef(null);
  const r3 = useRef(null);
  const r4 = useRef(null);
  const r5 = useRef(null);
  const otpRefs = [r0, r1, r2, r3, r4, r5];
  
  // Read initial cooldown from sessionStorage if active
  const [cooldown, setCooldownState] = useState(() => {
    const savedEnd = sessionStorage.getItem("moto_otp_cooldown_end");
    if (savedEnd) {
      const remaining = Math.ceil((parseInt(savedEnd, 10) - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    }
    return 0;
  });

  const setCooldown = (seconds) => {
    if (seconds > 0) {
      sessionStorage.setItem("moto_otp_cooldown_end", Date.now() + seconds * 1000);
    } else {
      sessionStorage.removeItem("moto_otp_cooldown_end");
    }
    setCooldownState(seconds);
  };

  // Common UI State
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset messages when modal or tab changes
  useEffect(() => {
    setErrorMsg("");
    setInfoMsg("");
    setSubmitting(false);
  }, [authModalOpen, authModalTab]);

  // Cooldown countdown timer for Resend OTP
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldownState((prev) => {
          if (prev <= 1) {
            sessionStorage.removeItem("moto_otp_cooldown_end");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!authModalOpen) return null;

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");
    setSubmitting(true);

    const res = await login(loginEmail, loginPassword);
    setSubmitting(false);

    if (!res.success && !res.needsOtp) {
      setErrorMsg(res.message);
    }
  };

  // Handle Signup Submit
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");
    setSubmitting(true);

    let phoneFormatted = signupPhone.trim();
    if (!phoneFormatted.startsWith("+")) {
      phoneFormatted = `+91${phoneFormatted.replace(/^0+/, "")}`;
    }

    const res = await signup({
      name: signupName.trim(),
      email: signupEmail.trim(),
      password: signupPassword,
      phoneNumber: phoneFormatted,
    });

    setSubmitting(false);
    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      setCooldown(60); // Start 60s cooldown timer
    }
  };

  // Handle OTP digit inputs
  const handleOtpChange = (index, value) => {
    if (/^\d*$/.test(value)) {
      const newDigits = [...otpDigits];
      newDigits[index] = value.slice(-1);
      setOtpDigits(newDigits);

      // Auto-focus next input
      if (value && index < 5) {
        otpRefs[index + 1].current?.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  // Handle OTP Submit
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    const fullCode = otpDigits.join("");
    if (fullCode.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit OTP code.");
      return;
    }

    const userId = pendingOtpData?.userId;
    if (!userId) {
      setErrorMsg("Missing user session ID. Please try signing up again.");
      return;
    }

    setSubmitting(true);
    const res = await verifyOtp(userId, fullCode);
    setSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.message);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0) return;

    const userId = pendingOtpData?.userId;
    if (!userId) {
      setErrorMsg("Missing user session ID. Please sign up or log in again.");
      return;
    }

    setErrorMsg("");
    setInfoMsg("");
    setSubmitting(true);

    const res = await resendOtp(userId);
    setSubmitting(false);

    if (res.success) {
      setInfoMsg(res.message);
      setCooldown(60); // Restart 60s cooldown timer
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="auth-overlay" onClick={closeAuthModal}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="auth-close-btn" onClick={closeAuthModal} aria-label="Close modal">
          &times;
        </button>

        {/* Modal Branding Header */}
        <div className="auth-brand-header">
          <span className="auth-brand-main">MOTO</span>
          <span className="auth-brand-sub">TRIBE</span>
        </div>

        {/* Tab Navigation */}
        <div className="auth-tabs">
          {authModalTab !== "otp" ? (
            <>
              <button
                className={`auth-tab ${authModalTab === "login" ? "active" : ""}`}
                onClick={() => openAuthModal("login")}
              >
                LOG IN
              </button>
              <button
                className={`auth-tab ${authModalTab === "signup" ? "active" : ""}`}
                onClick={() => openAuthModal("signup")}
              >
                SIGN UP
              </button>
            </>
          ) : (
            <div className="auth-tab active single-tab">OTP VERIFICATION</div>
          )}
        </div>

        {/* Error / Info Banners */}
        {errorMsg && <div className="auth-alert error">{errorMsg}</div>}
        {infoMsg && <div className="auth-alert info">{infoMsg}</div>}

        {/* --- LOGIN FORM --- */}
        {authModalTab === "login" && (
          <form onSubmit={handleLoginSubmit} className="auth-form">
            <div className="auth-field">
              <label>EMAIL ADDRESS</label>
              <input
                type="email"
                placeholder="rider@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label>PASSWORD</label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={submitting}>
              {submitting ? "LOGGING IN..." : "LOG IN TO MOTOTRIBE"}
            </button>

            <div className="auth-footer-toggle">
              Don't have an account?{" "}
              <button type="button" onClick={() => openAuthModal("signup")}>
                Sign Up
              </button>
            </div>
          </form>
        )}

        {/* --- SIGNUP FORM --- */}
        {authModalTab === "signup" && (
          <form onSubmit={handleSignupSubmit} className="auth-form">
            <div className="auth-field">
              <label>FULL NAME</label>
              <input
                type="text"
                placeholder="Rider Name"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label>EMAIL ADDRESS</label>
              <input
                type="email"
                placeholder="rider@example.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label>PHONE NUMBER (FOR OTP SMS)</label>
              <input
                type="tel"
                placeholder="9876543210"
                value={signupPhone}
                onChange={(e) => setSignupPhone(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label>PASSWORD</label>
              <input
                type="password"
                placeholder="••••••••"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={submitting}>
              {submitting ? "REGISTERING..." : "CREATE ACCOUNT & SEND OTP"}
            </button>

            <div className="auth-footer-toggle">
              Already have an account?{" "}
              <button type="button" onClick={() => openAuthModal("login")}>
                Log In
              </button>
            </div>
          </form>
        )}

        {/* --- OTP VERIFICATION FORM --- */}
        {authModalTab === "otp" && (
          <form onSubmit={handleOtpSubmit} className="auth-form">
            <p className="otp-subtitle">
              We sent a 6-digit SMS verification code to{" "}
              <strong>{pendingOtpData?.phoneNumber || "your phone number"}</strong>
            </p>

            <div className="otp-box-container">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={otpRefs[idx]}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="otp-digit-box"
                />
              ))}
            </div>

            <button type="submit" className="auth-submit-btn" disabled={submitting}>
              {submitting ? "VERIFYING..." : "VERIFY & CONTINUE"}
            </button>

            <div className="otp-resend-row">
              <button
                type="button"
                className="otp-resend-btn"
                onClick={handleResendOtp}
                disabled={cooldown > 0 || submitting}
              >
                {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP SMS"}
              </button>
            </div>

            <div className="auth-footer-toggle">
              Entered wrong details?{" "}
              <button type="button" onClick={() => openAuthModal("signup")}>
                Start Over
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
