import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Users,
  FileText,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

import "./AdminDashboard.css";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

function AdminDashboard() {
  const [statsData, setStatsData] = useState({
    openPositions: 6,
    applications: 0,
    communityMembers: 0,
    growth: "12%",
  });

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/stats`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success" && data.data) {
          setStatsData(data.data);
        }
      })
      .catch((err) => {
        console.error("Error fetching admin stats:", err);
      });
  }, []);

  const stats = [
    {
      title: "Open Positions",
      value: statsData.openPositions,
      icon: Briefcase,
    },
    {
      title: "Applications",
      value: statsData.applications,
      icon: FileText,
    },
    {
      title: "Community Members",
      value: statsData.communityMembers,
      icon: Users,
    },
    {
      title: "Growth",
      value: statsData.growth,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-container">

        {/* Header */}
        <div className="admin-header">
          <div>
            <span className="admin-label">
              KAINDRA ADMIN
            </span>

            <h1>Dashboard</h1>

            <p>
              Manage your Kaindra website and business
              operations from one place.
            </p>
          </div>

          <div className="admin-welcome">
            <span>Welcome back</span>
            <strong>Admin</strong>
          </div>
        </div>

        {/* Stats */}
        <div className="admin-stats">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                className="admin-stat-card"
                key={stat.title}
              >
                <div className="admin-stat-icon">
                  <Icon size={22} />
                </div>

                <div>
                  <span>{stat.title}</span>
                  <strong>{stat.value}</strong>
                </div>
              </div>
            );
          })}
        </div>

        {/* Management */}
        <section className="admin-management">

          <div className="admin-section-heading">
            <div>
              <span className="admin-label">
                MANAGEMENT
              </span>

              <h2>Manage your website</h2>
            </div>

            <p>
              Quickly access the main areas of the
              Kaindra administration panel.
            </p>
          </div>

          <div className="admin-management-grid">

            {/* Careers */}
            <div className="admin-management-card">
              <div className="admin-card-icon">
                <Briefcase size={24} />
              </div>

              <div className="admin-card-content">
                <h3>Careers</h3>

                <p>
                  Add, edit and remove job openings.
                  Changes can later be connected
                  directly to the public Careers page.
                </p>

                <Link
                  to="/admin/careers"
                  className="admin-card-link"
                >
                  Manage Careers
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            {/* Applications */}
            <div className="admin-management-card">
              <div className="admin-card-icon">
                <FileText size={24} />
              </div>

              <div className="admin-card-content">
                <h3>
                  Applications

                  {statsData.applications > 0 && (
                    <span className="application-count">
                      {statsData.applications}
                    </span>
                  )}
                </h3>

                <p>
                  Review applications submitted by
                  candidates for available Kaindra
                  positions.
                </p>

                <Link
                  to="/admin/applications"
                  className="admin-card-link"
                >
                  View Applications
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            {/* Community */}
            <div className="admin-management-card">
              <div className="admin-card-icon">
                <Users size={24} />
              </div>

              <div className="admin-card-content">
                <h3>
                  Community

                  {statsData.communityMembers > 0 && (
                    <span className="application-count">
                      {statsData.communityMembers}
                    </span>
                  )}
                </h3>

                <p>
                  View and manage people who have
                  joined the Kaindra community.
                </p>

                <Link
                  to="/admin/community"
                  className="admin-card-link"
                >
                  View Community
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            {/* Team */}
            <div className="admin-management-card">
              <div className="admin-card-icon">
                <Users size={24} />
              </div>

              <div className="admin-card-content">
                <h3>Team</h3>

                <p>
                  Manage team information and internal
                  company details.
                </p>

                <button
                  type="button"
                  className="admin-card-link disabled"
                  disabled
                >
                  Manage Team
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}

export default AdminDashboard;