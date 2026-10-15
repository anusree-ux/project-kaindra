import { useEffect, useState, useCallback, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Printer,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  MapPin,
  CreditCard,
  Calendar,
  ChevronRight,
  Info,
} from "lucide-react";
import apiClient from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./OrderDetail.css";

const STATUS_STEPS = [
  { key: "placed", label: "Order Placed" },
  { key: "paid", label: "Payment Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const { isAuthenticated, loading: authLoading, openAuthModal } = useAuth();
  const { addToCart } = useCart();

  const [order, setOrder] = useState(null);
  const [shipment, setShipment] = useState(null);
  const [refundData, setRefundData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals & feedback
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [buyAgainLoading, setBuyAgainLoading] = useState({});
  const [buyAgainFeedback, setBuyAgainFeedback] = useState("");

  // Fetch Order, Shipment, and Refund info
  const fetchAllOrderData = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError("");

    try {
      // 1. Fetch Order
      const res = await apiClient.get(`/api/modasphere/orders/${orderId}`);
      const orderPayload = res.data?.data?.order;
      setOrder(orderPayload);

      // 2. Fetch Shipment (may return 404 if not yet dispatched)
      try {
        const shipRes = await apiClient.get(`/api/modasphere/shipments/${orderId}`);
        setShipment(shipRes.data?.data?.shipment || null);
      } catch {
        setShipment(null); // normal if order not yet shipped
      }

      // 3. Fetch Refund status if cancelled or refundStatus exists
      if (orderPayload?.refundStatus && orderPayload.refundStatus !== "none") {
        try {
          const refundRes = await apiClient.get(`/api/modasphere/orders/${orderId}/refund-status`);
          setRefundData(refundRes.data?.data || null);
        } catch {
          // ignore if unauthorized or unavailable
        }
      }
    } catch (err) {
      console.error("[OrderDetail] Failed to fetch order:", err);
      setError(err.response?.data?.message || "Failed to load order details.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        setLoading(false);
      } else {
        fetchAllOrderData();
      }
    }
  }, [authLoading, isAuthenticated, fetchAllOrderData]);

  // Copy helper
  const handleCopy = (text, type) => {
    navigator.clipboard?.writeText(text);
    if (type === "id") {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    }
  };

  // Cancel Order action
  const handleCancelOrder = async () => {
    setActionLoading(true);
    try {
      const res = await apiClient.patch(`/api/modasphere/orders/${orderId}/cancel`);
      const updated = res.data?.data?.order || { ...order, status: "cancelled" };
      setOrder((prev) => ({ ...prev, ...updated }));
      setShowCancelModal(false);
      setActionMessage({
        type: "success",
        text: res.data?.message || "Order cancelled successfully.",
      });

      // Refresh refund status if available
      try {
        const refundRes = await apiClient.get(`/api/modasphere/orders/${orderId}/refund-status`);
        setRefundData(refundRes.data?.data || null);
      } catch {
        // Refund status is optional; cancellation has already succeeded.
      }
    } catch (err) {
      console.error("[OrderDetail] Failed to cancel order:", err);
      setActionMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to cancel order. Please try again.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Delivery action
  const handleConfirmDelivery = async () => {
    setActionLoading(true);
    try {
      const res = await apiClient.patch(`/api/modasphere/orders/${orderId}/deliver`);
      const updated = res.data?.data?.order || { ...order, status: "delivered" };
      setOrder((prev) => ({ ...prev, ...updated }));
      if (res.data?.data?.shipment) {
        setShipment(res.data.data.shipment);
      }
      setShowDeliverModal(false);
      setActionMessage({
        type: "success",
        text: res.data?.message || "Delivery confirmed. Thank you!",
      });
    } catch (err) {
      console.error("[OrderDetail] Failed to confirm delivery:", err);
      setActionMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to confirm delivery. Please try again.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Refresh Refund Status
  const handleRefreshRefund = async () => {
    try {
      const refundRes = await apiClient.get(`/api/modasphere/orders/${orderId}/refund-status`);
      setRefundData(refundRes.data?.data || null);
      if (refundRes.data?.data?.refundStatus) {
        setOrder((prev) => ({ ...prev, refundStatus: refundRes.data.data.refundStatus }));
      }
    } catch (err) {
      console.error("Failed to refresh refund status:", err);
    }
  };

  // Buy Again handler
  const handleBuyAgain = async (item) => {
    if (!addToCart) {
      navigate(`/businesses/modamart/product/${item.productId}`);
      return;
    }
    const idKey = item.productId?._id || item.productId;
    setBuyAgainLoading((prev) => ({ ...prev, [idKey]: true }));
    try {
      const res = await addToCart(idKey, 1);
      if (res?.success) {
        setBuyAgainFeedback(`Added "${item.name}" to cart!`);
        setTimeout(() => setBuyAgainFeedback(""), 3000);
      } else {
        setBuyAgainFeedback(res?.message || "Unable to add item to cart.");
        setTimeout(() => setBuyAgainFeedback(""), 3000);
      }
    } catch {
      setBuyAgainFeedback("Failed to add to cart.");
      setTimeout(() => setBuyAgainFeedback(""), 3000);
    } finally {
      setBuyAgainLoading((prev) => ({ ...prev, [idKey]: false }));
    }
  };

  // Calculate current tracker step index
  const getProgressIndex = () => {
    if (!order) return 0;
    if (order.status === "cancelled") return -1;
    if (order.status === "delivered") return 4;

    const shipmentStatus = shipment?.status;
    if (shipmentStatus === "out_for_delivery") return 3;
    if (shipmentStatus === "in_transit" || shipmentStatus === "picked_up" || order.status === "shipped") return 2;
    if (order.status === "paid") return 1;
    return 0; // pending_payment
  };

  const progressIndex = getProgressIndex();

  if (authLoading || loading) {
    return (
      <main className="order-detail-page">
        <div className="order-detail-container" style={{ textAlign: "center", padding: "100px 0" }}>
          <Package size={44} style={{ color: "#b89552", margin: "0 auto 16px", animation: "bounce 1.5s infinite" }} />
          <h2 style={{ fontSize: "20px", color: "#1e293b", margin: 0 }}>Loading order details...</h2>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "8px" }}>Retrieving your order from ModaSphere</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="order-detail-page">
        <div className="order-detail-container" style={{ textAlign: "center", padding: "80px 20px" }}>
          <ShieldCheck size={50} style={{ color: "#b89552", margin: "0 auto 16px" }} />
          <h1 style={{ fontSize: "24px", color: "#0f172a" }}>Sign In to View Order</h1>
          <p style={{ color: "#64748b", margin: "8px 0 24px" }}>
            This order belongs to a secure ModaSphere account. Please sign in to verify your purchase.
          </p>
          <button
            onClick={() => (openAuthModal ? openAuthModal("login") : navigate("/login"))}
            style={{
              padding: "10px 24px",
              background: "#0f172a",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Sign In
          </button>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="order-detail-page">
        <div className="order-detail-container" style={{ textAlign: "center", padding: "80px 20px" }}>
          <AlertTriangle size={50} style={{ color: "#ef4444", margin: "0 auto 16px" }} />
          <h1 style={{ fontSize: "24px", color: "#0f172a" }}>Order Not Found</h1>
          <p style={{ color: "#64748b", margin: "8px 0 24px" }}>{error || "The requested order could not be located."}</p>
          <Link to="/businesses/modamart/orders" className="order-back-btn" style={{ display: "inline-flex" }}>
            <ArrowLeft size={16} /> Return to My Orders
          </Link>
        </div>
      </main>
    );
  }

  const orderFormattedCode = `MS-${String(order._id).slice(-6).toUpperCase()}`;
  const items = Array.isArray(order.items) ? order.items : [];
  const shipping = order.shippingAddress || {};
  const isCancellable = order.status === "pending_payment" || order.status === "paid";
  const isDeliverable = order.status === "shipped";
  const effectiveRefundStatus = refundData?.refundStatus || order.refundStatus || "none";

  return (
    <main className="order-detail-page">
      <div className="order-detail-container">
        {/* Navigation Bar */}
        <nav className="order-detail-nav">
          <Link to="/businesses/modamart/orders" className="order-back-btn">
            <ArrowLeft size={16} />
            Back to My Orders
          </Link>

          <div className="order-nav-actions">
            {buyAgainFeedback && (
              <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 700 }}>
                ✓ {buyAgainFeedback}
              </span>
            )}
            <button className="order-print-btn" onClick={() => window.print()} title="Print Order Receipt">
              <Printer size={15} />
              Print Invoice
            </button>
          </div>
        </nav>

        {/* Action message banner */}
        {actionMessage && (
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
              background: actionMessage.type === "success" ? "#f0fdf4" : "#fef2f2",
              color: actionMessage.type === "success" ? "#166534" : "#991b1b",
              border: `1px solid ${actionMessage.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            }}
          >
            <span>{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Header Card */}
        <section className="order-detail-header-card">
          <div className="order-header-left">
            <span className="order-brand-label">MODAMART ORDER</span>
            <div className="order-header-title-row">
              <h1>Order #{orderFormattedCode}</h1>
              <button
                className="order-copy-id-btn"
                onClick={() => handleCopy(order._id, "id")}
                title="Copy Full Mongo ID"
              >
                {copiedId ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                {copiedId ? "Copied" : order._id}
              </button>
            </div>
            <p className="order-header-date">
              Placed on{" "}
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                weekday: "short",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="order-header-actions">
            {/* Status Pill */}
            <span className={`status-pill status-${order.status}`}>
              {order.status === "pending_payment" && <Clock size={14} />}
              {order.status === "paid" && <CheckCircle2 size={14} />}
              {order.status === "shipped" && <Truck size={14} />}
              {order.status === "delivered" && <CheckCircle2 size={14} />}
              {order.status === "cancelled" && <XCircle size={14} />}
              {order.status.replace("_", " ")}
            </span>

            {/* Refund Pill if applicable */}
            {effectiveRefundStatus !== "none" && (
              <span className={`refund-pill refund-${effectiveRefundStatus}`}>
                Refund: {effectiveRefundStatus}
              </span>
            )}

            {/* Cancel Action Button */}
            {isCancellable && (
              <button
                className="order-btn-cancel"
                onClick={() => setShowCancelModal(true)}
                disabled={actionLoading}
              >
                <XCircle size={15} />
                Cancel Order
              </button>
            )}

            {/* Deliver Action Button */}
            {isDeliverable && (
              <button
                className="order-btn-deliver"
                onClick={() => setShowDeliverModal(true)}
                disabled={actionLoading}
              >
                <CheckCircle2 size={15} />
                Confirm Received
              </button>
            )}
          </div>
        </section>

        {/* Progress Tracker Card (if not cancelled) */}
        {order.status !== "cancelled" ? (
          <section className="order-tracker-card" id="tracking">
            <h2 className="order-tracker-title">
              <Truck size={18} style={{ color: "#b89552" }} />
              Fulfillment & Delivery Progress
            </h2>
            <div className="order-steps-container">
              {STATUS_STEPS.map((step, idx) => {
                const isCompleted = idx < progressIndex;
                const isActive = idx === progressIndex;
                return (
                  <div
                    key={step.key}
                    className={`order-step-item ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}
                  >
                    <div className="order-step-circle">
                      {isCompleted ? <Check size={18} /> : idx + 1}
                    </div>
                    <span className="order-step-label">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="order-cancelled-banner">
            <XCircle size={24} />
            <div>
              <h3>This order was cancelled</h3>
              <p>
                {order.refundStatus === "processed"
                  ? `Your refund of ₹${Number(order.refundAmount || order.totalAmount).toLocaleString("en-IN")} has been processed to your original payment method.`
                  : order.refundStatus === "pending"
                  ? `Your refund of ₹${Number(order.totalAmount).toLocaleString("en-IN")} is currently pending with Razorpay and will reflect shortly.`
                  : "This order has been cancelled and inventory was returned."}
              </p>
            </div>
          </section>
        )}

        {/* Main Grid: Left Items & Shipment, Right Summary & Address */}
        <div className="order-detail-grid">
          {/* LEFT COLUMN */}
          <div className="order-detail-main">
            {/* Ordered Items Card */}
            <section className="detail-card">
              <div className="detail-card-header">
                <h2>
                  <ShoppingBag size={18} style={{ color: "#b89552" }} />
                  Items in this Order ({items.length})
                </h2>
              </div>

              <div className="order-items-list">
                {items.map((item, index) => {
                  const itemId = item.productId?._id || item.productId;
                  const itemImg =
                    item.productId?.images?.[0]?.url ||
                    (typeof item.productId?.images?.[0] === "string" ? item.productId.images[0] : null) ||
                    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80";

                  return (
                    <article className="order-item-row" key={`${itemId || index}-${index}`}>
                      <div className="order-item-main">
                        <img
                          src={itemImg}
                          alt={item.name}
                          className="order-item-image"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80";
                          }}
                        />
                        <div className="order-item-meta">
                          <Link
                            to={`/businesses/modamart/product/${itemId}`}
                            className="order-item-name"
                          >
                            {item.name}
                          </Link>
                          <span className="order-item-sub">
                            Category: {item.productId?.category || "Apparel"} · Qty: {item.quantity}
                          </span>
                          <span className="order-item-sub">
                            Unit Price: ₹{Number(item.price || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      <div className="order-item-price-col">
                        <span className="order-item-line-total">
                          ₹{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString("en-IN")}
                        </span>
                        <button
                          className="order-item-buy-again"
                          onClick={() => handleBuyAgain(item)}
                          disabled={buyAgainLoading[itemId]}
                          title="Add this item back to your cart"
                        >
                          <RotateCcw size={12} />
                          {buyAgainLoading[itemId] ? "Adding..." : "Buy Again"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Shipment Tracking Timeline Card (if shipment exists) */}
            {shipment && (
              <section className="detail-card">
                <div className="detail-card-header">
                  <h2>
                    <Truck size={18} style={{ color: "#b89552" }} />
                    Shipment & Logistics Tracking
                  </h2>
                </div>

                <div className="shipment-overview-grid">
                  <div className="shipment-stat-item">
                    <span className="shipment-stat-label">Courier Carrier</span>
                    <span className="shipment-stat-val">{shipment.carrier || "Standard Courier"}</span>
                  </div>
                  <div className="shipment-stat-item">
                    <span className="shipment-stat-label">Tracking Number</span>
                    <span
                      className="shipment-stat-val"
                      style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      onClick={() => handleCopy(shipment.trackingNumber, "track")}
                      title="Click to copy tracking number"
                    >
                      {shipment.trackingNumber || "—"}
                      {copiedTracking ? <Check size={12} color="#16a34a" /> : <Copy size={12} color="#64748b" />}
                    </span>
                  </div>
                  <div className="shipment-stat-item">
                    <span className="shipment-stat-label">Estimated Delivery</span>
                    <span className="shipment-stat-val">
                      {shipment.estimatedDeliveryDate
                        ? new Date(shipment.estimatedDeliveryDate).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Within 3-5 Business Days"}
                    </span>
                  </div>
                </div>

                {Array.isArray(shipment.timeline) && shipment.timeline.length > 0 && (
                  <div className="shipment-timeline">
                    {shipment.timeline
                      .slice()
                      .reverse()
                      .map((event, idx) => (
                        <div
                          className={`shipment-event ${idx === 0 ? "latest" : ""}`}
                          key={event._id || idx}
                        >
                          <div className="shipment-event-dot"></div>
                          <span className="shipment-event-status">
                            {event.status ? event.status.replace(/_/g, " ") : "Update"}
                          </span>
                          {event.note && <span className="shipment-event-note">{event.note}</span>}
                          <span className="shipment-event-time">
                            {event.timestamp
                              ? new Date(event.timestamp).toLocaleString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Recently"}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="order-detail-side">
            {/* Price Breakdown Card */}
            <section className="detail-card">
              <div className="detail-card-header">
                <h2>
                  <CreditCard size={18} style={{ color: "#b89552" }} />
                  Payment Summary
                </h2>
              </div>

              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{Number(order.subtotalAmount || 0).toLocaleString("en-IN")}</span>
              </div>

              {Number(order.discountAmount) > 0 && (
                <div className="summary-row discount">
                  <span>Discount {order.discountCode ? `(${order.discountCode})` : ""}</span>
                  <span>-₹{Number(order.discountAmount).toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="summary-row">
                <span>Standard Delivery</span>
                <span style={{ color: "#16a34a", fontWeight: 700 }}>FREE</span>
              </div>

              <div className="summary-row total">
                <span>Total Amount</span>
                <span>₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}</span>
              </div>

              <div className="payment-meta-box">
                <div>
                  <strong>Payment Method:</strong> Razorpay Gateway
                </div>
                {order.razorpayPaymentId && (
                  <div>
                    <strong>Payment ID:</strong> {order.razorpayPaymentId}
                  </div>
                )}
                {order.razorpayOrderId && (
                  <div>
                    <strong>Razorpay Order:</strong> {order.razorpayOrderId}
                  </div>
                )}
              </div>
            </section>

            {/* Shipping Address Card */}
            <section className="detail-card">
              <div className="detail-card-header">
                <h2>
                  <MapPin size={18} style={{ color: "#b89552" }} />
                  Delivery Address
                </h2>
              </div>

              <div className="address-info-block">
                <strong>{shipping.name || "Valued Customer"}</strong>
                <span>{shipping.phone || "—"}</span>
                <span>{shipping.addressLine1}</span>
                {shipping.addressLine2 && <span>{shipping.addressLine2}</span>}
                <span>
                  {shipping.city ? `${shipping.city}, ` : ""}
                  {shipping.state ? `${shipping.state} ` : ""}
                  {shipping.pincode ? `- ${shipping.pincode}` : ""}
                </span>
              </div>
            </section>

            {/* Refund Status Card (if cancelled or refund initialized) */}
            {effectiveRefundStatus !== "none" && (
              <section className="detail-card">
                <div className="detail-card-header">
                  <h2>
                    <RotateCcw size={18} style={{ color: "#b89552" }} />
                    Refund Details
                  </h2>
                </div>

                <div className="refund-card-content">
                  <div className="refund-info-row">
                    <span>Refund Status:</span>
                    <strong style={{ textTransform: "capitalize", color: effectiveRefundStatus === "processed" ? "#16a34a" : "#ca8a04" }}>
                      {effectiveRefundStatus}
                    </strong>
                  </div>

                  {refundData?.refundAmount || order.refundAmount ? (
                    <div className="refund-info-row">
                      <span>Refund Amount:</span>
                      <strong>₹{Number(refundData?.refundAmount || order.refundAmount).toLocaleString("en-IN")}</strong>
                    </div>
                  ) : null}

                  {refundData?.refundId || order.refundId ? (
                    <div className="refund-info-row">
                      <span>Refund ID:</span>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>{refundData?.refundId || order.refundId}</span>
                    </div>
                  ) : null}

                  {refundData?.refundedAt || order.refundedAt ? (
                    <div className="refund-info-row">
                      <span>Processed At:</span>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>
                        {new Date(refundData?.refundedAt || order.refundedAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  ) : null}

                  <button className="refund-refresh-btn" onClick={handleRefreshRefund}>
                    <RotateCcw size={13} />
                    Check Live Refund Status
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="modal-overlay" onClick={() => !actionLoading && setShowCancelModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <AlertTriangle size={24} style={{ color: "#dc2626" }} />
                <h3>Cancel Order #{orderFormattedCode}?</h3>
              </div>

              <p className="modal-desc">
                Are you sure you want to cancel this order?
              </p>

              {order.status === "paid" ? (
                <div className="modal-warning-box">
                  <strong>Refund & Inventory Policy:</strong>
                  <br />
                  Since your payment of ₹{Number(order.totalAmount).toLocaleString("en-IN")} was received, cancelling will immediately return item inventory and initiate a 100% refund via Razorpay back to your original payment method.
                </div>
              ) : (
                <div className="modal-warning-box">
                  This pending order will be cancelled immediately without charging you.
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="modal-btn-cancel"
                  onClick={() => setShowCancelModal(false)}
                  disabled={actionLoading}
                >
                  Keep Order
                </button>
                <button
                  className="modal-btn-confirm-danger"
                  onClick={handleCancelOrder}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Cancelling..." : "Yes, Cancel Order"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deliver Confirmation Modal */}
        {showDeliverModal && (
          <div className="modal-overlay" onClick={() => !actionLoading && setShowDeliverModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <CheckCircle2 size={24} style={{ color: "#16a34a" }} />
                <h3>Confirm Order Receipt</h3>
              </div>

              <p className="modal-desc">
                Please verify that you have received all items in order #{orderFormattedCode} in good condition.
              </p>

              <div className="modal-success-box">
                Confirming delivery marks your ModaMart order complete and updates shipment tracking to delivered.
              </div>

              <div className="modal-actions">
                <button
                  className="modal-btn-cancel"
                  onClick={() => setShowDeliverModal(false)}
                  disabled={actionLoading}
                >
                  Not Yet
                </button>
                <button
                  className="modal-btn-confirm-success"
                  onClick={handleConfirmDelivery}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Confirming..." : "Yes, I Received It"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
