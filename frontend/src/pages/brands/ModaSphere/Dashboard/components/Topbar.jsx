import {
  Bell,
  CalendarDays,
  LogOut,
  Menu,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../../context/AuthContext";

const Topbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName =
    user?.name ||
    user?.fullName ||
    user?.username ||
    "Seller";

  const role =
    user?.role ||
    user?.accountType ||
    "Seller";

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const date = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const handleLogout = async () => {
    try {
      await logout?.();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="dashboard-topbar">
      <div className="dashboard-topbar-left">
        <button
          type="button"
          className="dashboard-menu-button"
          onClick={onMenuClick}
        >
          <Menu size={21} />
        </button>

        <div className="dashboard-topbar-search">
          <Search size={17} />
          <input placeholder="Search dashboard..." />
        </div>
      </div>

      <div className="dashboard-topbar-right">
        <div className="dashboard-topbar-date">
          <CalendarDays size={16} />
          {date}
        </div>

        <button
          type="button"
          className="dashboard-icon-button"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        <div className="dashboard-user-block">
          <div className="dashboard-user-avatar">
            {initials}
          </div>

          <div className="dashboard-user-text">
            <strong>{displayName}</strong>
            <span>{role}</span>
          </div>
        </div>

        <button
          className="dashboard-btn dashboard-btn-secondary"
          type="button"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Topbar;