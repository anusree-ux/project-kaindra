import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { getSellerProducts, createDrop } from "../services/dashboardApi";

const DropForm = () => {
  const navigate = useNavigate();
  const { dropId } = useParams();

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: "",
    productId: "",
    description: "",
    releaseDate: "",
    releaseTime: "12:00",
    purchaseLimit: "2",
  });

  useEffect(() => {
    let isMounted = true;
    setLoadingProducts(true);

    getSellerProducts()
      .then((data) => {
        if (!isMounted) return;
        setProducts(data || []);
      })
      .catch((err) => {
        console.error("Failed to load seller products:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingProducts(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
      if (!form.productId) {
        throw new Error("Please select a product for the drop.");
      }

      const startTime = new Date(`${form.releaseDate}T${form.releaseTime || "12:00"}`).toISOString();

      await createDrop({
        title: form.name,
        description: form.description || form.name,
        productIds: [form.productId],
        startTime,
        maxPerUser: Number(form.purchaseLimit || 1),
      });

      navigate("/businesses/modasphere/dashboard/drops");
    } catch (err) {
      console.error("Failed to save drop:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to create drop. Please ensure the selected product is marked as a drop item."
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
            {dropId ? "Edit Drop" : "Create Drop"}
          </h1>
          <p>
            Configure release date, inventory and customer limits.
          </p>
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
          <div className="dashboard-card-header">
            <h2>Drop configuration</h2>
          </div>

          <div className="dashboard-card-body dashboard-form-grid">
            <div className="dashboard-field dashboard-field-full">
              <label>Drop name</label>
              <input
                name="name"
                value={form.name}
                onChange={update}
                placeholder="e.g. Autumn Limited Edition"
                required
              />
            </div>

            <div className="dashboard-field dashboard-field-full">
              <label>Product</label>

              <select
                name="productId"
                value={form.productId}
                onChange={update}
                required
                disabled={loadingProducts}
              >
                <option value="">
                  {loadingProducts ? "Loading products..." : "Select product"}
                </option>
                {products.map((p) => {
                  const id = p._id || p.id;
                  return (
                    <option key={id} value={id}>
                      {p.name} (Stock: {p.dropStock ?? p.stock ?? 0}{p.isDrop ? " - Drop Ready" : ""})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="dashboard-field dashboard-field-full">
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={update}
                placeholder="Brief summary of the drop theme or exclusivity"
              />
            </div>

            <div className="dashboard-field">
              <label>Release date</label>
              <input
                type="date"
                name="releaseDate"
                value={form.releaseDate}
                onChange={update}
                required
              />
            </div>

            <div className="dashboard-field">
              <label>Release time</label>
              <input
                type="time"
                name="releaseTime"
                value={form.releaseTime}
                onChange={update}
                required
              />
            </div>

            <div className="dashboard-field">
              <label>Purchase limit per customer</label>
              <input
                type="number"
                min="1"
                max="10"
                name="purchaseLimit"
                value={form.purchaseLimit}
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
              Saving drop...
            </>
          ) : (
            <>
              <Save size={16} />
              Save drop
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default DropForm;