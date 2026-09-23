import { useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import "./Cart.css";

function Cart() {
  const [cart, setCart] = useState(() => {
    return JSON.parse(localStorage.getItem("modamartCart") || "[]");
  });

  const getItemId = (item) => String(item._id || item.id);

  const updateCart = (id, change) => {
    const updatedCart = cart.map((item) =>
      getItemId(item) === String(id)
        ? {
            ...item,
            quantity: Math.max(1, item.quantity + change),
          }
        : item
    );

    setCart(updatedCart);
    localStorage.setItem("modamartCart", JSON.stringify(updatedCart));
  };

  const removeItem = (id) => {
    const updatedCart = cart.filter(
      (item) => getItemId(item) !== String(id)
    );

    setCart(updatedCart);
    localStorage.setItem("modamartCart", JSON.stringify(updatedCart));
  };

  const subtotal = cart.reduce(
    (total, item) => total + (item.price || 0) * (item.quantity || 1),
    0
  );

  const delivery = subtotal > 0 ? 99 : 0;
  const total = subtotal + delivery;

  if (cart.length === 0) {
    return (
      <main className="cart-page">
        <div className="cart-empty">
          <ShoppingBag size={48} />
          <h1>Your Cart is Empty</h1>
          <p>Add some products from ModaMart to continue shopping.</p>
          <Link
            to="/businesses/modamart/shop"
            className="continue-shopping"
          >
            <ArrowLeft size={18} />
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <div className="cart-container">
        <Link
          to="/businesses/modamart/shop"
          className="cart-back-link"
        >
          <ArrowLeft size={18} />
          Continue Shopping
        </Link>

        <div className="cart-heading">
          <div>
            <span>MODAMART</span>
            <h1>Your Cart</h1>
          </div>

          <p>
            {cart.length} {cart.length === 1 ? "item" : "items"}
          </p>
        </div>

        <div className="cart-layout">
          {/* Cart Items */}
          <section className="cart-items">
            {cart.map((item) => {
              const itemId = getItemId(item);
              const imageUrl =
                item.image ||
                item.images?.[0]?.url ||
                (typeof item.images?.[0] === "string"
                  ? item.images[0]
                  : "") ||
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80";

              return (
                <article className="cart-item" key={itemId}>
                  <div className="cart-item-image">
                    <img
                      src={imageUrl}
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                  </div>

                  <div className="cart-item-info">
                    <span style={{ textTransform: "capitalize" }}>{item.category}</span>

                    <h2>{item.name}</h2>

                    <p>by {item.brand || "ModaSphere"}</p>

                    <strong>
                      ₹{item.price?.toLocaleString("en-IN")}
                    </strong>

                    <div className="cart-item-actions">
                      <div className="cart-quantity">
                        <button
                          type="button"
                          onClick={() => updateCart(itemId, -1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={15} />
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          type="button"
                          onClick={() => updateCart(itemId, 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => removeItem(itemId)}
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="cart-item-total">
                    ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                  </div>
                </article>
              );
            })}
          </section>

          {/* Summary */}
          <aside className="cart-summary">
            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal</span>
              <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
            </div>

            <div className="summary-row">
              <span>Delivery</span>
              <strong>₹{delivery.toLocaleString("en-IN")}</strong>
            </div>

            <div className="summary-divider" />

            <div className="summary-total">
              <span>Total</span>
              <strong>₹{total.toLocaleString("en-IN")}</strong>
            </div>

            <Link
              to="/businesses/modamart/checkout"
              className="checkout-button"
            >
              Proceed to Checkout
            </Link>

            <p className="secure-text">
              Secure checkout powered by ModaSphere
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default Cart;