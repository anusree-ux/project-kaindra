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
  const [myStories, setMyStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [savingStory, setSavingStory] = useState(false);

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
        const resModa = await apiClient.get("/api/modasphere/orders/me");
        const modaOrders = resModa.data?.data?.orders || [];

        if (isMounted) {
          setOrders(modaOrders);
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

  // Fetch stories submitted by the logged-in user
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    const fetchMyStories = async () => {
      try {
        setStoriesLoading(true);

        const res = await apiClient.get("/api/modasphere/tales/my");

        if (isMounted) {
          setMyStories(res.data?.tales || []);
        }
      } catch (error) {
        console.error("Failed to fetch your stories:", error);

        if (isMounted) {
          setMyStories([]);
        }
      } finally {
        if (isMounted) {
          setStoriesLoading(false);
        }
      }
    };

    fetchMyStories();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

    const deleteMyStory = async (storyId) => {
      if (!window.confirm("Permanently delete this story?")) return;

      try {
        await apiClient.delete(`/api/modasphere/tales/${storyId}`);

        setMyStories((currentStories) =>
          currentStories.filter((story) => story._id !== storyId)
        );
      } catch (error) {
        console.error("Delete story error:", error.response?.data || error);
        alert(
          error.response?.data?.message || "Failed to delete story."
        );
      }
    };

    const saveStoryEdit = async (event) => {
      event.preventDefault();
      if (!editingStory || savingStory) return;

      setSavingStory(true);

      try {
        const res = await apiClient.patch(
          `/api/modasphere/tales/${editingStory._id}`,
          {
            title: editingStory.title,
            storyType: editingStory.storyType,
            message: editingStory.message,
          }
        );

        setMyStories((current) =>
          current.map((story) =>
            story._id === editingStory._id ? res.data.tale : story
          )
        );

        setEditingStory(null);
        alert("Story updated successfully.");
      } catch (error) {
        const validationErrors = error.response?.data?.errors;

        alert(
          validationErrors?.map((item) => item.message).join("\n") ||
          error.response?.data?.message ||
          "Failed to update story."
        );
      } finally {
        setSavingStory(false);
      }
    };

    const changePublicationStatus = async (story, publicationStatus) => {
      try {
        const res = await apiClient.patch(
          `/api/modasphere/tales/${story._id}/publication`,
          { publicationStatus }
        );

        setMyStories((current) =>
          current.map((item) =>
            item._id === story._id ? res.data.tale : item
          )
        );
      } catch (error) {
        alert(
          error.response?.data?.message ||
          "Failed to update publication status."
        );
      }
    };
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
                <span className="kp-badge kp-badge-verified">
                  ✓ Verified Account
                </span>
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
              <span className="kp-field-label">AUTH METHOD</span>
              <span className="kp-field-value">Google Account</span>
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

        {/* My Stories Section */}
        <div className="kp-section-card">
          <div className="kp-section-header kp-orders-header-row">
            <div>
              <h2>My Stories</h2>
              <p className="kp-section-subtitle">
                View the stories you have shared with the ModaSphere community.
              </p>
            </div>

            {myStories.length > 0 && (
              <span className="kp-order-count-chip">
                {myStories.length} {myStories.length === 1 ? "Story" : "Stories"}
              </span>
            )}
          </div>

          {storiesLoading ? (
            <div className="kp-orders-loading">
              <div className="kp-spinner-small"></div>
              <span>Fetching your stories...</span>
            </div>
          ) : myStories.length === 0 ? (
            <div className="kp-orders-empty">
              <div className="kp-empty-icon">📖</div>
              <h3>No Stories Yet</h3>
              <p>
                You haven't shared any stories with the ModaSphere community yet.
              </p>
            </div>
          ) : (
            <div className="kp-table-wrapper">
              <table className="kp-orders-table">
                <thead>
                  <tr>
                    <th>STORY TYPE</th>
                    <th>STORY</th>
                    <th>SUBMITTED</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {myStories.map((story) => (
                    <tr key={story._id}>
                      <td>{story.storyType || "—"}</td>

                      <td className="kp-items-cell">
                        <span className="kp-items-text" title={story.message}>
                          {story.message || "—"}
                        </span>
                      </td>

                      <td className="kp-date-cell">
                        {formatDate(story.submittedAt)}
                      </td>

                      <td>
                        <span
                          className={`kp-status-badge ${
                            story.status === "Removed" || story.removedAt
                              ? "kp-status-cancelled"
                              : story.publicationStatus === "Draft"
                               ? "kp-status-processing"
                              : story.status === "Approved"
                                ? "kp-status-delivered"
                                : story.status === "Rejected"
                                  ? "kp-status-cancelled"
                                  : "kp-status-processing"
                          }`}
                        >
                          {story.status === "Removed" || story.removedAt
                            ? "Removed by admin"
                            : story.status === "Approved"
                              ? (story.publicationStatus || "Published")
                              : story.status || "Pending"}
                        </span>

                        {(story.status === "Removed" || story.removedAt) &&
                          story.removalReason && (
                            <p className="kp-story-removal-reason">
                              Reason: {story.removalReason}
                            </p>
                          )}
                      </td>

                      <td>
                        {story.status === "Removed" || story.removedAt ? (
                          <span className="kp-story-readonly">
                            Read only
                          </span>
                        ) : (
                          <div className="kp-story-actions">
                            <button
                              type="button"
                              className="kp-story-edit-button"
                              onClick={() =>
                                setEditingStory({
                                  _id: story._id,
                                  title: story.title || "",
                                  storyType: story.storyType || "",
                                  message: story.message || "",
                                })
                              }
                            >
                              Edit
                            </button>

                            {story.status === "Approved" && (
                              <button
                                type="button"
                                className="kp-story-edit-button"
                                onClick={() =>
                                  changePublicationStatus(
                                    story,
                                    (story.publicationStatus || "Published") === "Published"
                                      ? "Draft"
                                      : "Published"
                                  )
                                }
                              >
                                {(story.publicationStatus || "Published") === "Published"
                                  ? "Make draft"
                                  : "Publish"}
                              </button>
                            )}

                            <button
                              type="button"
                              className="kp-story-delete-button"
                              onClick={() => deleteMyStory(story._id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {editingStory && (
          <div
            className="kp-story-edit-overlay"
            onClick={() => !savingStory && setEditingStory(null)}
          >
            <form
              className="kp-story-edit-form"
              onSubmit={saveStoryEdit}
              onClick={(event) => event.stopPropagation()}
            >
              <h2>Edit your story</h2>
              <p>Update your story details and save your changes.</p>

              <label>
                Story title
                <input
                  value={editingStory.title}
                  maxLength={150}
                  required
                  onChange={(event) =>
                    setEditingStory({
                      ...editingStory,
                      title: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Story type
                <input
                  value={editingStory.storyType}
                  maxLength={100}
                  required
                  onChange={(event) =>
                    setEditingStory({
                      ...editingStory,
                      storyType: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Story
                <textarea
                  value={editingStory.message}
                  minLength={10}
                  maxLength={5000}
                  required
                  rows={7}
                  onChange={(event) =>
                    setEditingStory({
                      ...editingStory,
                      message: event.target.value,
                    })
                  }
                />
              </label>

              <div className="kp-story-actions">
                <button type="submit" disabled={savingStory}>
                  {savingStory ? "Saving..." : "Save changes"}
                </button>

                <button
                  type="button"
                  disabled={savingStory}
                  onClick={() => setEditingStory(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

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
