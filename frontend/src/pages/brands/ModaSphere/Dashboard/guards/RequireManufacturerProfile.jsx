import { Outlet } from "react-router-dom";

const RequireManufacturerProfile = ({ children }) => {
  return children || <Outlet />;
};

export default RequireManufacturerProfile;