import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, ShoppingBag, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import apiClient from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./Checkout.css";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

function Checkout() {
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal, loading: authLoading } = useAuth();
  const { cart, subtotal, loading: cartLoading, fetchCart: refetchCartContext } = useCart();

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phoneNumber || "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "Karnataka",
    pincode: "",
  });

  const [errors, setErrors] = useState({});
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [razorpayOpen, setRazorpayOpen] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [delayedConfirmation, setDelayedConfirmation] = useState(null);

  // Sync user details when auth loads
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phoneNumber || "",
      }));
    }
  }, [user]);

  // Auth requirement check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      openAuthModal("login");
    }
  }, [authLoading, isAuthenticated, openAuthModal]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartLoading && isAuthenticated && cart.length === 0) {
      navigate("/businesses/modamart/cart", { replace: true });
    }
  }, [cartLoading, isAuthenticated, cart, navigate]);

  // Dynamically load Razorpay Checkout script once
  useEffect(() => {
    let isMounted = true;
    if (window.Razorpay) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      if (isMounted) setScriptLoaded(true);
    };
    script.onerror = () => {
      if (isMounted) setScriptError(true);
    };
    document.body.appendChild(script);

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required.";
    if (!formData.email.trim()) newErrors.email = "Email address is required.";
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = "Phone number must be exactly 10 digits.";
    }

    if (!formData.addressLine1.trim()) newErrors.addressLine1 = "Street address is required.";
    if (!formData.city.trim()) newErrors.city = "City is required.";
    if (!formData.state.trim()) newErrors.state = "State is required.";

    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required.";
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = "Pincode must be exactly 6 digits.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      const response = await apiClient.post("/api/modasphere/discount-codes/validate", {
        code: discountCode.trim(),
        orderAmount: subtotal,
      });

      setDiscount(response.data?.data);
    } catch (err) {
      setDiscountError(err.response?.data?.message || err.message || "Invalid discount code.");
    } finally {
      setDiscountLoading(false);
    }
  };

  // Verify Razorpay payment signature with up to 3 retries for 5xx/network errors
  const verifyPaymentWithRetry = async (orderId, paymentResponse, retries = 3) => {
    setVerifying(true);
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await apiClient.post(
          `/api/modasphere/orders/${orderId}/verify-payment`,
          {
            razorpayPaymentId: paymentResponse.razorpay_payment_id,
            razorpaySignature: paymentResponse.razorpay_signature,
          }
        );

        if (response.data?.status === "success") {
          setVerifying(false);
          await refetchCartContext();
          navigate(`/order-confirmation/${orderId}`, { replace: true });
          return;
        }
      } catch (err) {
        const statusCode = err.response?.status;
        if (statusCode === 400) {
          // Signature invalid
          setVerifying(false);
          setSubmitting(false);
          setRazorpayOpen(false);
          setErrorMessage(err.response?.data?.message || "Payment verification failed. Invalid payment signature.");
          return;
        }

        if (attempt < retries) {
          await new Promise((res) => setTimeout(res, 1500 * attempt));
        } else {
          // Retries exhausted on network/5xx error
          setVerifying(false);
          setSubmitting(false);
          setRazorpayOpen(false);
          setDelayedConfirmation({
            orderId,
            message: `Your payment was received but confirmation is delayed. Do not pay again. Your order ID is ${orderId}`,
          });
          refetchCartContext();
          return;
        }
      }
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();

    if (submitting || razorpayOpen || cartLoading || cart.length === 0) return;

    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }

    if (!validateForm()) return;

    if (scriptError || !window.Razorpay) {
      setErrorMessage("Razorpay payment gateway failed to load. Please check your network connection and refresh.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setNoticeMessage("");
    setDelayedConfirmation(null);

    try {
      const checkoutPayload = {
        shippingAddress: {
          name: formData.fullName.trim(),
          phone: formData.phone.trim(),
          addressLine1: formData.addressLine1.trim(),
          addressLine2: formData.addressLine2.trim() || undefined,
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        },
        discountCode: discount?.code || undefined,
      };

      const res = await apiClient.post("/api/modasphere/orders/checkout", checkoutPayload);
      const checkoutData = res.data?.data;

      if (!checkoutData || !checkoutData.razorpayOrderId) {
        throw new Error("Failed to initialize payment gateway order.");
      }

      setRazorpayOpen(true);

      const options = {
        key: checkoutData.key,
        amount: checkoutData.amount,
        currency: checkoutData.currency || "INR",
        name: "Kaindra",
        description: "ModaMart Order Payment",
        order_id: checkoutData.razorpayOrderId,
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#b89552",
        },
        handler: function (response) {
          verifyPaymentWithRetry(checkoutData.orderId, response);
        },
        modal: {
          ondismiss: function () {
            setRazorpayOpen(false);
            setSubmitting(false);
            setNoticeMessage("Payment was not completed. Your cart is unchanged.");
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response) {
        setRazorpayOpen(false);
        setSubmitting(false);
        const reason = response.error?.description || "Payment failed. Please try again.";
        setErrorMessage(`Payment Failed: ${reason}`);
      });

      rzp.open();
    } catch (err) {
      setSubmitting(false);
      setRazorpayOpen(false);

      const backendMsg = err.response?.data?.message;
      const isStockOrAvailabilityError =
        err.response?.status === 400 &&
        (backendMsg?.toLowerCase().includes("stock") ||
          backendMsg?.toLowerCase().includes("unavailable") ||
          backendMsg?.toLowerCase().includes("empty") ||
          backendMsg?.toLowerCase().includes("drop"));

      if (isStockOrAvailabilityError) {
        // Redirect to cart page with backend message
        alert(`Checkout Notice: ${backendMsg}`);
        navigate("/businesses/modamart/cart");
      } else {
        setErrorMessage(backendMsg || err.message || "Failed to initiate checkout.");
      }
    }
  };

  const discountAmount = discount?.discountAmount || 0;
  const computedTotal = Math.max(subtotal - discountAmount, 0);

  if (delayedConfirmation) {
    return (
      <main className="checkout-page">
        <div className="order-success">
          <AlertCircle size={60} style={{ color: "#d97706", marginBottom: "16px" }} />
          <h1>Confirmation Delayed</h1>
          <p style={{ color: "#444", fontSize: "16px", margin: "12px 0 24px" }}>
            {delayedConfirmation.message}
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <Link to="/businesses/modamart/orders" className="success-button">
              View My Orders
            </Link>
            <Link to="/businesses/modamart/shop" className="success-button secondary">
              Back to Shop
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (cartLoading) {
    return (
      <main className="checkout-page">
        <div className="checkout-container" style={{ textAlign: "center", padding: "100px 0" }}>
          <Loader2 size={40} className="animate-spin" style={{ margin: "0 auto 16px", color: "#b89552" }} />
          <p style={{ color: "#777" }}>Loading checkout...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        <Link to="/businesses/modamart/cart" className="checkout-back">
          <ArrowLeft size={18} />
          Back to Cart
        </Link>

        <div className="checkout-heading">
          <span>MODAMART</span>
          <h1>Checkout</h1>
        </div>

        {scriptError && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "14px 18px", borderRadius: "8px", marginBottom: "20px", color: "#dc2626" }}>
            <strong>Razorpay Loading Error:</strong> Could not load Razorpay payment gateway. Please check your network and refresh.
          </div>
        )}

        {errorMessage && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "14px 18px", borderRadius: "8px", marginBottom: "20px", color: "#dc2626" }}>
            {errorMessage}
          </div>
        )}

        {noticeMessage && (
          <div style={{ background: "#fffbe6", border: "1px solid #ffe58f", padding: "14px 18px", borderRadius: "8px", marginBottom: "20px", color: "#8c6b00" }}>
            {noticeMessage}
          </div>
        )}

        {verifying && (
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "16px 20px", borderRadius: "8px", marginBottom: "20px", color: "#1d4ed8", display: "flex", alignItems: "center", gap: "12px" }}>
            <Loader2 size={24} className="animate-spin" />
            <span>Verifying payment signature with Razorpay... Please do not close or refresh this page.</span>
          </div>
        )}

        <form className="checkout-layout" onSubmit={handleCheckoutSubmit}>
          {/* CUSTOMER & SHIPPING FORM */}
          <div className="checkout-form">
            <section className="checkout-section">
              <div className="checkout-section-heading">
                <span>01</span>
                <div>
                  <h2>Contact Information</h2>
                  <p>Enter your contact details for order updates.</p>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field full-width">
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    disabled={submitting || verifying}
                  />
                  {errors.fullName && <span style={{ color: "#dc2626", fontSize: "12px" }}>{errors.fullName}</span>}
                </div>

                <div className="form-field">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    disabled={submitting || verifying}
                  />
                  {errors.email && <span style={{ color: "#dc2626", fontSize: "12px" }}>{errors.email}</span>}
                </div>

                <div className="form-field">
                  <label htmlFor="phone">Phone Number (10 digits) *</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10 digit mobile number"
                    maxLength={10}
                    disabled={submitting || verifying}
                  />
                  {errors.phone && <span style={{ color: "#dc2626", fontSize: "12px" }}>{errors.phone}</span>}
                </div>
              </div>
            </section>

            {/* SHIPPING ADDRESS */}
            <section className="checkout-section">
              <div className="checkout-section-heading">
                <span>02</span>
                <div>
                  <h2>Delivery Address</h2>
                  <p>Where should we deliver your order?</p>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field full-width">
                  <label htmlFor="addressLine1">Street Address (Address Line 1) *</label>
                  <textarea
                    id="addressLine1"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    placeholder="House number, building, street, locality"
                    rows="3"
                    disabled={submitting || verifying}
                  />
                  {errors.addressLine1 && <span style={{ color: "#dc2626", fontSize: "12px" }}>{errors.addressLine1}</span>}
                </div>

                <div className="form-field full-width">
                  <label htmlFor="addressLine2">Landmark / Apartment (Address Line 2 - Optional)</label>
                  <input
                    id="addressLine2"
                    name="addressLine2"
                    type="text"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    placeholder="Apartment, suite, unit, landmark (optional)"
                    disabled={submitting || verifying}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="city">City *</label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    disabled={submitting || verifying}
                  />
                  {errors.city && <span style={{ color: "#dc2626", fontSize: "12px" }}>{errors.city}</span>}
                </div>

                <div className="form-field">
                  <label htmlFor="state">State *</label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    disabled={submitting || verifying}
                    style={{
                      width: "100%",
                      padding: "14px",
                      border: "1px solid #ddd",
                      background: "#fff",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  {errors.state && <span style={{ color: "#dc2626", fontSize: "12px" }}>{errors.state}</span>}
                </div>

                <div className="form-field">
                  <label htmlFor="pincode">Pincode (6 digits) *</label>
                  <input
                    id="pincode"
                    name="pincode"
                    type="text"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="6 digit pincode"
                    maxLength={6}
                    disabled={submitting || verifying}
                  />
                  {errors.pincode && <span style={{ color: "#dc2626", fontSize: "12px" }}>{errors.pincode}</span>}
                </div>
              </div>
            </section>

            {/* PAYMENT METHOD SELECTION */}
            <section className="checkout-section">
              <div className="checkout-section-heading">
                <span>03</span>
                <div>
                  <h2>Payment Method</h2>
                  <p>Secure online payment powered by Razorpay Test Mode.</p>
                </div>
              </div>

              <div className="payment-option" style={{ border: "2px solid #b89552", background: "#fefcf6", borderRadius: "6px" }}>
                <input type="radio" id="razorpay" name="payment" value="razorpay" defaultChecked readOnly />
                <label htmlFor="razorpay">
                  <strong style={{ color: "#111" }}>Razorpay Gateway (Test Mode)</strong>
                  <span>Supports Credit/Debit Cards, UPI (GPay/PhonePe), NetBanking & Wallets</span>
                </label>
              </div>
            </section>
          </div>

          {/* ORDER SUMMARY */}
          <aside className="checkout-summary">
            <h2>Order Summary</h2>

            <div className="summary-products">
              {cart.map((item) => {
                const product = item.product || {};
                const productId = product._id || product.id || item.productId;
                const name = product.name || item.name || "Item";
                const price = product.price !== undefined ? product.price : item.price || 0;
                const imageUrl =
                  product.images?.[0]?.url ||
                  (typeof product.images?.[0] === "string" ? product.images[0] : "") ||
                  item.image ||
                  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80";

                return (
                  <div className="summary-product" key={productId}>
                    <div className="checkout-product-image">
                      <img src={imageUrl} alt={name} />
                    </div>
                    <div>
                      <strong>{name}</strong>
                      <span>Qty: {item.quantity}</span>
                    </div>
                    <strong>₹{(price * item.quantity).toLocaleString("en-IN")}</strong>
                  </div>
                );
              })}
            </div>

            <div className="checkout-summary-divider" />

            {/* DISCOUNT CODE SECTION */}
            <div className="discount-section">
              <label htmlFor="discountCode">Discount Code</label>
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
                  disabled={discountLoading || submitting || verifying}
                />
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  disabled={discountLoading || submitting || verifying}
                >
                  {discountLoading ? "Applying..." : "Apply"}
                </button>
              </div>

              {discountError && <p className="discount-error">{discountError}</p>}
              {discount && <p className="discount-success">{discount.code} applied successfully.</p>}
            </div>

            <div className="checkout-summary-row">
              <span>Subtotal</span>
              <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
            </div>

            {discount && (
              <div className="checkout-summary-row">
                <span>Discount ({discount.code})</span>
                <strong style={{ color: "#16a34a" }}>-₹{discountAmount.toLocaleString("en-IN")}</strong>
              </div>
            )}

            <div className="checkout-summary-row">
              <span>Delivery</span>
              <strong>Free</strong>
            </div>

            <div className="checkout-summary-divider" />

            <div className="checkout-total">
              <span>Estimated Total</span>
              <strong>₹{computedTotal.toLocaleString("en-IN")}</strong>
            </div>

            <button
              type="submit"
              className="place-order-button"
              disabled={submitting || verifying || razorpayOpen || !scriptLoaded || cart.length === 0}
              style={{
                opacity: submitting || verifying || razorpayOpen || !scriptLoaded ? 0.7 : 1,
                cursor: submitting || verifying || razorpayOpen || !scriptLoaded ? "not-allowed" : "pointer",
              }}
            >
              {submitting
                ? "Initiating Payment..."
                : verifying
                ? "Verifying Payment..."
                : "Pay with Razorpay"}
            </button>

            <div className="checkout-security">
              <Lock size={15} />
              <ShieldCheck size={15} />
              <span>Encrypted & 256-bit Secure Razorpay Test Mode</span>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}

export default Checkout;