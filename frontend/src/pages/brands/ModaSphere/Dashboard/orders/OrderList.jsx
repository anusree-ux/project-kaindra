import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Loader2, Package } from "lucide-react";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import { getSellerOrders } from "../services/dashboardApi";

const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getSellerOrders()
      .then((data) => {
        if (!isMounted) return;
        const mapped = (data || []).map((order) => {
          const id = order._id || order.id;
          const displayId = id ? (id.length > 8 ? `ORD-${id.slice(-6).toUpperCase()}` : id) : "ORD-N/A";
          const customerName =
            order.buyerId?.name ||
            order.shippingAddress?.fullName ||
            order.customer ||
            "Customer";
          const dateStr = order.createdAt
            ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Recent";
          const amount = order.sellerSubtotal ?? order.totalAmount ?? order.total ?? 0;
          const formattedTotal = typeof amount === "number"
            ? `₹${amount.toLocaleString("en-IN")}`
            : amount;

          return {
            id: displayId,
            rawId: id,
            customer: customerName,
            date: dateStr,
            total: formattedTotal,
            status: order.status || "processing",
          };
        });
        setOrders(mapped);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load seller orders:", err);
        setError(err.message || "Could not fetch orders.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const columns = [
    { key: "id", label: "Order" },
    { key: "customer", label: "Customer" },
    { key: "date", label: "Date" },
    { key: "total", label: "Total" },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <StatusBadge status={value} />
      ),
    },
    {
      key: "view",
      label: "",
      render: (_, order) => (
        <button
          className="dashboard-icon-button"
          onClick={() =>
            navigate(
              `/businesses/modasphere/dashboard/orders/${order.rawId || order.id}`
            )
          }
          title="View order"
        >
          <Eye size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <h1>Orders</h1>
          <p>
            Track customer orders and fulfilment.
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #ef4444",
            color: "#b91c1c",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 20,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <div className="dashboard-card">
        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#666" }}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ marginTop: 10, fontSize: 14 }}>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#666" }}>
            <Package size={36} style={{ color: "#9ca3af", marginBottom: 12 }} />
            <p style={{ fontWeight: 500, fontSize: 16, margin: 0 }}>No orders yet</p>
            <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
              Customer orders placed for your products will appear here.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={orders}
          />
        )}
      </div>
    </div>
  );
};

export default OrderList;