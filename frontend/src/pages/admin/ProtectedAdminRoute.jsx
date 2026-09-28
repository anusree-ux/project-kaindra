import { Navigate } from "react-router-dom";

function ProtectedAdminRoute({ children }) {
  const isAuthenticated =
    sessionStorage.getItem("kaindraAdminAuthenticated") === "true";

  if (!isAuthenticated) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
}

export default ProtectedAdminRoute;