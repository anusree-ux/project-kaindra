import { useEffect, useState, useContext, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  ChevronRight,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import apiClient from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./Orders.css";

export default function Orders() {
  const navigate = useNavigate();

  const { isAuthenticated, loading: authLoading, openAuthModal } = useAuth();
  const { addToCart } = useCart();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Search
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'active' | 'delivered' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState("");

  // Modal actions
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [deliverModalOrder, setDeliverModalOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionToast, setActionToast] = useState(null);
  const [buyAgainToast, setBuyAgainToast] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get("/api/modasphere/orders/me");
      // Backend returns newest first (.sort({ createdAt: -1 }))
      const orderList = response.data?.data?.orders || [];
      setOrders(orderList);
    } catch (err) {
      console.error("[Orders] Failed to load orders:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to load orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        fetchOrders();
      } else {
        setLoading(false);
      }
    }
  }, [authLoading, isAuthenticated]);

  // Cancel order handler
  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;
    setActionLoading(true);
    try {
      const res = await apiClient.patch(
        `/api/modasphere/orders/${cancelModalOrder._id}/cancel`
      );
      const updatedOrder = res.data?.data?.order;
      setOrders((prev) =>
        prev.map((o) =>
          o._id === cancelModalOrder._id
            ? { ...o, ...updatedOrder, status: "cancelled" }
            : o
        )
      );
      setActionToast({
        type: "success",
        text: res.data?.message || "Order cancelled successfully.",
      });
      setCancelModalOrder(null);
    } catch (err) {
      console.error("[Orders] Failed to cancel order:", err);
      setActionToast({
        type: "error",
        text: err.response?.data?.message || "Failed to cancel order.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm delivery handler
  const handleConfirmDeliver = async () => {
    if (!deliverModalOrder) return;
    setActionLoading(true);
    try {
      const res = await apiClient.patch(
        `/api/modasphere/orders/${deliverModalOrder._id}/deliver`
      );
      const updatedOrder = res.data?.data?.order;
      setOrders((prev) =>
        prev.map((o) =>
          o._id === deliverModalOrder._id
            ? { ...o, ...updatedOrder, status: "delivered" }
            : o
        )
      );
      setActionToast({
        type: "success",
        text: res.data?.message || "Order delivery confirmed.",
      });
      setDeliverModalOrder(null);
    } catch (err) {
      console.error("[Orders] Failed to deliver order:", err);
      setActionToast({
        type: "error",
        text: err.response?.data?.message || "Failed to confirm delivery.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Buy Again handler
  const handleBuyAgain = async (item) => {
    const idKey = item.productId?._id || item.productId;
    if (!addToCart) {
      navigate(`/businesses/modamart/product/${idKey}`);
      return;
    }
    try {
      const res = await addToCart(idKey, 1);
      if (res?.success) {
        setBuyAgainToast(`Added "${item.name}" to cart!`);
        setTimeout(() => setBuyAgainToast(""), 3000);
      } else {
        setBuyAgainToast(res?.message || "Could not add item to cart.");
        setTimeout(() => setBuyAgainToast(""), 3000);
      }
    } catch {
      setBuyAgainToast("Failed to add to cart.");
      setTimeout(() => setBuyAgainToast(""), 3000);
    }
  };

  // Tab counts & Filtering
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Tab filter
      if (activeTab === "active") {
        if (!["pending_payment", "paid", "shipped"].includes(order.status)) {
          return false;
        }
      } else if (activeTab === "delivered") {
        if (order.status !== "delivered") return false;
      } else if (activeTab === "cancelled") {
        if (order.status !== "cancelled") return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const code = `MS-${String(order._id).slice(-6).toUpperCase()}`.toLowerCase();
        const idMatch = String(order._id).toLowerCase().includes(query) || code.includes(query);
        const itemMatch = (order.items || []).some((item) =>
          (item.name || "").toLowerCase().includes(query)
        );
        if (!idMatch && !itemMatch) return false;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  const activeCount = orders.filter((o) =>
    ["pending_payment", "paid", "shipped"].includes(o.status)
  ).length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const cancelledCount = orders.filter((o) => o.status === "cancelled").length;

  if (authLoading || loading) {
    return (
      <main className="orders-page">
        <div className="orders-container" style={{ textAlign: "center", padding: "100px 0" }}>
          <Package size={44} style={{ color: "#b89552", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "20px", color: "#1e293b", margin: 0 }}>Loading your orders...</h2>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "8px" }}>Fetching latest purchase records</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="orders-page">
        <div className="orders-container">
          <section className="orders-empty-state">
            <ShieldCheck size={52} style={{ color: "#b89552", margin: "0 auto 16px" }} />
            <h2>Sign In to View Orders</h2>
            <p>Please log in to your account to review your ModaMart orders and delivery updates.</p>
            <button
              onClick={() => (openAuthModal ? openAuthModal("login") : navigate("/login"))}
              className="orders-empty-btn"
            >
              Sign In to ModaSphere
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="orders-page">
      <div className="orders-container">
        {/* Toast / Banner Messages */}
        {actionToast && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "13px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: actionToast.type === "success" ? "#f0fdf4" : "#fef2f2",
              color: actionToast.type === "success" ? "#166534" : "#991b1b",
              border: `1px solid ${actionToast.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            }}
          >
            <span>{actionToast.text}</span>
            <button
              onClick={() => setActionToast(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}

        {buyAgainToast && (
          <div
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "13px",
              fontWeight: 700,
              background: "#dcfce7",
              color: "#15803d",
              border: "1px solid #86efac",
            }}
          >
            ✓ {buyAgainToast}
          </div>
        )}

        {/* Page Header */}
        <div className="orders-header">
          <div>
            <p className="orders-label">MODAMART</p>
            <h1>My Orders</h1>
            <p>Track shipment progress, view purchase details, and manage your orders.</p>
          </div>

          <Link to="/businesses/modamart/shop" className="continue-shopping">
            <ShoppingBag size={17} />
            Continue Shopping
          </Link>
        </div>

        {/* Filter Tabs & Search */}
        {orders.length > 0 && (
          <div className="orders-toolbar">
            <div className="orders-tabs">
              <button
                className={`orders-tab-btn ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                All Orders <span className="tab-badge">{orders.length}</span>
              </button>
              <button
                className={`orders-tab-btn ${activeTab === "active" ? "active" : ""}`}
                onClick={() => setActiveTab("active")}
              >
                In Progress <span className="tab-badge">{activeCount}</span>
              </button>
              <button
                className={`orders-tab-btn ${activeTab === "delivered" ? "active" : ""}`}
                onClick={() => setActiveTab("delivered")}
              >
                Delivered <span className="tab-badge">{deliveredCount}</span>
              </button>
              <button
                className={`orders-tab-btn ${activeTab === "cancelled" ? "active" : ""}`}
                onClick={() => setActiveTab("cancelled")}
              >
                Cancelled <span className="tab-badge">{cancelledCount}</span>
              </button>
            </div>

            <div className="orders-search-box">
              <Search size={16} className="orders-search-icon" />
              <input
                type="text"
                placeholder="Search orders by item or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="orders-search-input"
              />
            </div>
          </div>
        )}

        {/* Orders List or Empty State */}
        {orders.length === 0 ? (
          <section className="orders-empty-state">
            <ShoppingBag size={48} />
            <h2>No Orders Yet</h2>
            <p>You haven't placed any ModaMart orders yet. Discover our curated designer catalog!</p>
            <Link to="/businesses/modamart/shop" className="orders-empty-btn">
              Start Shopping
            </Link>
          </section>
        ) : filteredOrders.length === 0 ? (
          <section className="orders-empty-state">
            <Package size={44} />
            <h2>No Matching Orders</h2>
            <p>No orders match your selected filters or search query.</p>
            <button
              onClick={() => {
                setActiveTab("all");
                setSearchQuery("");
              }}
              className="orders-empty-btn"
            >
              Clear Filters
            </button>
          </section>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order) => {
              const orderCode = `MS-${String(order._id || "").slice(-6).toUpperCase()}`;
              const items = Array.isArray(order.items) ? order.items : [];
              const customer = order.shippingAddress || {};
              const itemCount = items.reduce((sum, it) => sum + Number(it.quantity || 1), 0);
              const isCancellable = order.status === "pending_payment" || order.status === "paid";
              const isDeliverable = order.status === "shipped";

              return (
                <article className="order-card" key={order._id}>
                  {/* Card Top */}
                  <div className="order-top">
                    <div className="order-top-meta">
                      <div className="order-number-row">
                        <h2>Order #{orderCode}</h2>
                        <span className="order-date-text">
                          Placed on{" "}
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="order-badges-row">
                      <span className={`order-status-pill status-${order.status}`}>
                        {order.status === "pending_payment" && <Clock size={13} />}
                        {order.status === "paid" && <CheckCircle2 size={13} />}
                        {order.status === "shipped" && <Truck size={13} />}
                        {order.status === "delivered" && <CheckCircle2 size={13} />}
                        {order.status === "cancelled" && <XCircle size={13} />}
                        {order.status.replace("_", " ")}
                      </span>

                      {order.refundStatus && order.refundStatus !== "none" && (
                        <span className={`order-refund-pill refund-${order.refundStatus}`}>
                          Refund: {order.refundStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Products in this Order */}
                  <div className="order-card-items">
                    {items.map((item, idx) => {
                      const itemId = item.productId?._id || item.productId;
                      const thumb =
                        item.productId?.images?.[0]?.url ||
                        (typeof item.productId?.images?.[0] === "string" ? item.productId.images[0] : null) ||
                        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80";

                      return (
                        <div className="order-card-item" key={`${itemId || idx}-${idx}`}>
                          <div className="order-item-left">
                            <img
                              src={thumb}
                              alt={item.name}
                              className="order-thumbnail"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src =
                                  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80";
                              }}
                            />
                            <div className="order-item-texts">
                              <Link
                                to={`/businesses/modamart/product/${itemId}`}
                                className="order-item-title"
                              >
                                {item.name}
                              </Link>
                              <span className="order-item-specs">
                                Qty: {item.quantity} · {item.productId?.category || "Fashion"}
                              </span>
                            </div>
                          </div>

                          <div className="order-item-price-tag">
                            ₹{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString("en-IN")}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Bar */}
                  <div className="order-card-summary">
                    <div className="order-summary-metric">
                      <span>Total Items: </span>
                      <strong>{itemCount}</strong>
                    </div>

                    <div className="order-summary-metric">
                      <span>Delivery To: </span>
                      <strong>
                        {customer.city ? `${customer.city}, ${customer.state || ""}` : "Customer Address"}
                      </strong>
                    </div>

                    <div className="order-summary-metric">
                      <span>Order Total: </span>
                      <span className="order-total-amount">
                        ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="order-card-footer">
                    <div className="order-card-actions-left">
                      {isCancellable && (
                        <button
                          className="btn-card-cancel"
                          onClick={() => setCancelModalOrder(order)}
                        >
                          <XCircle size={14} />
                          Cancel
                        </button>
                      )}

                      {isDeliverable && (
                        <button
                          className="btn-card-deliver"
                          onClick={() => setDeliverModalOrder(order)}
                        >
                          <CheckCircle2 size={14} />
                          Confirm Received
                        </button>
                      )}
                    </div>

                    <div className="order-card-actions-right">
                      {(order.status === "shipped" || order.status === "delivered") && (
                        <Link
                          to={`/businesses/modamart/orders/${order._id}#tracking`}
                          className="btn-card-track"
                        >
                          <Truck size={14} />
                          Track Package
                        </Link>
                      )}

                      <Link
                        to={`/businesses/modamart/orders/${order._id}`}
                        className="btn-card-detail"
                      >
                        View Order Details
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Modal: Cancel Order Confirmation */}
        {cancelModalOrder && (
          <div
            className="modal-overlay"
            onClick={() => !actionLoading && setCancelModalOrder(null)}
          >
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <AlertTriangle size={24} style={{ color: "#dc2626" }} />
                <h3>Cancel Order #{`MS-${String(cancelModalOrder._id).slice(-6).toUpperCase()}`}?</h3>
              </div>

              <p className="modal-desc">
                Are you sure you want to cancel this order?
              </p>

              {cancelModalOrder.status === "paid" ? (
                <div className="modal-warning-box">
                  <strong>Refund Notification:</strong>
                  <br />
                  This order has already been paid (₹{Number(cancelModalOrder.totalAmount).toLocaleString("en-IN")}). Cancelling will immediately return inventory and initiate a full Razorpay refund to your payment source.
                </div>
              ) : (
                <div className="modal-warning-box">
                  This pending order has not been charged yet and will be cancelled immediately.
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="modal-btn-cancel"
                  onClick={() => setCancelModalOrder(null)}
                  disabled={actionLoading}
                >
                  Keep Order
                </button>
                <button
                  className="modal-btn-confirm-danger"
                  onClick={handleConfirmCancel}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Cancelling..." : "Yes, Cancel Order"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Confirm Delivery */}
        {deliverModalOrder && (
          <div
            className="modal-overlay"
            onClick={() => !actionLoading && setDeliverModalOrder(null)}
          >
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <CheckCircle2 size={24} style={{ color: "#16a34a" }} />
                <h3>Confirm Delivery Receipt</h3>
              </div>

              <p className="modal-desc">
                Please verify that you have received your order items in good condition.
              </p>

              <div className="modal-success-box">
                Confirming delivery will close this order as fulfilled and update tracking to delivered.
              </div>

              <div className="modal-actions">
                <button
                  className="modal-btn-cancel"
                  onClick={() => setDeliverModalOrder(null)}
                  disabled={actionLoading}
                >
                  Not Yet
                </button>
                <button
                  className="modal-btn-confirm-success"
                  onClick={handleConfirmDeliver}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Confirming..." : "Yes, Received"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}