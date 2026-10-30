import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../../../../context/AuthContext";
import GoogleAuthButton from "../../../../../components/GoogleAuthButton/GoogleAuthButton";
import { getBusinessProfileStatus } from "../services/dashboardApi";

import "./DashboardLogin.css";

const DashboardLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    isAuthenticated,
    loading,
  } = useAuth();

  const [error, setError] = useState("");

  const authenticated =
    typeof isAuthenticated === "boolean"
      ? isAuthenticated
      : Boolean(user);

  // Decide where the user should go after successful login
  const getRedirectPath = useCallback(() => {
    const from = location.state?.from;

    if (
      from &&
      from.startsWith(
        "/businesses/modasphere/dashboard"
      ) &&
      from !==
        "/businesses/modasphere/dashboard/login" &&
      from !==
        "/businesses/modasphere/dashboard/signup" &&
      from !==
        "/businesses/modasphere/dashboard/profile-setup"
    ) {
      return from;
    }

    return "/businesses/modasphere/dashboard";
  }, [location.state]);

  // Check if user has an existing Seller or Manufacturer profile in DB
  const routeUserBasedOnProfile = useCallback(async () => {
    try {
      const status = await getBusinessProfileStatus();
      if (status?.exists && status?.isProfileComplete) {
        // Email ID already exists in Seller/Manufacturer table -> continue to dashboard
        navigate(getRedirectPath(), {
          replace: true,
        });
      } else {
        // New user -> direct them to profile setup
        navigate("/businesses/modasphere/dashboard/profile-setup", {
          replace: true,
        });
      }
    } catch {
      navigate("/businesses/modasphere/dashboard/profile-setup", {
        replace: true,
      });
    }
  }, [getRedirectPath, navigate]);

  // If the user already has a valid session, check their profile status
  useEffect(() => {
    if (!loading && authenticated) {
      routeUserBasedOnProfile();
    }
  }, [
    authenticated,
    loading,
    routeUserBasedOnProfile,
  ]);

  // Called by the existing GoogleAuthButton
  // after Google authentication succeeds.
  const handleGoogleSuccess = () => {
    setError("");
    routeUserBasedOnProfile();
  };

  // Called when Google authentication fails.
  const handleGoogleError = (message) => {
    setError(
      message ||
        "Google authentication failed. Please try again."
    );
  };

  // Wait until AuthProvider finishes checking
  // the existing login session.
  if (loading) {
    return (
      <div className="moda-dashboard-auth-loading">
        <div className="moda-auth-loading-spinner" />

        <p>Checking your session...</p>
      </div>
    );
  }

  return (
    <div className="moda-dashboard-auth">
      {/* LEFT SIDE */}
      <section className="moda-auth-brand">
        <Link
  to="/"
  className="moda-auth-back"
>
  <ArrowLeft size={17} />
  <span>Back to ModaSphere</span>
</Link>
        <div className="moda-auth-brand-content">
          <span className="moda-auth-kicker">
            KAINDRA
          </span>

          <h1>ModaSphere</h1>

          <p>
            Your business workspace for managing
            products, orders, product drops, reviews,
            discounts and production requests.
          </p>

          <div className="moda-auth-benefits">
            <div className="moda-auth-benefit">
              <CheckCircle2 size={17} />

              <span>
                Manage your products and inventory
              </span>
            </div>

            <div className="moda-auth-benefit">
              <CheckCircle2 size={17} />

              <span>
                Track orders and product drops
              </span>
            </div>

            <div className="moda-auth-benefit">
              <CheckCircle2 size={17} />

              <span>
                Monitor your business performance
              </span>
            </div>
          </div>

          <div className="moda-auth-brand-line" />

          <span className="moda-auth-brand-caption">
            BUSINESS DASHBOARD
          </span>
        </div>

        <span className="moda-auth-copyright">
          © 2026 KAINDRA
        </span>
      </section>

      {/* RIGHT SIDE */}
      <section className="moda-auth-form-section">
        <div className="moda-auth-form-wrapper">
          <div className="moda-auth-mobile-logo">
            KAINDRA
          </div>

          <div className="moda-auth-heading">
            <span>MODASPHERE DASHBOARD</span>

            <h2>Welcome back</h2>

            <p>
              Sign in with your Google account to
              continue to your ModaSphere dashboard.
            </p>
          </div>

          {/* GOOGLE AUTH ERROR */}
          {error && (
            <div
              className="moda-auth-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* EXISTING KAINDRA GOOGLE LOGIN */}
          <div className="moda-google-login-section">
            <GoogleAuthButton
              buttonText="Continue with Google"
              theme="light"
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />
          </div>

          {/* SECURITY INFORMATION */}
          <div className="moda-auth-security">
            <div className="moda-auth-security-icon">
              <ShieldCheck size={19} />
            </div>

            <div>
              <strong>Secure sign in</strong>

              <p>
                ModaSphere uses your existing KAINDRA
                Google authentication. Your password is
                never entered or stored by this
                dashboard.
              </p>
            </div>
          </div>

          <div className="moda-auth-divider">
            <span>New to ModaSphere?</span>
          </div>

          {/* DASHBOARD SIGNUP */}
          <button
            type="button"
            className="moda-auth-secondary"
            onClick={() => {
              navigate(
                "/businesses/modasphere/dashboard/signup"
              );
            }}
          >
            Create business account
          </button>

          <p className="moda-auth-note">
            Seller and manufacturer accounts use the
            same KAINDRA authentication system.
          </p>
        </div>
      </section>
    </div>
  );
};

export default DashboardLogin;