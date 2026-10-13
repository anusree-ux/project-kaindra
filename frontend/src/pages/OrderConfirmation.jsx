import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle2, ShoppingBag, ArrowLeft, Loader2, MapPin, PackageCheck } from "lucide-react";
import apiClient from "../services/apiClient";
import "./OrderConfirmation.css";

function OrderConfirmation() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/api/modasphere/orders/${orderId}`);
        if (isMounted) {
          setOrder(response.data?.data?.order || null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load order confirmation:", err);
          setError(err.response?.data?.message || "Order not found.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (orderId) {
      fetchOrder();
    }
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <main className="order-confirmation-page">
        <div className="confirmation-container" style={{ textAlign: "center", padding: "100px 0" }}>
          <Loader2 size={42} className="animate-spin" style={{ margin: "0 auto 16px", color: "#b89552" }} />
          <p style={{ color: "#777", fontSize: "16px" }}>Loading order confirmation details...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="order-confirmation-page">
        <div className="confirmation-container" style={{ textAlign: "center", padding: "80px 20px" }}>
          <ShoppingBag size={50} style={{ margin: "0 auto 16px", color: "#dc2626" }} />
          <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>Order Details Unavailable</h1>
          <p style={{ color: "#666", marginBottom: "24px" }}>{error || "We couldn't retrieve the details for this order."}</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link to="/businesses/modamart/orders" className="confirm-btn primary">
              View My Orders
            </Link>
            <Link to="/businesses/modamart/shop" className="confirm-btn secondary">
              <ArrowLeft size={16} /> Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const shipping = order.shippingAddress || {};
  const items = order.items || [];
  const statusFormatted = (order.status || "pending").replace("_", " ").toUpperCase();

  return (
    <main className="order-confirmation-page">
      <div className="confirmation-container">
        <div className="confirmation-card">
          <div className="confirmation-header">
            <CheckCircle2 size={64} className="success-icon" />
            <span className="brand-badge">MODAMART CONFIRMED</span>
            <h1>Payment Successful!</h1>
            <p className="confirmation-sub">
              Thank you, <strong>{shipping.name || "Customer"}</strong>. Your order has been placed and confirmed.
            </p>
          </div>

          <div className="order-info-bar">
            <div>
              <span>Order Number</span>
              <strong>{order.orderNumber || order._id}</strong>
            </div>
            <div>
              <span>Order Status</span>
              <strong className={`status-badge status-${order.status}`}>{statusFormatted}</strong>
            </div>
            <div>
              <span>Total Paid</span>
              <strong>₹{(order.totalAmount || 0).toLocaleString("en-IN")}</strong>
            </div>
          </div>

          {/* ORDER ITEMS */}
          <section className="confirmation-section">
            <h2>
              <PackageCheck size={20} /> Ordered Items ({items.length})
            </h2>
            <div className="confirmation-items-list">
              {items.map((item, idx) => (
                <div className="confirmation-item-row" key={item._id || idx}>
                  <div className="item-details">
                    <strong>{item.name}</strong>
                    <span className="item-meta">Qty: {item.quantity} × ₹{(item.price || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <strong className="item-total">
                    ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                  </strong>
                </div>
              ))}
            </div>
          </section>

          {/* SHIPPING & BILLING SUMMARY */}
          <section className="confirmation-section grid-two">
            <div>
              <h2>
                <MapPin size={20} /> Shipping Address
              </h2>
              <div className="address-box">
                <p><strong>{shipping.name}</strong></p>
                <p>{shipping.phone}</p>
                <p>{shipping.addressLine1}</p>
                {shipping.addressLine2 && <p>{shipping.addressLine2}</p>}
                <p>{shipping.city}, {shipping.state} - {shipping.pincode}</p>
              </div>
            </div>

            <div>
              <h2>Payment Summary</h2>
              <div className="summary-box">
                <div className="sum-row">
                  <span>Subtotal:</span>
                  <span>₹{(order.subtotalAmount || 0).toLocaleString("en-IN")}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="sum-row discount">
                    <span>Discount ({order.discountCode}):</span>
                    <span>-₹{order.discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="sum-row">
                  <span>Shipping:</span>
                  <span>Free</span>
                </div>
                <div className="sum-row total">
                  <span>Total Amount Charged:</span>
                  <strong>₹{(order.totalAmount || 0).toLocaleString("en-IN")}</strong>
                </div>
              </div>
            </div>
          </section>

          {/* ACTIONS */}
          <div className="confirmation-actions">
            <Link to="/businesses/modamart/orders" className="confirm-btn primary">
              View My Orders
            </Link>
            <Link to="/businesses/modamart/shop" className="confirm-btn secondary">
              <ArrowLeft size={16} /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default OrderConfirmation;
