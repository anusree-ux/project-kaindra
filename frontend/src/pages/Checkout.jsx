import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Lock, ShoppingBag } from "lucide-react";
import "./Checkout.css";

function Checkout() {
  const navigate = useNavigate();

  const [cart] = useState(() => {
    return JSON.parse(localStorage.getItem("modamartCart") || "[]");
  });

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const delivery = subtotal > 0 ? 99 : 0;
  const total = subtotal + delivery;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
  event.preventDefault();

  if (cart.length === 0) {
    return;
  }

  const existingOrders = JSON.parse(
    localStorage.getItem("modamartOrders") || "[]"
  );

  const newOrderNumber = `MS-${1001 + existingOrders.length}`;

  const newOrder = {
    orderNumber: newOrderNumber,
    customer: formData,
    items: cart,
    subtotal,
    delivery,
    total,
    status: "Order Placed",
  };

  localStorage.setItem(
    "modamartOrders",
    JSON.stringify([...existingOrders, newOrder])
  );

  localStorage.removeItem("modamartCart");

  setOrderNumber(newOrderNumber);
  setOrderPlaced(true);
};

  if (orderPlaced) {
    return (
      <main className="checkout-page">
        <div className="order-success">

          <CheckCircle
            size={70}
            className="success-icon"
          />

          <span className="success-label">
            MODAMART
          </span>

          <h1>Order Confirmed</h1>

          <p>
            Thank you, {formData.fullName}. Your order has
            been successfully placed.
          </p>

          <div className="order-number">
            <span>Order Number</span>
            <strong>{orderNumber}</strong>
          </div>

          <div className="success-details">
            <div>
              <span>Total Paid</span>
              <strong>
                ₹{total.toLocaleString("en-IN")}
              </strong>
            </div>

            <div>
              <span>Delivery To</span>
              <strong>
                {formData.city}, {formData.state}
              </strong>
            </div>
          </div>

          <div className="success-actions">
            <Link
              to="/businesses/modamart/shop"
              className="success-primary"
            >
              Continue Shopping
            </Link>
            
            <Link
  to="/businesses/modamart/orders"
  className="success-button secondary"
>
  View My Orders
</Link>
            <button
              type="button"
              className="success-secondary"
              onClick={() => navigate("/businesses")}
            >
              Back to Businesses
            </button>
          </div>

        </div>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="checkout-page">
        <div className="checkout-empty">

          <ShoppingBag size={50} />

          <h1>Your Cart is Empty</h1>

          <p>
            Add products to your cart before checking out.
          </p>

          <Link
            to="/businesses/modamart/shop"
            className="checkout-shop-link"
          >
            <ArrowLeft size={18} />
            Go to ModaMart
          </Link>

        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-container">

        <Link
          to="/businesses/modamart/cart"
          className="checkout-back"
        >
          <ArrowLeft size={18} />
          Back to Cart
        </Link>

        <div className="checkout-heading">
          <span>MODAMART</span>
          <h1>Checkout</h1>
        </div>

        <form
          className="checkout-layout"
          onSubmit={handleSubmit}
        >

          {/* Customer Details */}

          <div className="checkout-form">

            <section className="checkout-section">

              <div className="checkout-section-heading">
                <span>01</span>

                <div>
                  <h2>Contact Information</h2>
                  <p>
                    Enter your contact details for order updates.
                  </p>
                </div>
              </div>

              <div className="form-grid">

                <div className="form-field full-width">
                  <label htmlFor="fullName">
                    Full Name
                  </label>

                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="email">
                    Email Address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="phone">
                    Phone Number
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10 digit mobile number"
                    pattern="[0-9]{10}"
                    required
                  />
                </div>

              </div>

            </section>

            {/* Address */}

            <section className="checkout-section">

              <div className="checkout-section-heading">
                <span>02</span>

                <div>
                  <h2>Delivery Address</h2>
                  <p>
                    Where should we deliver your order?
                  </p>
                </div>
              </div>

              <div className="form-grid">

                <div className="form-field full-width">
                  <label htmlFor="address">
                    Address
                  </label>

                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="House number, street, area"
                    rows="4"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="city">
                    City
                  </label>

                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="state">
                    State
                  </label>

                  <input
                    id="state"
                    name="state"
                    type="text"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="pincode">
                    Pincode
                  </label>

                  <input
                    id="pincode"
                    name="pincode"
                    type="text"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="6 digit pincode"
                    pattern="[0-9]{6}"
                    required
                  />
                </div>

              </div>

            </section>

            {/* Payment */}

            <section className="checkout-section">

              <div className="checkout-section-heading">
                <span>03</span>

                <div>
                  <h2>Payment</h2>
                  <p>
                    Select your preferred payment method.
                  </p>
                </div>
              </div>

              <div className="payment-option">
                <input
                  type="radio"
                  id="cod"
                  name="payment"
                  value="cod"
                  defaultChecked
                />

                <label htmlFor="cod">
                  <strong>Cash on Delivery</strong>
                  <span>
                    Pay when your order arrives.
                  </span>
                </label>
              </div>

              <div className="payment-option disabled">
                <input
                  type="radio"
                  id="online"
                  name="payment"
                  value="online"
                  disabled
                />

                <label htmlFor="online">
                  <strong>Online Payment</strong>
                  <span>
                    Coming soon
                  </span>
                </label>
              </div>

            </section>

          </div>

          {/* Summary */}

          <aside className="checkout-summary">

            <h2>Order Summary</h2>

            <div className="summary-products">

              {cart.map((item) => {
                const itemId = String(item._id || item.id);
                const imageUrl =
                  item.image ||
                  item.images?.[0]?.url ||
                  (typeof item.images?.[0] === "string"
                    ? item.images[0]
                    : "") ||
                  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80";

                return (
                  <div
                    className="summary-product"
                    key={itemId}
                  >
                    <div className="checkout-product-image">
                      <img
                        src={imageUrl}
                        alt={item.name}
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80";
                        }}
                      />
                    </div>

                    <div>
                      <strong>{item.name}</strong>
                      <span>
                        Qty: {item.quantity}
                      </span>
                    </div>

                    <strong>
                      ₹{(
                        (item.price || 0) * (item.quantity || 1)
                      ).toLocaleString("en-IN")}
                    </strong>
                  </div>
                );
              })}

            </div>

            <div className="checkout-summary-divider" />

            <div className="checkout-summary-row">
              <span>Subtotal</span>
              <strong>
                ₹{subtotal.toLocaleString("en-IN")}
              </strong>
            </div>

            <div className="checkout-summary-row">
              <span>Delivery</span>
              <strong>
                ₹{delivery.toLocaleString("en-IN")}
              </strong>
            </div>

            <div className="checkout-summary-divider" />

            <div className="checkout-total">
              <span>Total</span>
              <strong>
                ₹{total.toLocaleString("en-IN")}
              </strong>
            </div>

            <button
              type="submit"
              className="place-order-button"
            >
              Place Order
            </button>

            <div className="checkout-security">
              <Lock size={15} />
              <span>
                Your information is securely stored.
              </span>
            </div>

          </aside>

        </form>

      </div>
    </main>
  );
}

export default Checkout;