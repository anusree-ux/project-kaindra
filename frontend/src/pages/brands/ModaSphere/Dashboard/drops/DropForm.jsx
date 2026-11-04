import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import {
  createDrop,
  getSellerDrops,
  getSellerProducts,
  updateDrop,
} from "../services/dashboardApi";

const dateTimeParts = (value) => {
  if (!value) return { date: "", time: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "", time: "" };
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  const localValue = localDate.toISOString();
  return { date: localValue.slice(0, 10), time: localValue.slice(11, 16) };
};

const DropForm = () => {
  const navigate = useNavigate();
  const { dropId } = useParams();

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingDrop, setLoadingDrop] = useState(Boolean(dropId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: "",
    productIds: [],
    description: "",
    releaseDate: "",
    releaseTime: "12:00",
    endDate: "",
    endTime: "",
    purchaseLimit: "2",
    dropStock: "",
  });

  useEffect(() => {
    let isMounted = true;
    setLoadingProducts(true);

    const loadFormData = async () => {
      try {
        const [sellerProducts, sellerDrops] = await Promise.all([
          getSellerProducts(),
          dropId ? getSellerDrops() : Promise.resolve([]),
        ]);
        if (!isMounted) return;
        setProducts(sellerProducts || []);

        if (dropId) {
          const drop = sellerDrops.find(
            (item) => String(item._id || item.id) === String(dropId),
          );
          if (!drop) {
            throw new Error("The requested drop was not found in your seller account.");
          }
          const start = dateTimeParts(drop.startTime);
          const end = dateTimeParts(drop.endTime);
          const linkedProducts = Array.isArray(drop.productIds)
            ? drop.productIds
            : [];
          setForm({
            name: drop.title || "",
            productIds: linkedProducts.map((product) =>
              String(typeof product === "object" ? product._id : product),
            ),
            description: drop.description || "",
            releaseDate: start.date,
            releaseTime: start.time,
            endDate: end.date,
            endTime: end.time,
            purchaseLimit: String(drop.maxPerUser || 1),
            dropStock:
              linkedProducts.length === 1 && typeof linkedProducts[0] === "object"
                ? String(linkedProducts[0].dropStock ?? "")
                : "",
          });
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load drop form:", err);
          setError(err.message || "Failed to load the drop.");
        }
      } finally {
        if (isMounted) setLoadingProducts(false);
        if (isMounted) setLoadingDrop(false);
      }
    };

    loadFormData();

    return () => {
      isMounted = false;
    };
  }, [dropId]);

  const update = (event) => {
    const { name, value, selectedOptions } = event.target;
    if (name === "productIds" && event.target.multiple) {
      const selectedIds = Array.from(selectedOptions, (option) => option.value);
      setForm((current) => ({
        ...current,
        productIds: selectedIds,
        dropStock:
          selectedIds.length === 1
            ? String(
                products.find(
                  (product) => String(product._id || product.id) === selectedIds[0],
                )?.dropStock ?? "",
              )
            : "",
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "productIds"
        ? {
            productIds: [value],
            dropStock: String(
              products.find(
                (product) => String(product._id || product.id) === value,
              )?.dropStock ?? "",
            ),
          }
        : {}),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (loadingProducts || loadingDrop) {
        throw new Error("Wait for the drop details to finish loading.");
      }
      if (!form.productIds.length) {
        throw new Error("Please select a product for the drop.");
      }

      const startDate = new Date(`${form.releaseDate}T${form.releaseTime || "12:00"}`);
      if (Number.isNaN(startDate.getTime())) {
        throw new Error("Please enter a valid release date and time.");
      }
      const dropData = {
        title: form.name,
        description: form.description || form.name,
        productIds: form.productIds,
        startTime: startDate.toISOString(),
        maxPerUser: Number(form.purchaseLimit || 1),
      };

      if (form.endDate || form.endTime) {
        if (!form.endDate || !form.endTime) {
          throw new Error("Enter both the end date and time, or leave both blank.");
        }
        const endDate = new Date(`${form.endDate}T${form.endTime}`);
        if (Number.isNaN(endDate.getTime()) || endDate <= startDate) {
          throw new Error("The end date and time must be after the release date and time.");
        }
        dropData.endTime = endDate.toISOString();
      }

      if (dropId && form.productIds.length === 1 && form.dropStock !== "") {
        dropData.dropStock = Number(form.dropStock);
      }

      if (dropId) {
        await updateDrop(dropId, dropData);
      } else {
        await createDrop(dropData);
      }

      navigate("/businesses/modasphere/dashboard/drops");
    } catch (err) {
      console.error("Failed to save drop:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        `Failed to ${dropId ? "update" : "create"} the drop. Please ensure the selected product is marked as a drop item.`
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

      {loadingDrop && (
        <div style={{ padding: "24px 0", color: "#666" }}>
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Loading drop...
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
                name="productIds"
                value={dropId ? form.productIds : form.productIds[0] || ""}
                onChange={update}
                required
                disabled={loadingProducts}
                multiple={Boolean(dropId)}
                size={dropId ? Math.min(Math.max(products.length, 2), 6) : undefined}
              >
                {!dropId && (
                  <option value="">
                    {loadingProducts ? "Loading products..." : "Select product"}
                  </option>
                )}
                {products.map((p) => {
                  const id = p._id || p.id;
                  return (
                    <option key={id} value={id}>
                      {p.name} (Stock: {p.dropStock ?? p.stock ?? 0}{p.isDrop ? " - Drop Ready" : ""})
                    </option>
                  );
                })}
              </select>
              {dropId && (
                <small style={{ color: "#666" }}>
                  Hold Ctrl (Windows) or Command (Mac) to select multiple products.
                </small>
              )}
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
              <label>End date (optional)</label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={update}
              />
            </div>

            <div className="dashboard-field">
              <label>End time (optional)</label>
              <input
                type="time"
                name="endTime"
                value={form.endTime}
                onChange={update}
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

            {dropId && form.productIds.length === 1 && (
              <div className="dashboard-field">
                <label>Drop stock</label>
                <input
                  type="number"
                  name="dropStock"
                  min="0"
                  step="1"
                  value={form.dropStock}
                  onChange={update}
                  required
                />
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="dashboard-btn dashboard-btn-primary"
          disabled={submitting || loadingProducts || loadingDrop}
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
              {dropId ? "Save changes" : "Save drop"}
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default DropForm;