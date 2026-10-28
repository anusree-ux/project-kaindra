import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Truck,
  Loader2,
  PackageCheck,
  AlertCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import StatusBadge from "../components/StatusBadge";
import ShipOrderModal from "./ShipOrderModal";
import ShipmentTimeline from "./ShipmentTimeline";
import { getOrderById, shipOrder } from "../services/dashboardApi";

const OrderDetail = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shipModal, setShipModal] = useState(false);
  const [shipping, setShipping] = useState(false);
  const [shipError, setShipError] = useState(null);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrderById(orderId);
      setOrder(data);
    } catch (err) {
      console.error("Failed to load order:", err);
      setError(err.response?.data?.message || err.message || "Failed to load order details.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleShipOrder = async (shipData) => {
    setShipping(true);
    setShipError(null);
    try {
      await shipOrder(orderId, shipData);
      setShipModal(false);
      await fetchOrder();
    } catch (err) {
      console.error("Failed to ship order:", err);
      setShipError(err.response?.data?.message || err.message || "Failed to ship order.");
    } finally {
      setShipping(false);
    }
  };

  const displayId = orderId && orderId.length > 8 ? `ORD-${orderId.slice(-6).toUpperCase()}` : orderId;
  const items = order?.items || [];
  const total = order?.sellerSubtotal ?? order?.totalAmount ?? 0;
  const customer = order?.buyerId;
  const shippingAddress = order?.shippingAddress;

  if (loading) {
    return (
      <div className="dashboard-page">
        <div style={{ padding: "60px 0", textAlign: "center", color: "#666" }}>
          <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
          <p style={{ marginTop: 12 }}>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="dashboard-page">
        <button
          className="dashboard-btn dashboard-btn-secondary"
          onClick={() => navigate(-1)}
          style={{ marginBottom: 20 }}
        >
          <ArrowLeft size={16} />
          Back to Orders
        </button>
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #ef4444",
            color: "#b91c1c",
            borderRadius: 8,
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <AlertCircle size={20} />
          <div>{error}</div>
        </div>
      </div>
    );
  }

  const canShip = order?.status === "paid";

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <button
            className="dashboard-btn dashboard-btn-secondary"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} />
            Orders
          </button>

          <h1 style={{ marginTop: 18 }}>
            {displayId}
          </h1>

          <p>Order details and shipment information.</p>
        </div>

        {canShip && (
          <button
            className="dashboard-btn dashboard-btn-primary"
            onClick={() => setShipModal(true)}
          >
            <Truck size={16} />
            Ship order
          </button>
        )}
      </div>

      <div className="dashboard-two-column">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>Order summary</h2>
            <StatusBadge status={order?.status || "processing"} />
          </div>

          <div className="dashboard-card-body">
            {items.length === 0 ? (
              <p style={{ color: "#777" }}>No items recorded for this order.</p>
            ) : (
              items.map((item, idx) => (
                <div
                  key={item._id || item.productId?._id || idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: 8,
                    marginBottom: 8,
                    borderBottom: idx === items.length - 1 ? "none" : "1px dashed #eee",
                  }}
                >
                  <span>
                    {item.name || item.productId?.name || "Product"} × {item.quantity}
                  </span>
                  <strong>₹{((item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}</strong>
                </div>
              ))
            )}

            <hr
              style={{
                border: 0,
                borderTop: "1px solid #eee",
                margin: "12px 0",
              }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16 }}>
              <span>Total:</span>
              <strong>₹{total.toLocaleString("en-IN")}</strong>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>Customer</h2>
          </div>

          <div className="dashboard-card-body">
            <strong>{customer?.name || shippingAddress?.fullName || "Guest Customer"}</strong>
            {customer?.email && (
              <p style={{ color: "#777", margin: "4px 0" }}>
                {customer.email}
              </p>
            )}
            {customer?.phoneNumber && (
              <p style={{ color: "#777", margin: "4px 0" }}>
                {customer.phoneNumber}
              </p>
            )}
            {shippingAddress && (
              <p style={{ color: "#777", margin: "8px 0 0" }}>
                {[
                  shippingAddress.addressLine1,
                  shippingAddress.city,
                  shippingAddress.postalCode,
                  shippingAddress.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>
        </div>
      </div>

      <ShipmentTimeline order={order} shipment={order?.shipment} />

      <ShipOrderModal
        open={shipModal}
        loading={shipping}
        error={shipError}
        onShip={handleShipOrder}
        onClose={() => setShipModal(false)}
      />
    </div>
  );
};

export default OrderDetail;