import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { getMyManufacturerProfile, updateManufacturerProfile } from "../services/dashboardApi";

const ManufacturerProfileForm = () => {
  const [form, setForm] = useState({
    companyName: "",
    city: "",
    state: "",
    capabilities: "",
    minOrderQuantity: "1",
    leadTimeDays: "7",
    description: "",
    phone: "",
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getMyManufacturerProfile()
      .then((m) => {
        if (!isMounted || !m) return;
        setForm({
          companyName: m.companyName || "",
          city: m.location?.city || "",
          state: m.location?.state || "",
          capabilities: Array.isArray(m.capabilities) ? m.capabilities.join(", ") : (m.capabilities || ""),
          minOrderQuantity: m.minOrderQuantity || "1",
          leadTimeDays: m.leadTimeDays || "7",
          description: m.description || "",
          phone: m.contactPhone || "",
        });
      })
      .catch((err) => {
        console.error("Failed to load manufacturer profile:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const update = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateManufacturerProfile({
        companyName: form.companyName.trim(),
        location: { city: form.city.trim(), state: form.state.trim() },
        capabilities: form.capabilities,
        minOrderQuantity: Number(form.minOrderQuantity) || 1,
        leadTimeDays: Number(form.leadTimeDays) || 7,
        description: form.description.trim(),
        contactPhone: form.phone.trim(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to update manufacturer profile:", err);
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
        <h2>Manufacturer profile</h2>
      </div>

      <div className="dashboard-card-body dashboard-form-grid">
        <div className="dashboard-field">
          <label>Company name</label>
          <input
            name="companyName"
            value={form.companyName}
            onChange={update}
            required
          />
        </div>

        <div className="dashboard-field">
          <label>Contact Phone</label>
          <input
            name="phone"
            value={form.phone}
            onChange={update}
          />
        </div>

        <div className="dashboard-field">
          <label>City</label>
          <input
            name="city"
            value={form.city}
            onChange={update}
          />
        </div>

        <div className="dashboard-field">
          <label>State</label>
          <input
            name="state"
            value={form.state}
            onChange={update}
          />
        </div>

        <div className="dashboard-field">
          <label>Min Order Quantity (MOQ)</label>
          <input
            type="number"
            min="1"
            name="minOrderQuantity"
            value={form.minOrderQuantity}
            onChange={update}
          />
        </div>

        <div className="dashboard-field">
          <label>Lead Time (Days)</label>
          <input
            type="number"
            min="1"
            name="leadTimeDays"
            value={form.leadTimeDays}
            onChange={update}
          />
        </div>

        <div className="dashboard-field dashboard-field-full">
          <label>Capabilities (comma-separated)</label>
          <textarea
            name="capabilities"
            value={form.capabilities}
            onChange={update}
            placeholder="e.g. Cut & Sew, Denim, Outerwear, Knitwear"
          />
        </div>

        <div className="dashboard-field dashboard-field-full">
          <label>Company Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={update}
            placeholder="Describe your manufacturing plant and capabilities"
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="submit"
            className="dashboard-btn dashboard-btn-primary"
            disabled={saving}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            {saving ? (
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Save size={16} />
            )}
            Save manufacturer profile
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

export default ManufacturerProfileForm;