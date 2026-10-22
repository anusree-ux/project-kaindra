import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useAuth } from "../../../../../context/AuthContext";

const RequireAuth = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  const authenticated =
    typeof isAuthenticated === "boolean"
      ? isAuthenticated
      : Boolean(user);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f6f7f9",
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

  return children || <Outlet />;
};

export default RequireAuth;