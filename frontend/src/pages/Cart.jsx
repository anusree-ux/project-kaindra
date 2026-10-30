import { useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./Cart.css";

function Cart() {
  const {
    cart,
    subtotal,
    loading,
    error,
    unavailableItemsRemoved,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const [confirmClear, setConfirmClear] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const handleUpdateQuantity = async (productId, newQuantity, currentStock) => {
    if (newQuantity < 1) return;
    if (currentStock !== undefined && newQuantity > currentStock) return;

    setUpdatingId(productId);
    await updateQuantity(productId, newQuantity);
    setUpdatingId(null);
  };

  const handleRemoveItem = async (productId) => {
    setUpdatingId(productId);
    await removeFromCart(productId);
    setUpdatingId(null);
  };

  const handleClearCart = async () => {
    await clearCart();
    setConfirmClear(false);
  };

  if (loading && cart.length === 0) {
    return (
      <main className="cart-page">
        <div className="cart-container" style={{ textAlign: "center", padding: "100px 0" }}>
          <Loader2 size={40} className="animate-spin" style={{ margin: "0 auto 16px", color: "#b89552" }} />
          <p style={{ color: "#777" }}>Loading your cart...</p>
        </div>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="cart-page">
        <div className="cart-empty">
          <ShoppingBag size={48} />
          <h1>Your Cart is Empty</h1>
          <p>Add some products from ModaMart to continue shopping.</p>
          <Link to="/businesses/modamart/shop" className="continue-shopping">
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <Link to="/businesses/modamart/shop" className="cart-back-link">
            <ArrowLeft size={18} />
            Continue Shopping
          </Link>

          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              style={{
                background: "transparent",
                border: "1px solid #fee2e2",
                color: "#dc2626",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Clear Cart
            </button>
          ) : (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "#666" }}>Clear all items?</span>
              <button
                type="button"
                onClick={handleClearCart}
                style={{
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Yes, Clear
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                style={{
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {unavailableItemsRemoved && (
          <div
            style={{
              background: "#fffbe6",
              border: "1px solid #ffe58f",
              padding: "14px 18px",
              borderRadius: "8px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "#8c6b00",
              fontSize: "14px",
            }}
          >
            <AlertCircle size={20} />
            <span>Some items in your cart are no longer available and were automatically removed.</span>
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              padding: "14px 18px",
              borderRadius: "8px",
              marginBottom: "24px",
              color: "#dc2626",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

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
              const product = item.product || {};
              const productId = product._id || product.id;
              const name = product.name || "Product";
              const price = product.price || 0;
              const stock = product.stock !== undefined ? product.stock : 999;
              const category = product.category || "";
              const brand = product.sellerId?.name || "ModaSphere";
              const imageUrl =
                product.images?.[0]?.url ||
                (typeof product.images?.[0] === "string" ? product.images[0] : "") ||
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80";

              const lineTotal = price * item.quantity;
              const isAtMaxStock = item.quantity >= stock;
              const isBusy = updatingId === productId;

              return (
                <article className="cart-item" key={productId}>
                  <div className="cart-item-image">
                    <img
                      src={imageUrl}
                      alt={name}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                  </div>

                  <div className="cart-item-info">
                    <span style={{ textTransform: "capitalize" }}>{category}</span>

                    <h2>{name}</h2>

                    <p>by {brand}</p>

                    <strong>₹{price.toLocaleString("en-IN")}</strong>

                    {stock <= 5 && (
                      <p style={{ fontSize: "12px", color: "#d97706", marginTop: "4px" }}>
                        Only {stock} available in stock
                      </p>
                    )}

                    <div className="cart-item-actions">
                      <div className="cart-quantity">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(productId, item.quantity - 1, stock)}
                          aria-label="Decrease quantity"
                          disabled={item.quantity <= 1 || isBusy}
                        >
                          <Minus size={15} />
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(productId, item.quantity + 1, stock)}
                          aria-label="Increase quantity"
                          disabled={isAtMaxStock || isBusy}
                          title={isAtMaxStock ? `Maximum available stock (${stock}) reached` : ""}
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => handleRemoveItem(productId)}
                        disabled={isBusy}
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="cart-item-total">
                    ₹{lineTotal.toLocaleString("en-IN")}
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

            <p style={{ fontSize: "12px", color: "#888", marginBottom: "16px" }}>
              Taxes, discounts, and shipping costs are calculated during checkout.
            </p>

            <div className="summary-divider" />

            <div className="summary-total">
              <span>Subtotal Amount</span>
              <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
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