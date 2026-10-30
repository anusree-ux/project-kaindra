import { useState, useEffect } from "react";
import {
  Building2,
  Factory,
  Store,
  Phone,
  Tag,
  MapPin,
  Layers,
  Clock,
  FileText,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../../../context/AuthContext";
import { setupBusinessProfile, getBusinessProfileStatus } from "../services/dashboardApi";
import { FASHION_CATEGORIES } from "../../../../../constants/categories";
import "./ProfileSetup.css";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Initial account type can be passed via location.state or defaults to "seller"
  const [accountType, setAccountType] = useState(
    location.state?.accountType || "seller"
  );

  const [form, setForm] = useState({
    businessName: location.state?.businessName || "",
    phone: "",
    category: "apparel",
    description: "",
    city: "",
    state: "",
    // Manufacturer specific
    capabilities: "Apparel, Cut & Sew, Sampling",
    minOrderQuantity: "50",
    leadTimeDays: "14",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  // If already registered and profile complete, automatically continue to dashboard
  useEffect(() => {
    let isMounted = true;
    getBusinessProfileStatus()
      .then((status) => {
        if (!isMounted) return;
        if (status?.exists && status?.isProfileComplete) {
          navigate("/businesses/modasphere/dashboard", { replace: true });
        }
      })
      .catch(() => {
        // Allow user to proceed with setup
      })
      .finally(() => {
        if (isMounted) setChecking(false);
      });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Pre-fill user name/phone if available
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        businessName: prev.businessName || (user.name ? `${user.name}'s Studio` : ""),
        phone: prev.phone || user.phoneNumber || "",
      }));
    }
  }, [user]);

  const update = (e) => {
    const { name, value } = e.target;
    setForm((curr) => ({
      ...curr,
      [name]: value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.businessName.trim()) {
      setError("Please provide a business or company name.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        accountType,
        businessName: form.businessName.trim(),
        companyName: form.businessName.trim(),
        phone: form.phone.trim(),
        category: form.category,
        description: form.description.trim(),
        location: {
          city: form.city.trim(),
          state: form.state.trim(),
        },
        minOrderQuantity: Number(form.minOrderQuantity) || (accountType === "seller" ? 1 : 50),
        leadTimeDays: Number(form.leadTimeDays) || (accountType === "seller" ? 3 : 14),
        capacity: form.capacity || (accountType === "seller" ? "Active Brand" : "Medium"),
        ...(accountType === "manufacturer"
          ? {
              capabilities: form.capabilities,
            }
          : {}),
      };

      await setupBusinessProfile(payload);

      // On completion, redirect directly into the dashboard
      navigate("/businesses/modasphere/dashboard", { replace: true });
    } catch (err) {
      console.error("Profile setup failed:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Could not save profile setup. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f8f9fa",
          color: "#4b5563",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "#111827" }} />
          <p style={{ marginTop: 14, fontSize: 14, fontWeight: 500 }}>Checking business profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="moda-profilesetup-page">
      <div className="moda-profilesetup-container">
        <header className="moda-profilesetup-header">
          <div className="moda-profilesetup-logo">KAINDRA</div>
          <div className="moda-profilesetup-user-badge">
            <ShieldCheck size={16} color="#15803d" />
            <span>
              Signed in as <strong>{user?.email || "Partner"}</strong>
            </span>
          </div>
        </header>

        <main>
          <div className="moda-profilesetup-intro">
            <span className="moda-profilesetup-eyebrow">
              BUSINESS ONBOARDING &bull; SETUP
            </span>

            <h1>Set up your business profile</h1>

            <p>
              Welcome to ModaSphere! Choose your business workspace type and complete
              your operational details to finish onboarding.
            </p>
          </div>

          <form className="moda-profilesetup-card" onSubmit={handleSubmit}>
            {/* Step 1: Account Type Selection */}
            <div className="moda-profilesetup-section">
              <div className="moda-profilesetup-section-header">
                <span className="moda-profilesetup-badge-num">01</span>
                <div>
                  <h2>Choose your business type</h2>
                  <p>
                    Your account will be registered in the separate{" "}
                    <strong>{accountType === "seller" ? "Seller" : "Manufacturer"}</strong> database.
                  </p>
                </div>
              </div>

              <div className="moda-role-grid">
                <button
                  type="button"
                  className={`moda-role-card ${
                    accountType === "seller" ? "active" : ""
                  }`}
                  onClick={() => setAccountType("seller")}
                >
                  <div className="moda-role-icon">
                    <Building2 size={22} />
                  </div>
                  <div className="moda-role-info">
                    <strong>ModaSphere Seller</strong>
                    <span>
                      Manage brand products, launch limited drops, process customer orders, and track store sales.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`moda-role-card ${
                    accountType === "manufacturer" ? "active" : ""
                  }`}
                  onClick={() => setAccountType("manufacturer")}
                >
                  <div className="moda-role-icon">
                    <Factory size={22} />
                  </div>
                  <div className="moda-role-info">
                    <strong>Apparel Manufacturer</strong>
                    <span>
                      Receive production requests from fashion brands, submit sample quotes, and fulfill production orders.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 2: Business Profile Details */}
            <div className="moda-profilesetup-section">
              <div className="moda-profilesetup-section-header">
                <span className="moda-profilesetup-badge-num">02</span>
                <div>
                  <h2>
                    {accountType === "seller"
                      ? "Seller & Brand Details"
                      : "Manufacturing Facility Details"}
                  </h2>
                  <p>Provide your business contact and operational information.</p>
                </div>
              </div>

              {error && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    borderRadius: 10,
                    padding: "12px 16px",
                    marginBottom: 20,
                    fontSize: 14,
                  }}
                >
                  {error}
                </div>
              )}

              <div className="moda-fields-grid">
                <div className="moda-field-group">
                  <label>
                    {accountType === "seller" ? "Brand / Store Name *" : "Company Name *"}
                  </label>
                  <div className="moda-input-container">
                    <span className="moda-input-icon">
                      <Store size={18} />
                    </span>
                    <input
                      name="businessName"
                      value={form.businessName}
                      onChange={update}
                      placeholder={
                        accountType === "seller"
                          ? "e.g. Atelier Nova, Urban Threads"
                          : "e.g. Apex Textiles & Garments"
                      }
                      required
                    />
                  </div>
                </div>

                <div className="moda-field-group">
                  <label>Business Contact Phone</label>
                  <div className="moda-input-container">
                    <span className="moda-input-icon">
                      <Phone size={18} />
                    </span>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={update}
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>
                </div>

                {accountType === "seller" ? (
                  <>
                    <div className="moda-field-group moda-field-full">
                      <label>Primary Fashion Category</label>
                      <div className="moda-input-container">
                        <span className="moda-input-icon">
                          <Tag size={18} />
                        </span>
                        <select
                          name="category"
                          value={form.category}
                          onChange={update}
                        >
                          {FASHION_CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="moda-field-group">
                      <label>Order Minimum (Units)</label>
                      <div className="moda-input-container">
                        <span className="moda-input-icon">
                          <Tag size={18} />
                        </span>
                        <input
                          type="number"
                          min="1"
                          name="minOrderQuantity"
                          value={form.minOrderQuantity || "1"}
                          onChange={update}
                          placeholder="1"
                        />
                      </div>
                    </div>

                    <div className="moda-field-group">
                      <label>Fulfillment Lead Time (Days)</label>
                      <div className="moda-input-container">
                        <span className="moda-input-icon">
                          <Clock size={18} />
                        </span>
                        <input
                          type="number"
                          min="1"
                          name="leadTimeDays"
                          value={form.leadTimeDays || "3"}
                          onChange={update}
                          placeholder="3"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="moda-field-group moda-field-full">
                      <label>Production Capabilities (comma-separated)</label>
                      <div className="moda-input-container">
                        <span className="moda-input-icon">
                          <Layers size={18} />
                        </span>
                        <input
                          name="capabilities"
                          value={form.capabilities}
                          onChange={update}
                          placeholder="e.g. Cut & Sew, Denim, Embroidery, Knitwear"
                        />
                      </div>
                    </div>

                    <div className="moda-field-group">
                      <label>Minimum Order Quantity (MOQ)</label>
                      <div className="moda-input-container">
                        <span className="moda-input-icon">
                          <Tag size={18} />
                        </span>
                        <input
                          type="number"
                          min="1"
                          name="minOrderQuantity"
                          value={form.minOrderQuantity}
                          onChange={update}
                          placeholder="e.g. 50"
                        />
                      </div>
                    </div>

                    <div className="moda-field-group">
                      <label>Average Lead Time (Days)</label>
                      <div className="moda-input-container">
                        <span className="moda-input-icon">
                          <Clock size={18} />
                        </span>
                        <input
                          type="number"
                          min="1"
                          name="leadTimeDays"
                          value={form.leadTimeDays}
                          onChange={update}
                          placeholder="e.g. 14"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="moda-field-group">
                  <label>City</label>
                  <div className="moda-input-container">
                    <span className="moda-input-icon">
                      <MapPin size={18} />
                    </span>
                    <input
                      name="city"
                      value={form.city}
                      onChange={update}
                      placeholder="e.g. Mumbai, New Delhi"
                    />
                  </div>
                </div>

                <div className="moda-field-group">
                  <label>State</label>
                  <div className="moda-input-container">
                    <span className="moda-input-icon">
                      <MapPin size={18} />
                    </span>
                    <input
                      name="state"
                      value={form.state}
                      onChange={update}
                      placeholder="e.g. Maharashtra, Delhi"
                    />
                  </div>
                </div>

                <div className="moda-field-group moda-field-full">
                  <label>Business Bio / Description</label>
                  <div className="moda-input-container">
                    <span className="moda-input-icon" style={{ top: 16 }}>
                      <FileText size={18} />
                    </span>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={update}
                      rows={3}
                      placeholder={
                        accountType === "seller"
                          ? "Tell us about your brand aesthetic, design philosophy, and collection highlights..."
                          : "Describe your factory machinery, certifications, and quality standards..."
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer submit */}
            <div className="moda-profilesetup-footer">
              <span style={{ fontSize: 13, color: "#6b7280" }}>
                ✓ You can update these details anytime in Dashboard Settings.
              </span>

              <button
                type="submit"
                className="moda-profilesetup-submit-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                    Saving profile...
                  </>
                ) : (
                  <>
                    Complete profile setup
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default ProfileSetup;
