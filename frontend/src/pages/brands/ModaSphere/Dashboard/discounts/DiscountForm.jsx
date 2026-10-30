import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { createDiscountCode } from "../services/dashboardApi";

const DiscountForm = () => {
  const navigate = useNavigate();
  const { discountId } = useParams();

  const [form, setForm] = useState({
    code: "",
    type: "percentage",
    value: "",
    minimumOrder: "",
    usageLimit: "",
    expiry: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const update = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const discountType = form.type === "fixed" ? "flat" : form.type;
      await createDiscountCode({
        code: form.code.trim().toUpperCase(),
        discountType,
        discountValue: Number(form.value),
        minOrderAmount: form.minimumOrder ? Number(form.minimumOrder) : 0,
        maxTotalUses: form.usageLimit ? Number(form.usageLimit) : null,
        expiryDate: form.expiry ? new Date(form.expiry).toISOString() : null,
      });

      navigate("/businesses/modasphere/dashboard/discounts");
    } catch (err) {
      console.error("Failed to save discount code:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to create discount code."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <button
            className="dashboard-btn dashboard-btn-secondary"
            onClick={() => navigate(-1)}
            type="button"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <h1 style={{ marginTop: 18 }}>
            {discountId
              ? "Edit Discount"
              : "Create Discount"}
          </h1>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #ef4444",
            color: "#b91c1c",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 20,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={submit}>
        <div className="dashboard-card">
          <div className="dashboard-card-body dashboard-form-grid">
            <div className="dashboard-field">
              <label>Discount code</label>
              <input
                name="code"
                placeholder="e.g. SUMMER25"
                value={form.code}
                onChange={update}
                required
              />
            </div>

            <div className="dashboard-field">
              <label>Type</label>
              <select
                name="type"
                value={form.type}
                onChange={update}
              >
                <option value="percentage">
                  Percentage (%)
                </option>
                <option value="fixed">
                  Fixed amount (₹)
                </option>
              </select>
            </div>

            <div className="dashboard-field">
              <label>Value</label>
              <input
                type="number"
                min="1"
                max={form.type === "percentage" ? "100" : undefined}
                name="value"
                value={form.value}
                onChange={update}
                required
              />
            </div>

            <div className="dashboard-field">
              <label>Minimum order amount (₹)</label>
              <input
                type="number"
                min="0"
                name="minimumOrder"
                value={form.minimumOrder}
                onChange={update}
              />
            </div>

            <div className="dashboard-field">
              <label>Total usage limit</label>
              <input
                type="number"
                min="1"
                name="usageLimit"
                placeholder="Unlimited if empty"
                value={form.usageLimit}
                onChange={update}
              />
            </div>

            <div className="dashboard-field">
              <label>Expiry date</label>
              <input
                type="date"
                name="expiry"
                value={form.expiry}
                onChange={update}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="dashboard-btn dashboard-btn-primary"
          disabled={submitting}
          style={{ marginTop: 20, display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          {submitting ? (
            <>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              Saving discount...
            </>
          ) : (
            <>
              <Save size={16} />
              Save discount
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default DiscountForm;