import { useState } from "react";
import {
  ArrowLeft,
  Truck,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import StatusBadge from "../components/StatusBadge";
import ShipOrderModal from "./ShipOrderModal";
import ShipmentTimeline from "./ShipmentTimeline";

const OrderDetail = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const [shipModal, setShipModal] =
    useState(false);

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
            {orderId}
          </h1>

          <p>Order details and shipment information.</p>
        </div>

        <button
          className="dashboard-btn dashboard-btn-primary"
          onClick={() => setShipModal(true)}
        >
          <Truck size={16} />
          Ship order
        </button>
      </div>

      <div className="dashboard-two-column">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>Order summary</h2>
            <StatusBadge status="processing" />
          </div>

          <div className="dashboard-card-body">
            <p>Classic Linen Shirt × 2</p>
            <p>Essential Hoodie × 1</p>

            <hr
              style={{
                border: 0,
                borderTop: "1px solid #eee",
              }}
            />

            <strong>Total: ₹8,297</strong>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>Customer</h2>
          </div>

          <div className="dashboard-card-body">
            <strong>Aarav Sharma</strong>
            <p style={{ color: "#777" }}>
              aarav@example.com
            </p>
            <p style={{ color: "#777" }}>
              New Delhi, India
            </p>
          </div>
        </div>
      </div>

      <ShipmentTimeline />

      <ShipOrderModal
        open={shipModal}
        onClose={() => setShipModal(false)}
      />
    </div>
  );
};

export default OrderDetail;