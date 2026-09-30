import { Link } from "react-router-dom";
import { ArrowLeft, Package, ShoppingBag } from "lucide-react";
import { useState } from "react";
import "./ModaDropOrders.css";

function ModaDropOrders() {
  const [orders] = useState(() => {
    return JSON.parse(
      localStorage.getItem("modadropOrders") || "[]"
    );
  });

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