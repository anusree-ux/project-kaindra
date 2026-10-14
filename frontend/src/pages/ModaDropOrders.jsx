import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Package, ShoppingBag, Loader2 } from "lucide-react";
import apiClient from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import "./ModaDropOrders.css";

function ModaDropOrders() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState(() => {
    return JSON.parse(
      localStorage.getItem("modadropOrders") || "[]"
    );
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchDropOrders = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/api/modasphere/orders/me");
        const backendOrders = res.data?.data?.orders || [];

        // Map backend orders into drop order card format
        const formattedBackendOrders = backendOrders.flatMap((order) => {
          return (order.items || []).map((item, idx) => ({
            orderNumber: `${order._id?.slice(-8).toUpperCase() || "ORD"}-${idx + 1}`,
            status: order.orderStatus || "Confirmed",
            dropName: item.productId?.title || item.title || "ModaDrop Release",
            category: item.productId?.category || "Limited Edition",
            quantity: item.quantity || 1,
            total: item.price * (item.quantity || 1) || order.totalAmount,
            image:
              item.productId?.images?.[0]?.url ||
              (typeof item.productId?.images?.[0] === "string" ? item.productId.images[0] : "") ||
              "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80",
            description: item.productId?.description || "Exclusive limited pre-order collection piece.",
            availability: order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString() : "To be announced",
          }));
        });

        if (formattedBackendOrders.length > 0) {
          // Merge with any local mock pre-orders avoiding duplicates
          setOrders((local) => {
            const combined = [...formattedBackendOrders, ...local];
            const seen = new Set();
            return combined.filter((o) => {
              const key = o.orderNumber || o.dropName;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          });
        }
      } catch (err) {
        console.error("Unable to load drop orders from backend:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDropOrders();
  }, [isAuthenticated]);

  return (
    <main className="modadrop-orders-page">
      <div className="modadrop-orders-container">

        <Link
          to="/businesses/modadrop"
          className="modadrop-orders-back"
        >
          <ArrowLeft size={17} />
          Back to ModaDrop
        </Link>

        <header className="modadrop-orders-header">
          <span>MODADROP</span>
          <h1>My Pre-orders</h1>
          <p>
            Track your ModaDrop pre-orders and upcoming
            fashion drops.
          </p>
        </header>

        {orders.length === 0 ? (
          <section className="modadrop-orders-empty">
            <Package size={45} strokeWidth={1.5} />

            <h2>No pre-orders yet</h2>

            <p>
              You haven't placed any ModaDrop pre-orders yet.
            </p>

            <Link
              to="/businesses/modadrop"
              className="modadrop-orders-shop-button"
            >
              Explore Drops
              <ShoppingBag size={17} />
            </Link>
          </section>
        ) : (
          <section className="modadrop-orders-list">
            {orders.map((order) => (
              <article
                className="modadrop-order-card"
                key={order.orderNumber}
              >

                <div className="modadrop-order-top">
                  <div>
                    <span className="modadrop-order-label">
                      PRE-ORDER NUMBER
                    </span>

                    <h2>{order.orderNumber}</h2>
                  </div>

                  <span className="modadrop-order-status">
                    {order.status || "Pre-order Confirmed"}
                  </span>
                </div>

                <div className="modadrop-order-info">
                  <div>
                    <span>Drop</span>
                    <strong>{order.dropName}</strong>
                  </div>

                  <div>
                    <span>Category</span>
                    <strong>{order.category}</strong>
                  </div>

                  <div>
                    <span>Quantity</span>
                    <strong>{order.quantity}</strong>
                  </div>

                  <div>
                    <span>Total</span>
                    <strong>₹{order.total}</strong>
                  </div>
                </div>

                <div className="modadrop-order-product">

                  <div className="modadrop-order-product-image">
                    <img
                      src={order.image}
                      alt={order.dropName}
                    />
                  </div>

                  <div className="modadrop-order-product-info">
                    <h3>{order.dropName}</h3>

                    <p>
                      {order.description}
                    </p>

                    <span>
                      Quantity: {order.quantity}
                    </span>
                  </div>

                  <strong>
                    ₹{order.total}
                  </strong>

                </div>

                <div className="modadrop-order-footer">
                  <div>
                    <span>Expected Availability</span>

                    <strong>
                      {order.availability || "To be announced"}
                    </strong>
                  </div>

                  <div>
                    <span>Order Status</span>

                    <strong>
                      {order.status || "Pre-order Confirmed"}
                    </strong>
                  </div>
                </div>

              </article>
            ))}
          </section>
        )}

      </div>
    </main>
  );
}

export default ModaDropOrders;