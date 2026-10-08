import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Lock, ShoppingBag } from "lucide-react";
import apiClient from "../services/apiClient";
import { useCart } from "../context/CartContext";
import "./Checkout.css";

function Checkout() {
  const navigate = useNavigate();
  const { fetchCart: refetchCartContext } = useCart();

  const [cart, setCart] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await apiClient.get("/api/modasphere/cart");
        const backendItems = response.data?.data?.cart?.items || [];

        // Convert backend cart structure to the format Checkout already uses
        const formattedItems = backendItems.map((item) => ({
          _id: item.product._id,
          id: item.product._id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          category: item.product.category,
          brand: item.product.sellerId?.name || "ModaSphere",
          image: item.product.images?.[0]?.url || "",
          images: item.product.images || [],
        }));

        setCart(formattedItems);
      } catch (error) {
        console.error("Failed to load checkout cart:", error);
      } finally {
        setCartLoading(false);
      }
    };

    fetchCart();
  }, []);

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState("");

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

  const delivery = 0;
  const discountAmount = discount?.discountAmount || 0;
  const total = Math.max(subtotal - discountAmount + delivery, 0);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError("Please enter a discount code.");
      return;
    }

    setDiscountLoading(true);
    setDiscountError("");
    setDiscount(null);

    try {
      const response = await apiClient.post(
        "/api/modasphere/discount-codes/validate",
        {
          code: discountCode.trim(),
          orderAmount: subtotal,
        }
      );

      setDiscount(response.data?.data);
    } catch (error) {
      setDiscountError(
        error.response?.data?.message || error.message || "Invalid discount code."
      );
    } finally {
      setDiscountLoading(false);
    }
  };

  // Create the order through the backend/MongoDB
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Don't show "Cart Empty" while MongoDB cart is still loading
    if (cartLoading) {
      return null;
    }

    if (cart.length === 0) {
      return;
    }

    try {
      const response = await apiClient.post(
        "/api/modasphere/orders/checkout",
        {
          shippingAddress: {
            name: formData.fullName,
            phone: formData.phone,
            addressLine1: formData.address,
            addressLine2: "",
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
          },
          discountCode: discount?.code || undefined,
        }
      );

      const createdOrder = response.data?.data?.order;

      setOrderNumber(
        createdOrder?.orderNumber ||
          createdOrder?._id ||
          "Order placed"
      );

      setOrderPlaced(true);
      refetchCartContext();
      localStorage.removeItem("modamartCart");
    } catch (error) {
      console.error("Checkout failed:", error);
      alert(error.response?.data?.message || error.message || "Failed to place the order.");
    }
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
            <div className="discount-section">
              <label htmlFor="discountCode">
                Discount Code
              </label>

              <div className="discount-input-row">
                <input
                  id="discountCode"
                  type="text"
                  value={discountCode}
                  onChange={(e) => {
                    setDiscountCode(e.target.value.toUpperCase());
                    setDiscount(null);
                    setDiscountError("");
                  }}
                  placeholder="Enter code"
                  disabled={discountLoading}
                />

                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  disabled={discountLoading}
                >
                  {discountLoading ? "Applying..." : "Apply"}
                </button>
              </div>

              {discountError && (
                <p className="discount-error">
                  {discountError}
                </p>
              )}

              {discount && (
                <p className="discount-success">
                  {discount.code} applied successfully.
                </p>
              )}
            </div>

            <div className="checkout-summary-row">
              <span>Subtotal</span>
              <strong>
                ₹{subtotal.toLocaleString("en-IN")}
              </strong>
            </div>

            {discount && (
              <div className="checkout-summary-row">
                <span>Discount</span>
                <strong>
                  -₹{discountAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </strong>
              </div>
            )}

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