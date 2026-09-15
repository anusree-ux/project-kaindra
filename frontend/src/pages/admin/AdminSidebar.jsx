import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Newspaper,
  Building2,
  Users,
  Settings,
  LogOut,
} from "lucide-react";

import "./AdminSidebar.css";

function AdminSidebar() {
  const location = useLocation();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: LayoutDashboard,
    },
    {
      name: "Careers",
      path: "/admin/careers",
      icon: Briefcase,
    },
    {
      name: "News",
      path: "/admin/news",
      icon: Newspaper,
    },
    {
      name: "Businesses",
      path: "/admin/businesses",
      icon: Building2,
    },
    {
      name: "Applications",
      path: "/admin/applications",
      icon: Users,
    },
    {
      name: "Settings",
      path: "/admin/settings",
      icon: Settings,
    },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-logo">
        <div className="admin-logo-mark">K</div>

        <div>
          <h2>KAINDA</h2>
          <span>ADMIN PANEL</span>
        </div>
      </div>

      <nav className="admin-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            item.path === "/admin"
              ? location.pathname === "/admin"
              : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`admin-nav-item ${
                isActive ? "active" : ""
              }`}
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar-bottom">
        <button className="admin-logout">
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;