import { useState, useEffect } from "react";
import { useAuth } from "../../../../../context/AuthContext";
import { Save, Loader2 } from "lucide-react";
import { getMySellerProfile, updateSellerProfile } from "../services/dashboardApi";
import { FASHION_CATEGORIES } from "../../../../../constants/categories";

const SellerProfileForm = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    businessName: "",
    email: "",
    phone: "",
    description: "",
    category: "apparel",
    minOrderQuantity: 1,
    leadTimeDays: 3,
    capacity: "Active Brand",
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getMySellerProfile()
      .then((seller) => {
        if (!isMounted) return;
        if (seller) {
          setForm({
            businessName: seller.businessName || "",
            email: seller.email || user?.email || "",
            phone: seller.phone || "",
            description: seller.description || "",
            category: seller.category || "apparel",
            minOrderQuantity: seller.minOrderQuantity !== undefined ? seller.minOrderQuantity : 1,
            leadTimeDays: seller.leadTimeDays !== undefined ? seller.leadTimeDays : 3,
            capacity: seller.capacity || "Active Brand",
          });
        } else if (user) {
          setForm((curr) => ({
            ...curr,
            businessName: user.name || "",
            email: user.email || "",
            phone: user.phoneNumber || "",
          }));
        }
      })
      .catch(() => {
        if (user && isMounted) {
          setForm((curr) => ({
            ...curr,
            businessName: user.name || "",
            email: user.email || "",
            phone: user.phoneNumber || "",
          }));
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const update = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSellerProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to update seller profile:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="dashboard-card"
      onSubmit={handleSubmit}
    >
      <div className="dashboard-card-header">
        <h2>Seller profile</h2>
      </div>

      <div className="dashboard-card-body dashboard-form-grid">
        <div className="dashboard-field">
          <label>Business name</label>
          <input
            name="businessName"
            value={form.businessName}
            onChange={update}
          />
        </div>

        <div className="dashboard-field">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={update}
          />
        </div>

        <div className="dashboard-field">
          <label>Phone</label>
          <input
            name="phone"
            value={form.phone}
            onChange={update}
          />
        </div>

        <div className="dashboard-field">
          <label>Primary category</label>
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

        <div className="dashboard-field">
          <label>Minimum order quantity (units)</label>
          <input
            type="number"
            min="1"
            name="minOrderQuantity"
            value={form.minOrderQuantity}
            onChange={update}
            placeholder="e.g. 1"
          />
        </div>

        <div className="dashboard-field">
          <label>Fulfillment lead time (days)</label>
          <input
            type="number"
            min="1"
            name="leadTimeDays"
            value={form.leadTimeDays}
            onChange={update}
            placeholder="e.g. 3"
          />
        </div>

        <div className="dashboard-field">
          <label>Capacity / Volume status</label>
          <input
            type="text"
            name="capacity"
            value={form.capacity}
            onChange={update}
            placeholder="e.g. Active Brand, Made to Order, High Volume"
          />
        </div>

        <div className="dashboard-field dashboard-field-full">
          <label>Business description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={update}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="submit" className="dashboard-btn dashboard-btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Save size={16} />
            Save seller profile
          </button>
          {saved && (
            <span style={{ color: "#16a34a", fontSize: 13, fontWeight: 500 }}>
              ✓ Saved successfully
            </span>
          )}
        </div>
      </div>
    </form>
  );
};

export default SellerProfileForm;