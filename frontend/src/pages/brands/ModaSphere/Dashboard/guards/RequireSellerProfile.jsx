import { Outlet } from "react-router-dom";

const RequireSellerProfile = ({ children }) => {
  return children || <Outlet />;
};

export default RequireSellerProfile;