import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Briefcase,
  Users,
  FileText,
  Factory,
  CreditCard,
  ArrowRight,
  BookOpen,
  GraduationCap,
  LogOut,
  Megaphone,
  BarChart3,
  TrendingUp,
} from "lucide-react";

import "./AdminDashboard.css";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem("kaindraAdminAuthenticated");
    navigate("/admin-login", {
      replace: true,
    });
  };

  const [dashboardRefresh, setDashboardRefresh] = useState(0);
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

  // =============================
  // Load Applications
  // =============================
  const getApplications = () => {
    try {
      const savedApplications = localStorage.getItem("kaindraApplications");
      if (!savedApplications) return [];
      const applications = JSON.parse(savedApplications);
      return Array.isArray(applications) ? applications : [];
    } catch (error) {
      console.error("Unable to load applications:", error);
      return [];
    }
  };

  // =============================
  // Load Community Members
  // =============================
  const getCommunityMembers = () => {
    try {
      const savedMembers = localStorage.getItem("kaindraCommunityMembers");
      if (!savedMembers) return [];
      const members = JSON.parse(savedMembers);
      return Array.isArray(members) ? members : [];
    } catch (error) {
      console.error("Unable to load community members:", error);
      return [];
    }
  };

  // =============================
  // Load Production Requests
  // =============================
  const getProductionRequests = () => {
    try {
      const savedRequests = localStorage.getItem("modaManufactureRequests");
      if (!savedRequests) return [];
      const requests = JSON.parse(savedRequests);
      return Array.isArray(requests) ? requests : [];
    } catch (error) {
      console.error("Unable to load production requests:", error);
      return [];
    }
  };

  // =============================
  // Load Payments
  // =============================
  const getPayments = () => {
    try {
      const savedPayments = localStorage.getItem("modaPayments");
      if (!savedPayments) return [];
      const payments = JSON.parse(savedPayments);
      return Array.isArray(payments) ? payments : [];
    } catch (error) {
      console.error("Unable to load payments:", error);
      return [];
    }
  };

  // =============================
  // Load ModaTales Stories
  // =============================
  const getTalesStories = () => {
    try {
      const savedStories = localStorage.getItem("modaTalesSubmissions");
      if (!savedStories) return [];
      const stories = JSON.parse(savedStories);
      return Array.isArray(stories) ? stories : [];
    } catch (error) {
      console.error("Unable to load ModaTales submissions:", error);
      return [];
    }
  };

  // =============================
  // Load ModaAcademy Enrollments
  // =============================
  const getAcademyEnrollments = () => {
    try {
      const savedEnrollments = localStorage.getItem("modaAcademyEnrollments");
      if (!savedEnrollments) return [];
      const enrollments = JSON.parse(savedEnrollments);
      return Array.isArray(enrollments) ? enrollments : [];
    } catch (error) {
      console.error("Unable to load ModaAcademy enrollments:", error);
      return [];
    }
  };

  // =============================
  // Load ModaInfluence Campaigns
  // =============================
  const getInfluenceCampaigns = () => {
    try {
      const savedCampaigns = localStorage.getItem("modaInfluenceCampaigns");
      if (!savedCampaigns) return [];
      const campaigns = JSON.parse(savedCampaigns);
      return Array.isArray(campaigns) ? campaigns : [];
    } catch (error) {
      console.error("Unable to load ModaInfluence campaigns:", error);
      return [];
    }
  };

  // =============================
  // Get Dashboard Data
  // =============================
  const localApplications = getApplications();
  const localCommunityMembers = getCommunityMembers();
  const productionRequests = getProductionRequests();
  const payments = getPayments();
  const talesStories = getTalesStories();
  const academyEnrollments = getAcademyEnrollments();
  const influenceCampaigns = getInfluenceCampaigns();

  const totalApplications = statsData.applications || localApplications.length;
  const totalCommunity = statsData.communityMembers || localCommunityMembers.length;
  const enrollmentsCount = academyEnrollments.length;

  // =============================
  // Listen for Dashboard Updates
  // =============================
  useEffect(() => {
    const handleDashboardUpdates = () => {
      setDashboardRefresh((current) => current + 1);
    };

    window.addEventListener("modaPaymentsUpdated", handleDashboardUpdates);
    window.addEventListener("modaTalesSubmissionsUpdated", handleDashboardUpdates);
    window.addEventListener("modaManufactureRequestsUpdated", handleDashboardUpdates);
    window.addEventListener("modaAcademyEnrollmentsUpdated", handleDashboardUpdates);
    window.addEventListener("modaInfluenceCampaignsUpdated", handleDashboardUpdates);
    window.addEventListener("storage", handleDashboardUpdates);

    return () => {
      window.removeEventListener("modaPaymentsUpdated", handleDashboardUpdates);
      window.removeEventListener("modaTalesSubmissionsUpdated", handleDashboardUpdates);
      window.removeEventListener("modaManufactureRequestsUpdated", handleDashboardUpdates);
      window.removeEventListener("modaAcademyEnrollmentsUpdated", handleDashboardUpdates);
      window.removeEventListener("modaInfluenceCampaignsUpdated", handleDashboardUpdates);
      window.removeEventListener("storage", handleDashboardUpdates);
    };
  }, []);

  void dashboardRefresh;

  // =============================
  // Dashboard Stats
  // =============================
  const stats = [
    {
      title: "Open Positions",
      value: statsData.openPositions,
      icon: Briefcase,
    },
    {
      title: "Applications",
      value: totalApplications,
      icon: FileText,
    },
    {
      title: "Community Members",
      value: totalCommunity,
      icon: Users,
    },
    {
      title: "Growth",
      value: statsData.growth,
      icon: TrendingUp,
    },
    {
      title: "Production Requests",
      value: productionRequests.length,
      icon: Factory,
    },
    {
      title: "Payments",
      value: payments.length,
      icon: CreditCard,
    },
    {
      title: "ModaTales",
      value: talesStories.length,
      icon: BookOpen,
    },
    {
      title: "ModaAcademy",
      value: academyEnrollments.length,
      icon: GraduationCap,
    },
    {
      title: "ModaInfluence",
      value: influenceCampaigns.length,
      icon: Megaphone,
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-container">

        {/* ================================
            HEADER
        ================================= */}
        <div className="admin-header">
          <div>
            <span className="admin-label">
              KAINDRA ADMIN
            </span>

            <h1>Dashboard</h1>

            <p>
              Manage your Kaindra website and
              business operations from one place.
            </p>
          </div>
          <button
            type="button"
            className="admin-logout-button"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            <span>Logout</span>
          </button>

          <div className="admin-welcome">
            <span>Welcome back</span>
            <strong>Admin</strong>
          </div>
        </div>

        {/* ================================
            STATS
        ================================= */}
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

        {/* ================================
            MANAGEMENT
        ================================= */}
        <section className="admin-management">

          <div className="admin-section-heading">
            <div>
              <span className="admin-label">
                MANAGEMENT
              </span>

              <h2>Manage your website</h2>
            </div>

            <p>
              Quickly access the main areas of
              the Kaindra administration panel.
            </p>
          </div>

          <div className="admin-management-grid">

            {/* ================================
                CAREERS
            ================================= */}
            <div className="admin-management-card">
              <div className="admin-card-icon">
                <Briefcase size={24} />
              </div>

              <div className="admin-card-content">
                <h3>Careers</h3>

                <p>
                  Add, edit and remove job openings.
                  Manage available Kaindra positions.
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

            {/* ================================
                APPLICATIONS
            ================================= */}
            <div className="admin-management-card">
              <div className="admin-card-icon">
                <FileText size={24} />
              </div>

              <div className="admin-card-content">
                <h3>
                  Applications

                  {totalApplications > 0 && (
                    <span className="application-count">
                      {totalApplications}
                    </span>
                  )}
                </h3>

                <p>
                  Review applications submitted by
                  candidates for Kaindra positions.
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

            {/* ================================
                COMMUNITY
            ================================= */}
            <div className="admin-management-card">
              <div className="admin-card-icon">
                <Users size={24} />
              </div>

              <div className="admin-card-content">
                <h3>
                  Community

                  {totalCommunity > 0 && (
                    <span className="application-count">
                      {totalCommunity}
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

            {/* ================================
                PRODUCTION REQUESTS
            ================================= */}
            <div className="admin-management-card">
              <div className="admin-card-icon">
                <Factory size={24} />
              </div>

              <div className="admin-card-content">
                <h3>
                  Production Requests

                  {productionRequests.length > 0 && (
                    <span className="application-count">
                      {productionRequests.length}
                    </span>
                  )}
                </h3>

                <p>
                  Review and manage production requests
                  submitted through ModaManufacture.
                </p>

                <Link
                  to="/admin/manufacture-requests"
                  className="admin-card-link"
                >
                  View Production Requests
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            {/* ================================
                PAYMENTS
            ================================= */}
            <div className="admin-management-card">
              <div className="admin-card-icon">
                <CreditCard size={24} />
              </div>

              <div className="admin-card-content">
                <h3>
                  Payments

                  {payments.length > 0 && (
                    <span className="application-count">
                      {payments.length}
                    </span>
                  )}
                </h3>

                <p>
                  View payments received through
                  ModaPay and their connected
                  production requests.
                </p>

                <Link
                  to="/admin/payments"
                  className="admin-card-link"
                >
                  View Payments
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            {/* ================================
                MODATALES
            ================================= */}
            <div className="admin-management-card">
              <div className="admin-card-icon">
                <BookOpen size={24} />
              </div>

              <div className="admin-card-content">
                <h3>
                  ModaTales

                  {talesStories.length > 0 && (
                    <span className="application-count">
                      {talesStories.length}
                    </span>
                  )}
                </h3>

                <p>
                  View and manage stories submitted
                  through the ModaTales platform.
                </p>

                <Link
                  to="/admin/tales"
                  className="admin-card-link"
                >
                  View Stories
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            {/* ================================
                MODAACADEMY
            ================================= */}
            <div className="admin-management-card">
              <div className="admin-card-icon">
                <GraduationCap size={24} />
              </div>

              <div className="admin-card-content">
                <h3>
                  ModaAcademy

                  {enrollmentsCount > 0 && (
                    <span className="application-count">
                      {enrollmentsCount}
                    </span>
                  )}
                </h3>

                <p>
                  View and manage students enrolled
                  in ModaAcademy courses.
                </p>

                <Link
                  to="/admin/academy"
                  className="admin-card-link"
                >
                  View Enrollments
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            {/* ================================
                MODAINFLUENCE
            ================================= */}
            <div className="admin-management-card">
              <div className="admin-card-icon">
                <Megaphone size={24} />
              </div>

              <div className="admin-card-content">
                <h3>
                  ModaInfluence

                  {influenceCampaigns.length > 0 && (
                    <span className="application-count">
                      {influenceCampaigns.length}
                    </span>
                  )}
                </h3>

                <p>
                  View campaigns submitted through
                  the ModaInfluence platform.
                </p>

                <Link
                  to="/admin/influence"
                  className="admin-card-link"
                >
                  View Campaigns
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            {/* ================================
                MODAINSIGHTS
            ================================= */}
            <div className="admin-management-card">
              <div className="admin-card-icon">
                <BarChart3 size={24} />
              </div>

              <div className="admin-card-content">
                <h3>
                  ModaInsights
                </h3>

                <p>
                  View and manage intelligence requests
                  submitted through ModaInsights.
                </p>

                <Link
                  to="/admin/insights"
                  className="admin-card-link"
                >
                  View Insights
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}

export default AdminDashboard;