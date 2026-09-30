import { useState } from "react";
import { Link } from "react-router-dom";
import products from "../data/products";
import {
  ArrowLeft,
  Package,
  ShoppingBag,
  Truck,
} from "lucide-react";
import "./Orders.css";

const ORDER_STEPS = [
  "Order Placed",
  "Processing",
  "Shipped",
  "Delivered",
];

function Orders() {
  const [orders] = useState(() => {
    try {
      const savedOrders = localStorage.getItem("modamartOrders");

      if (!savedOrders) {
        return [];
      }

      const parsedOrders = JSON.parse(savedOrders);

      return Array.isArray(parsedOrders) ? parsedOrders : [];
    } catch {
      return [];
    }
  });

  const getStatusStep = (status) => {
    const index = ORDER_STEPS.indexOf(status);

    return index >= 0 ? index : 0;
  };

  if (orders.length === 0) {
    return (
      <main className="orders-page">
        <div className="orders-container">
          <Link
            to="/businesses/modamart/shop"
            className="back-link"
          >
            <ArrowLeft size={18} />
            Continue Shopping
          </Link>

          <section className="orders-empty">
            <ShoppingBag size={48} />

            <h1>No Orders Yet</h1>

            <p>
              You haven't placed any ModaMart orders yet.
            </p>

            <Link
              to="/businesses/modamart/shop"
              className="shop-button"
            >
              Start Shopping
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="orders-page">
      <div className="orders-container">

        <div className="orders-header">
          <div>
            <p className="orders-label">MODAMART</p>

            <h1>My Orders</h1>

            <p>
              View your orders and track their delivery status.
            </p>
          </div>

          <Link
            to="/businesses/modamart/shop"
            className="continue-shopping"
          >
            <ShoppingBag size={18} />
            Continue Shopping
          </Link>
        </div>

        <div className="orders-list">
          {orders
            .slice()
            .reverse()
            .map((order, orderIndex) => {
              const orderNumber =
                order.orderNumber || `MS-${1001 + orderIndex}`;

              const status =
                order.status || "Order Placed";

              const items = Array.isArray(order.items)
                ? order.items
                : [];

              const customer = order.customer || {};

              const currentStep = getStatusStep(status);

              const itemCount = items.reduce(
                (total, item) =>
                  total + Number(item.quantity || 0),
                0
              );

              return (
                <article
                  className="order-card"
                  key={`${orderNumber}-${orderIndex}`}
                >
                  {/* ORDER HEADER */}

                  <div className="order-top">
                    <div>
                      <span className="order-small-label">
                        ORDER NUMBER
                      </span>

                      <h2>{orderNumber}</h2>
                    </div>

                    <div className="order-status">
                      <Package size={17} />
                      {status}
                    </div>
                  </div>

                  {/* ORDER INFORMATION */}

                  <div className="order-info">
                    <div>
                      <span>Items</span>

                      <strong>{itemCount}</strong>
                    </div>

                    <div>
                      <span>Total</span>

                      <strong>
                        ₹{Number(order.total || 0)}
                      </strong>
                    </div>

                    <div>
                      <span>Delivery</span>

                      <strong>
                        {customer.city || "—"}
                        {customer.state
                          ? `, ${customer.state}`
                          : ""}
                      </strong>
                    </div>
                  </div>

                  {/* TRACKING */}

                  <div className="tracking-section">
                    <div className="tracking-heading">
                      <div>
                        <span className="order-small-label">
                          ORDER TRACKING
                        </span>

                        <h3>Delivery Progress</h3>
                      </div>

                      <Truck size={22} />
                    </div>

                    <div className="tracking-steps">
                      {ORDER_STEPS.map((step, index) => (
                        <div
                          className={`tracking-step ${
                            index <= currentStep
                              ? "completed"
                              : ""
                          }`}
                          key={step}
                        >
                          <div className="tracking-dot">
                            {index + 1}
                          </div>

                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ORDER ITEMS */}

                  <div className="order-products">
                    <h3>Order Items</h3>

                    {items.length === 0 ? (
                      <p className="no-items">
                        No product information available.
                      </p>
                    ) : (
                      items.map((item, itemIndex) => (
                        <div
                          className="order-product"
                          key={`${item.id}-${itemIndex}`}
                        >
                          <img
  src={
    products.find(
      (product) => String(product.id) === String(item.id)
    )?.images?.[0] || ""
  }
  alt={item.name}
/>

                          <div className="order-product-info">
                            <h4>
                              {item.name || "Product"}
                            </h4>

                            <p>
                              {item.brand || "ModaMart"}
                              {" · "}
                              {item.category || "Fashion"}
                            </p>

                            <span>
                              Quantity:{" "}
                              {Number(item.quantity || 0)}
                            </span>
                          </div>

                          <strong>
                            ₹
                            {Number(item.price || 0) *
                              Number(item.quantity || 0)}
                          </strong>
                        </div>
                      ))
                    )}
                  </div>

                  {/* ORDER BOTTOM */}

                  <div className="order-bottom">
                    <div>
                      <span>Payment</span>

                      <strong>
                        Cash on Delivery
                      </strong>
                    </div>

                    <div>
                      <span>Order Total</span>

                      <strong>
                        ₹{Number(order.total || 0)}
                      </strong>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
      </div>
    </main>
  );
}

export default Orders;