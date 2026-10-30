import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Loader2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ImageUploader from "./ImageUploader";
import {
  getProductById,
  createProduct,
  updateProduct,
  getMySellerProfile,
} from "../services/dashboardApi";
import { FASHION_CATEGORIES } from "../../../../../constants/categories";

const ProductForm = () => {
  const navigate = useNavigate();
  const { productId } = useParams();

  const editing = Boolean(productId);

  const [form, setForm] = useState({
    name: "",
    brand: "",
    description: "",
    category: "apparel",
    price: "",
    stock: "",
    sku: "",
    status: "active",
    enableDrop: false,
  });

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(editing);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (editing) {
      let isMounted = true;
      setFetching(true);
      getProductById(productId)
        .then((product) => {
          if (!isMounted || !product) return;
          setForm({
            name: product.name || "",
            description: product.description || "",
            category: product.category || "",
            price: product.price ?? "",
            stock: product.stock ?? "",
            sku: product.sku || "",
            status: product.status || "active",
            enableDrop: Boolean(product.isDrop),
          });
          if (Array.isArray(product.images)) {
            setImages(
              product.images.map((img, idx) => ({
                id: img.publicId || `${idx}-${img.url}`,
                preview: typeof img === "string" ? img : img.url,
                isExisting: true,
              }))
            );
          }
        })
        .catch((err) => {
          if (isMounted) setError(err.response?.data?.message || err.message || "Failed to load product");
        })
        .finally(() => {
          if (isMounted) setFetching(false);
        });

      return () => {
        isMounted = false;
      };
    } else {
      let isMounted = true;
      getMySellerProfile()
        .then((seller) => {
          if (isMounted && seller?.businessName) {
            setForm((curr) => ({ ...curr, brand: seller.businessName }));
          }
        })
        .catch(() => {});
      return () => {
        isMounted = false;
      };
    }
  }, [editing, productId]);

  const update = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("brand", form.brand);
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("price", form.price);
      formData.append("stock", form.stock);
      formData.append("isDrop", form.enableDrop);
      if (form.enableDrop) {
        formData.append("dropStock", form.stock);
      }

      // Append new image files
      images.forEach((img) => {
        if (img.file) {
          formData.append("images", img.file);
        }
      });

      if (editing) {
        await updateProduct(productId, formData);
      } else {
        await createProduct(formData);
      }

      navigate("/businesses/modasphere/dashboard/products");
    } catch (err) {
      console.error("Failed to save product:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to save product. Please try again."
      );
    } finally {
      setLoading(false);
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
            {editing ? "Edit product" : "Add product"}
          </h1>

          <p>
            Add product information, inventory and drop settings.
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

      {fetching ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#666" }}>
          <Loader2 size={28} className="dashboard-spin" style={{ animation: "spin 1s linear infinite" }} />
          <p style={{ marginTop: 12 }}>Loading product details...</p>
        </div>
      ) : (
        <form
          className="dashboard-form"
          onSubmit={submit}
        >
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2>Product information</h2>
            </div>

            <div className="dashboard-card-body dashboard-form-grid">
              <div className="dashboard-field dashboard-field-full">
                <label>Product name</label>

                <input
                  name="name"
                  value={form.name}
                  onChange={update}
                  required
                />
              </div>

              <div className="dashboard-field">
                <label>Shop / Brand name</label>

                <input
                  name="brand"
                  value={form.brand}
                  onChange={update}
                  placeholder="e.g. Urban Trends"
                />
              </div>

              <div className="dashboard-field">
                <label>Category</label>

                <select
                  name="category"
                  value={form.category}
                  onChange={update}
                  required
                >
                  <option value="" disabled>Select category</option>
                  {FASHION_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dashboard-field">
                <label>SKU</label>

                <input
                  name="sku"
                  value={form.sku}
                  onChange={update}
                />
              </div>

              <div className="dashboard-field">
                <label>Price</label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="price"
                  value={form.price}
                  onChange={update}
                  required
                />
              </div>

              <div className="dashboard-field">
                <label>Stock</label>

                <input
                  type="number"
                  min="0"
                  name="stock"
                  value={form.stock}
                  onChange={update}
                  required
                />
              </div>

              <div className="dashboard-field dashboard-field-full">
                <label>Description</label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={update}
                />
              </div>
            </div>
          </div>

          <ImageUploader
            images={images}
            onChange={setImages}
          />

          <div className="dashboard-card">
            <div className="dashboard-card-body">
              <label
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  name="enableDrop"
                  checked={form.enableDrop}
                  onChange={update}
                />

                <div>
                  <strong>Enable Product Drop</strong>

                  <div
                    style={{
                      color: "#777",
                      fontSize: 12,
                      marginTop: 3,
                    }}
                  >
                    Configure this product for a limited release.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="dashboard-btn dashboard-btn-primary"
              disabled={loading}
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {editing ? "Save changes" : "Create product"}
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProductForm;