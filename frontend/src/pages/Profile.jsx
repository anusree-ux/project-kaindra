import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import apiClient from "../services/apiClient";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, logout, openAuthModal } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  // Fetch orders from database
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);
        let allOrders = [];

        try {
          const resModa = await apiClient.get("/api/modasphere/orders/me");
          const modaOrders = resModa.data?.data?.orders || [];
          allOrders = [...allOrders, ...modaOrders];
        } catch (e) {
          console.warn("[Profile] ModaSphere orders fetch error:", e);
        }

        try {
          const resCore = await apiClient.get("/api/orders/my-orders");
          const coreOrders = resCore.data?.data?.orders || [];
          const seen = new Set(allOrders.map((o) => String(o._id || o.id)));
          for (const co of coreOrders) {
            const coId = String(co._id || co.id);
            if (coId && !seen.has(coId)) {
              allOrders.push(co);
            }
          }
        } catch (e) {
          // ignore core fallback errors
        }

        if (isMounted) {
          setOrders(allOrders);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        if (isMounted) setOrdersLoading(false);
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // 1. Clean loading state during silent session restore (prevents flicker)
  if (loading) {
    return (
      <div className="kp-page">
        <div className="kp-container">
          <div className="kp-loading-card">
            <div className="kp-spinner"></div>
            <p>Loading your Kaindra profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated state (prevents rendering partial/empty data on direct navigation)
  if (!isAuthenticated || !user) {
    return (
      <div className="kp-page">
        <div className="kp-container">
          <button onClick={handleBack} className="kp-back-btn" aria-label="Go back">
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <div className="kp-unauth-card">
            <div className="kp-unauth-icon">🔒</div>
            <h2>Account Sign In Required</h2>
            <p>
              Please log in with your Kaindra account to view and manage your
              profile information, order history, and connected brand services.
            </p>
            <div className="kp-unauth-actions">
              <button
                className="kp-btn-primary"
                onClick={() => openAuthModal("login")}
              >
                Sign In to Kaindra
              </button>
              <Link to="/" className="kp-btn-secondary">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format member role label cleanly
  const getRoleLabel = (role) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "moderator":
        return "Community Moderator";
      default:
        return "Kaindra Member";
    }
  };

  // Format creation date
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  // Format currency
  const formatPrice = (amount) => {
    if (typeof amount !== "number") return amount || "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  // Status Badge Class
  const getStatusClass = (status = "Processing") => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "kp-status-delivered";
      case "shipped":
        return "kp-status-shipped";
      case "confirmed":
        return "kp-status-confirmed";
      case "cancelled":
        return "kp-status-cancelled";
      default:
        return "kp-status-processing";
    }
  };

  // Avatar initial
  const avatarLetter = user.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="kp-page">
      <div className="kp-container">
        {/* Navigation / Back Button */}
        <div className="kp-top-bar">
          <button onClick={handleBack} className="kp-back-btn" aria-label="Go back">
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
        </div>
        
        {/* Main Header Banner */}
        <div className="kp-header-card">
          <div className="kp-header-left">
            <div className="kp-avatar">
              {avatarLetter}
            </div>
            <div className="kp-header-info">
              <span className="kp-eyebrow">KAINDRA ACCOUNT</span>
              <h1 className="kp-user-name">{user.name}</h1>
              <div className="kp-badge-row">
                <span className="kp-badge kp-badge-role">
                  {getRoleLabel(user.role)}
                </span>
                {user.isPhoneVerified ? (
                  <span className="kp-badge kp-badge-verified">
                    ✓ Phone Verified
                  </span>
                ) : (
                  <span className="kp-badge kp-badge-unverified">
                    ⚠️ Phone Unverified
                  </span>
                )}
              </div>
            </div>
          </div>

          <button className="kp-logout-button" onClick={logout}>
            Log Out
          </button>
        </div>

        {/* Account Details Section */}
        <div className="kp-section-card">
          <div className="kp-section-header">
            <h2>Account Details</h2>
            <p className="kp-section-subtitle">
              Your core personal credentials across the Kaindra ecosystem
            </p>
          </div>

          <div className="kp-fields-grid">
            <div className="kp-field-item">
              <span className="kp-field-label">FULL NAME</span>
              <span className="kp-field-value">{user.name || "—"}</span>
            </div>

            <div className="kp-field-item">
              <span className="kp-field-label">EMAIL ADDRESS</span>
              <span className="kp-field-value">{user.email || "—"}</span>
            </div>

            <div className="kp-field-item">
              <span className="kp-field-label">PHONE NUMBER</span>
              <span className="kp-field-value">{user.phoneNumber || "—"}</span>
            </div>

            <div className="kp-field-item">
              <span className="kp-field-label">MEMBER SINCE</span>
              <span className="kp-field-value">
                {formatDate(user.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Previous Orders Table Section */}
        <div className="kp-section-card">
          <div className="kp-section-header kp-orders-header-row">
            <div>
              <h2>Order History</h2>
              <p className="kp-section-subtitle">
                Previous purchases, deliveries, and pre-orders across Kaindra & ModaSphere
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {orders.length > 0 && (
                <span className="kp-order-count-chip">
                  {orders.length} {orders.length === 1 ? "Order" : "Orders"}
                </span>
              )}
              <Link
                to="/businesses/modamart/orders"
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#0f172a",
                  textDecoration: "none",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                }}
              >
                ModaMart Orders →
              </Link>
            </div>
          </div>

          {ordersLoading ? (
            <div className="kp-orders-loading">
              <div className="kp-spinner-small"></div>
              <span>Fetching order history...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="kp-orders-empty">
              <div className="kp-empty-icon">🛍️</div>
              <h3>No Previous Orders Found</h3>
              <p>
                You haven't placed any orders on ModaMart or ModaDrop yet.
              </p>
              <Link to="/businesses/modamart/shop" className="kp-shop-btn">
                Explore ModaMart Shop →
              </Link>
            </div>
          ) : (
            <div className="kp-table-wrapper">
              <table className="kp-orders-table">
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>BRAND</th>
                    <th>ITEMS</th>
                    <th>DATE</th>
                    <th>TOTAL</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord, idx) => {
                    const orderId =
                      ord.orderNumber ||
                      (ord._id ? `MS-${ord._id.slice(-6).toUpperCase()}` : `ORD-${idx + 1}`);
                    const brandName = ord.brand || (ord.dropTitle ? "ModaDrop" : "ModaMart");
                    const dateVal = ord.createdAt || ord.date || ord.orderDate;
                    const itemsSummary = Array.isArray(ord.items) && ord.items.length > 0
                      ? ord.items.map((it) => `${it.name || "Item"} (x${it.quantity || 1})`).join(", ")
                      : ord.productName || ord.dropTitle || "Product Item";
                    const totalVal = ord.totalAmount || ord.total || ord.price || 0;
                    const rawStatus = ord.orderStatus || ord.status || "Processing";
                    const statusVal = rawStatus.replace("_", " ").toUpperCase();

                    return (
                      <tr key={ord._id || orderId || idx}>
                        <td className="kp-order-id-cell">
                          {ord._id ? (
                            <Link
                              to={`/businesses/modamart/orders/${ord._id}`}
                              style={{ color: "#0f172a", textDecoration: "none", fontWeight: 700 }}
                              title="View Order Details"
                            >
                              <strong>{orderId}</strong>
                            </Link>
                          ) : (
                            <strong>{orderId}</strong>
                          )}
                        </td>
                        <td>
                          <span className={`kp-brand-pill kp-brand-${brandName.toLowerCase()}`}>
                            {brandName}
                          </span>
                        </td>
                        <td className="kp-items-cell">
                          <span className="kp-items-text" title={itemsSummary}>
                            {itemsSummary}
                          </span>
                        </td>
                        <td className="kp-date-cell">
                          {formatDate(dateVal)}
                        </td>
                        <td className="kp-total-cell">
                          <strong>{formatPrice(totalVal)}</strong>
                        </td>
                        <td>
                          <span className={`kp-status-badge ${getStatusClass(statusVal)}`}>
                            {statusVal}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ecosystem Brand Profiles */}
        <div className="kp-section-card">
          <div className="kp-section-header">
            <h2>Connected Brand Profiles</h2>
            <p className="kp-section-subtitle">
              Switch contexts to view brand-specific data and tailored experiences
            </p>
          </div>

          <div className="kp-ecosystem-grid">
            {/* MotoTribe Card */}
            <div className="kp-ecosystem-card kp-card-mototribe">
              <div className="kp-ecosystem-top">
                <span className="kp-ecosystem-tag">MOTOTRIBE</span>
                <h3>Rider Profile</h3>
                <p>
                  Manage your motorcycles, riding experience, routes, badges, and
                  emergency SOS contacts.
                </p>
              </div>
              <Link
                to="/businesses/mototribe/profile-setup"
                className="kp-ecosystem-btn kp-btn-mototribe"
              >
                Open Rider Profile →
              </Link>
            </div>

            {/* ModaSphere Card */}
            <div className="kp-ecosystem-card kp-card-modasphere">
              <div className="kp-ecosystem-top">
                <span className="kp-ecosystem-tag">MODASPHERE</span>
                <h3>ModaMart & Drops</h3>
                <p>
                  Browse latest designer drops, track retail orders, and explore
                  fashion ecosystem innovations.
                </p>
              </div>
              <Link
                to="/businesses/modamart/shop"
                className="kp-ecosystem-btn kp-btn-modasphere"
              >
                Explore ModaSphere →
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Profile;
