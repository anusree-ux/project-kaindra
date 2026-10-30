import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgePercent,
  Check,
  Copy,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import "./AdminDiscountCodes.css";

const API_BASE = "/api/modasphere/discount-codes";

const emptyForm = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  maxUsesPerUser: "",
  maxTotalUses: "",
  expiryDate: "",
  minOrderAmount: "0",
  isActive: true,
};

function AdminDiscountCodes() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const token =
    sessionStorage.getItem("kaindraAdminAccessToken") ||
    localStorage.getItem("token");

  const request = async (path = "", options = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || "The request failed.");
    }

    return result;
  };

  const loadCodes = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await request();
      setCodes(
        Array.isArray(result.data?.discountCodes)
          ? result.data.discountCodes
          : []
      );
    } catch (err) {
      setError(err.message || "Unable to load discount codes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCodes();
  }, []);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const openCreateForm = () => {
    setEditingCode(null);
    setForm({ ...emptyForm });
    setError("");
    setNotice("");
    setShowForm(true);
  };

  const openEditForm = (code) => {
    setEditingCode(code);
    setForm({
      code: code.code || "",
      discountType: code.discountType || "percentage",
      discountValue: String(code.discountValue ?? ""),
      maxUsesPerUser:
        code.maxUsesPerUser == null ? "" : String(code.maxUsesPerUser),
      maxTotalUses:
        code.maxTotalUses == null ? "" : String(code.maxTotalUses),
      expiryDate: code.expiryDate
        ? new Date(code.expiryDate).toISOString().slice(0, 10)
        : "",
      minOrderAmount: String(code.minOrderAmount ?? 0),
      isActive: Boolean(code.isActive),
    });
    setError("");
    setNotice("");
    setShowForm(true);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      maxUsesPerUser: form.maxUsesPerUser
        ? Number(form.maxUsesPerUser)
        : null,
      maxTotalUses: form.maxTotalUses
        ? Number(form.maxTotalUses)
        : null,
      expiryDate: form.expiryDate || null,
      minOrderAmount: Number(form.minOrderAmount || 0),
      isActive: form.isActive,
    };

    try {
      if (payload.discountType === "percentage" &&
          (payload.discountValue <= 0 || payload.discountValue > 100)) {
        throw new Error("Percentage discounts must be between 1 and 100.");
      }

      if (payload.discountValue <= 0 || !Number.isFinite(payload.discountValue)) {
        throw new Error("Enter a valid discount value greater than zero.");
      }

      if (payload.minOrderAmount < 0 || !Number.isFinite(payload.minOrderAmount)) {
        throw new Error("Minimum order amount cannot be negative.");
      }

      for (const field of ["maxUsesPerUser", "maxTotalUses"]) {
        if (payload[field] !== null &&
            (!Number.isInteger(payload[field]) || payload[field] < 1)) {
          throw new Error("Usage limits must be positive whole numbers.");
        }
      }

      if (payload.expiryDate) {
        payload.expiryDate = new Date(
          `${payload.expiryDate}T23:59:59`
        ).toISOString();
      }

      if (editingCode) {
        await request(`/${editingCode._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setNotice("Discount code updated successfully.");
      } else {
        await request("", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setNotice("Discount code created successfully.");
      }

      setShowForm(false);
      setEditingCode(null);
      setForm({ ...emptyForm });
      await loadCodes();
    } catch (err) {
      setError(err.message || "Unable to save the discount code.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (code) => {
    setError("");
    setNotice("");

    try {
      await request(`/${code._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !code.isActive }),
      });

      setNotice(
        `Code ${code.code} ${code.isActive ? "deactivated" : "activated"}.`
      );
      await loadCodes();
    } catch (err) {
      setError(err.message || "Unable to update code status.");
    }
  };

  const deleteCode = async (code) => {
    if (!window.confirm(`Delete discount code "${code.code}" permanently?`)) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await request(`/${code._id}`, { method: "DELETE" });
      setCodes((current) => current.filter((item) => item._id !== code._id));
      setNotice(`Discount code ${code.code} deleted.`);
    } catch (err) {
      setError(err.message || "Unable to delete the discount code.");
    }
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setNotice(`Copied ${code} to clipboard.`);
    } catch {
      setError("Unable to copy the code. Please copy it manually.");
    }
  };

  const filteredCodes = codes.filter((code) =>
    String(code.code || "").toLowerCase().includes(search.trim().toLowerCase())
  );

  const activeCount = codes.filter((code) => code.isActive).length;

  const formatAmount = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  const formatDiscount = (code) =>
    code.discountType === "percentage"
      ? `${code.discountValue}% off`
      : `${formatAmount(code.discountValue)} off`;

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "No expiry";

  return (
    <main className="admin-discounts-page">
      <div className="admin-discounts-container">
        <Link to="/admin" className="discounts-back-link">
          <ArrowLeft size={17} /> Dashboard
        </Link>

        <header className="discounts-header">
          <div>
            <span className="discounts-eyebrow">MODADROP / ADMIN</span>
            <h1>Discount Codes</h1>
            <p>Create and manage discount codes available at checkout.</p>
          </div>

          <button
            type="button"
            className="discounts-primary-button"
            onClick={openCreateForm}
          >
            <Plus size={18} /> Create Code
          </button>
        </header>

        <section className="discounts-stats">
          <article className="discount-stat">
            <span className="discount-stat-icon"><Tag size={21} /></span>
            <div><small>Total codes</small><strong>{codes.length}</strong></div>
          </article>
          <article className="discount-stat">
            <span className="discount-stat-icon"><Check size={21} /></span>
            <div><small>Active codes</small><strong>{activeCount}</strong></div>
          </article>
          <article className="discount-stat">
            <span className="discount-stat-icon"><BadgePercent size={21} /></span>
            <div><small>Inactive codes</small><strong>{codes.length - activeCount}</strong></div>
          </article>
        </section>

        {error && <div className="discount-alert discount-alert-error">{error}</div>}
        {notice && <div className="discount-alert discount-alert-success">{notice}</div>}

        {showForm && (
          <section className="discount-form-panel">
            <div className="discount-form-heading">
              <div>
                <h2>{editingCode ? "Edit discount code" : "Create discount code"}</h2>
                <p>Fields marked required must be completed.</p>
              </div>
              <button
                type="button"
                className="discount-icon-button"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitForm}>
              <div className="discount-form-grid">
                <label>
                  Discount code *
                  <input
                    name="code"
                    value={form.code}
                    onChange={updateField}
                    placeholder="e.g. WELCOME10"
                    required
                    maxLength={40}
                    autoComplete="off"
                  />
                </label>

                <label>
                  Discount type *
                  <select
                    name="discountType"
                    value={form.discountType}
                    onChange={updateField}
                    required
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat amount (₹)</option>
                  </select>
                </label>

                <label>
                  Discount value *
                  <input
                    name="discountValue"
                    type="number"
                    min="0.01"
                    max={form.discountType === "percentage" ? "100" : undefined}
                    step="0.01"
                    value={form.discountValue}
                    onChange={updateField}
                    placeholder={form.discountType === "percentage" ? "10" : "100"}
                    required
                  />
                </label>

                <label>
                  Minimum order amount (₹)
                  <input
                    name="minOrderAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minOrderAmount}
                    onChange={updateField}
                  />
                </label>

                <label>
                  Maximum uses per user
                  <input
                    name="maxUsesPerUser"
                    type="number"
                    min="1"
                    step="1"
                    value={form.maxUsesPerUser}
                    onChange={updateField}
                    placeholder="Unlimited"
                  />
                </label>

                <label>
                  Maximum total uses
                  <input
                    name="maxTotalUses"
                    type="number"
                    min="1"
                    step="1"
                    value={form.maxTotalUses}
                    onChange={updateField}
                    placeholder="Unlimited"
                  />
                </label>

                <label>
                  Expiry date
                  <input
                    name="expiryDate"
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={form.expiryDate}
                    onChange={updateField}
                  />
                </label>

                <label className="discount-active-field">
                  <input
                    name="isActive"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={updateField}
                  />
                  Active immediately
                </label>
              </div>

              <div className="discount-form-actions">
                <button
                  type="button"
                  className="discounts-secondary-button"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="discounts-primary-button"
                  disabled={saving}
                >
                  {saving ? "Saving..." : editingCode ? "Save Changes" : "Create Code"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="discounts-list-panel">
          <div className="discounts-list-heading">
            <div>
              <h2>All discount codes</h2>
              <p>{filteredCodes.length} code{filteredCodes.length === 1 ? "" : "s"}</p>
            </div>

            <div className="discounts-list-tools">
              <label className="discount-search">
                <Search size={17} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search codes"
                  aria-label="Search discount codes"
                />
              </label>
              <button
                type="button"
                className="discount-refresh-button"
                onClick={loadCodes}
                aria-label="Refresh discount codes"
                disabled={loading}
              >
                <RefreshCw size={17} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="discounts-empty-state">Loading discount codes...</div>
          ) : filteredCodes.length === 0 ? (
            <div className="discounts-empty-state">
              <BadgePercent size={34} />
              <h3>{search ? "No matching codes" : "No discount codes yet"}</h3>
              <p>
                {search
                  ? "Try another search term."
                  : "Create your first discount code to make it available at checkout."}
              </p>
              {!search && (
                <button
                  type="button"
                  className="discounts-primary-button"
                  onClick={openCreateForm}
                >
                  <Plus size={18} /> Create Code
                </button>
              )}
            </div>
          ) : (
            <div className="discounts-table-wrap">
              <table className="discounts-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Minimum order</th>
                    <th>Usage limits</th>
                    <th>Expiry</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCodes.map((code) => (
                    <tr key={code._id}>
                      <td>
                        <div className="discount-code-cell">
                          <strong>{code.code}</strong>
                          <button
                            type="button"
                            className="discount-copy-button"
                            onClick={() => copyCode(code.code)}
                            aria-label={`Copy ${code.code}`}
                            title="Copy code"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td><strong>{formatDiscount(code)}</strong></td>
                      <td>{formatAmount(code.minOrderAmount)}</td>
                      <td>
                        <span className="discount-usage-line">
                          Per user: {code.maxUsesPerUser ?? "Unlimited"}
                        </span>
                        <span className="discount-usage-line">
                          Total: {code.maxTotalUses ?? "Unlimited"}
                        </span>
                      </td>
                      <td>{formatDate(code.expiryDate)}</td>
                      <td>
                        <span className={`discount-status ${code.isActive ? "is-active" : "is-inactive"}`}>
                          {code.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="discount-row-actions">
                          <button
                            type="button"
                            onClick={() => openEditForm(code)}
                            title="Edit code"
                            aria-label={`Edit ${code.code}`}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStatus(code)}
                            title={code.isActive ? "Deactivate code" : "Activate code"}
                            aria-label={`${code.isActive ? "Deactivate" : "Activate"} ${code.code}`}
                          >
                            {code.isActive ? <X size={16} /> : <Check size={16} />}
                          </button>
                          <button
                            type="button"
                            className="discount-delete-action"
                            onClick={() => deleteCode(code)}
                            title="Delete code"
                            aria-label={`Delete ${code.code}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default AdminDiscountCodes;