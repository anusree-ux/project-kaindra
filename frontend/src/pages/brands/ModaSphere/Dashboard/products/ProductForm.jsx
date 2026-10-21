import { useState } from "react";
import {
  ArrowLeft,
  Save,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ImageUploader from "./ImageUploader";

const ProductForm = () => {
  const navigate = useNavigate();
  const { productId } = useParams();

  const editing = Boolean(productId);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    stock: "",
    sku: "",
    status: "active",
    enableDrop: false,
  });

  const [images, setImages] = useState([]);

  const update = (event) => {
    const { name, value, type, checked } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const submit = (event) => {
    event.preventDefault();

    console.log("Frontend product:", {
      ...form,
      images,
    });

    navigate(
      "/businesses/modasphere/dashboard/products"
    );
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
              <label>Category</label>

              <input
                name="category"
                value={form.category}
                onChange={update}
                required
              />
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
          <button className="dashboard-btn dashboard-btn-primary">
            <Save size={16} />
            {editing ? "Save changes" : "Create product"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;