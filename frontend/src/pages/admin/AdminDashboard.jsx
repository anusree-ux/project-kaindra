import { Link } from "react-router-dom";
import {
  Briefcase,
  Users,
  FileText,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

import "./AdminDashboard.css";

function AdminDashboard() {
  // Get submitted applications
  const getApplications = () => {
    try {
      const savedApplications =
        localStorage.getItem("kaindraApplications");

      if (!savedApplications) {
        return [];
      }

      const applications = JSON.parse(savedApplications);

      return Array.isArray(applications) ? applications : [];
    } catch (error) {
      console.error(
        "Unable to load applications:",
        error
      );

      return [];
    }
  };

  // Get community members
  const getCommunityMembers = () => {
    try {
      const savedMembers =
        localStorage.getItem("kaindraCommunityMembers");

      if (!savedMembers) {
        return [];
      }

      const members = JSON.parse(savedMembers);

      return Array.isArray(members) ? members : [];
    } catch (error) {
      console.error(
        "Unable to load community members:",
        error
      );

      return [];
    }
  };

  const applications = getApplications();
  const communityMembers = getCommunityMembers();

  const stats = [
    {
      title: "Open Positions",
      value: "6",
      icon: Briefcase,
    },
    {
      title: "Applications",
      value: applications.length,
      icon: FileText,
    },
    {
      title: "Community Members",
      value: communityMembers.length,
      icon: Users,
    },
    {
      title: "Growth",
      value: "12%",
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

                  {applications.length > 0 && (
                    <span className="application-count">
                      {applications.length}
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

                  {communityMembers.length > 0 && (
                    <span className="application-count">
                      {communityMembers.length}
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