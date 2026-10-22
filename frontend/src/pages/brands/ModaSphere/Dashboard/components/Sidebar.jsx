import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Rocket,
  Star,
  BadgePercent,
  Factory,
  Settings,
  X,
} from "lucide-react";

const links = [
  {
    name: "Overview",
    path: "/businesses/modasphere/dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    name: "Products",
    path: "/businesses/modasphere/dashboard/products",
    icon: Package,
  },
  {
    name: "Orders",
    path: "/businesses/modasphere/dashboard/orders",
    icon: ShoppingBag,
  },
  {
    name: "Drops",
    path: "/businesses/modasphere/dashboard/drops",
    icon: Rocket,
  },
  {
    name: "Reviews",
    path: "/businesses/modasphere/dashboard/reviews",
    icon: Star,
  },
  {
    name: "Discounts",
    path: "/businesses/modasphere/dashboard/discounts",
    icon: BadgePercent,
  },
  {
    name: "Production Requests",
    path: "/businesses/modasphere/dashboard/production-requests",
    icon: Factory,
  },
];

const Sidebar = ({ open, onClose }) => (
  <>
    {open && (
      <button
        className="dashboard-sidebar-overlay"
        onClick={onClose}
        aria-label="Close sidebar"
      />
    )}

    <aside className={`dashboard-sidebar ${open ? "open" : ""}`}>
      <div className="dashboard-sidebar-logo">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            <strong>KAINDRA</strong>
            <span>ModaSphere Business</span>
          </div>

          <button
            className="dashboard-sidebar-close"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <p className="dashboard-sidebar-label">DASHBOARD</p>

      <nav className="dashboard-sidebar-nav">
        {links.map(({ name, path, icon: Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `dashboard-sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <Icon size={18} />
            {name}
          </NavLink>
        ))}
      </nav>

      <div className="dashboard-sidebar-bottom">
        <NavLink
          to="/businesses/modasphere/dashboard/settings"
          onClick={onClose}
          className={({ isActive }) =>
            `dashboard-sidebar-link ${
              isActive ? "active" : ""
            }`
          }
        >
          <Settings size={18} />
          Settings
        </NavLink>
      </div>
    </aside>
  </>
);

export default Sidebar;