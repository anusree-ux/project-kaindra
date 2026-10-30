import { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useAuth } from "../../../../../context/AuthContext";
import { getBusinessProfileStatus } from "../services/dashboardApi";

const RequireAuth = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  const [checkingProfile, setCheckingProfile] = useState(true);
  const [profileComplete, setProfileComplete] = useState(true);

  const authenticated =
    typeof isAuthenticated === "boolean"
      ? isAuthenticated
      : Boolean(user);

  useEffect(() => {
    if (!authenticated || loading) {
      setCheckingProfile(false);
      return;
    }

    if (location.pathname === "/businesses/modasphere/dashboard/profile-setup") {
      setCheckingProfile(false);
      return;
    }

    let isMounted = true;
    setCheckingProfile(true);
    getBusinessProfileStatus()
      .then((status) => {
        if (!isMounted) return;
        setProfileComplete(Boolean(status?.exists && status?.isProfileComplete));
      })
      .catch(() => {
        if (isMounted) setProfileComplete(true);
      })
      .finally(() => {
        if (isMounted) setCheckingProfile(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authenticated, loading, location.pathname]);

  if (loading || (authenticated && checkingProfile && location.pathname !== "/businesses/modasphere/dashboard/profile-setup")) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f6f7f9",
          color: "#666",
        }}
      >
        Loading dashboard...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/businesses/modasphere/dashboard/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (!profileComplete && location.pathname !== "/businesses/modasphere/dashboard/profile-setup") {
    return (
      <Navigate
        to="/businesses/modasphere/dashboard/profile-setup"
        replace
      />
    );
  }

  return children || <Outlet />;
};

export default RequireAuth;