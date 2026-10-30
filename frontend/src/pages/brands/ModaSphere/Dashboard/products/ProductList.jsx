import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  Globe,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  getSellerProducts,
  deleteProduct as apiDeleteProduct,
  publishProduct as apiPublishProduct,
} from "../services/dashboardApi";
import { FASHION_CATEGORIES, getCategoryLabel } from "../../../../../constants/categories";

const ProductList = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionError, setActionError] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);
      setActionError("");
      const data = await getSellerProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[ProductList] Failed to load products:", err);
      setActionError("Failed to load products from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filtered = useMemo(
    () =>
      products.filter((product) => {
        const matchesSearch = (product.name || "")
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesCat =
          categoryFilter === "all" ||
          String(product.category || "").toLowerCase() === categoryFilter.toLowerCase();
        return matchesSearch && matchesCat;
      }),
    [products, search, categoryFilter]
  );

  const handleTogglePublish = async (prod) => {
    try {
      await apiPublishProduct(prod._id || prod.id);
      await loadProducts();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to update product status.";
      alert(msg);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const pId = deleteTarget._id || deleteTarget.id;
    try {
      await apiDeleteProduct(pId);
      setProducts((current) =>
        current.filter((product) => (product._id || product.id) !== pId)
      );
      setDeleteTarget(null);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to delete product.";
      alert(msg);
      setDeleteTarget(null);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Product",
      render: (_, product) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {product.images?.[0]?.url && (
            <img
              src={product.images[0].url}
              alt=""
              style={{ width: 34, height: 34, borderRadius: 4, objectFit: "cover" }}
            />
          )}
          <strong>{product.name}</strong>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (val) => (
        <span
          style={{
            display: "inline-block",
            padding: "3px 8px",
            fontSize: "12px",
            fontWeight: 500,
            borderRadius: "4px",
            backgroundColor: "#f3f4f6",
            color: "#374151",
          }}
        >
          {getCategoryLabel(val)}
        </span>
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (value) =>
        `₹${Number(value || 0).toLocaleString("en-IN")}`,
    },
    {
      key: "stock",
      label: "Stock",
      render: (_, prod) => prod.stock ?? prod.dropStock ?? 0,
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <StatusBadge status={value || "draft"} />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, product) => {
        const pId = product._id || product.id;
        return (
          <div style={{ display: "flex", gap: 7 }}>
            {product.status !== "active" && (
              <button
                className="dashboard-icon-button"
                title="Publish product"
                onClick={() => handleTogglePublish(product)}
              >
                <Globe size={15} />
              </button>
            )}
            <button
              className="dashboard-icon-button"
              title="Edit product"
              onClick={() =>
                navigate(
                  `/businesses/modasphere/dashboard/products/${pId}/edit`
                )
              }
            >
              <Pencil size={15} />
            </button>

            <button
              className="dashboard-icon-button"
              title="Delete product"
              onClick={() => setDeleteTarget(product)}
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <h1>Products</h1>
          <p>
            Manage your ModaSphere product catalogue and live inventory.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="dashboard-btn dashboard-btn-secondary"
            onClick={loadProducts}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} />
            Refresh
          </button>

          <button
            className="dashboard-btn dashboard-btn-primary"
            onClick={() =>
              navigate(
                "/businesses/modasphere/dashboard/products/new"
              )
            }
          >
            <Plus size={17} />
            Add product
          </button>
        </div>
      </div>

      {actionError && (
        <div style={{ color: "#ef4444", marginBottom: 16, fontSize: 13 }}>
          {actionError}
        </div>
      )}

      <div className="dashboard-toolbar" style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <div className="dashboard-search-box" style={{ flex: 1, minWidth: "220px" }}>
          <Search size={17} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search products..."
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: "9px 14px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            backgroundColor: "#fff",
            fontSize: "13px",
            fontWeight: 500,
            color: "#374151",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option value="all">All Categories</option>
          {FASHION_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="dashboard-card">
        <DataTable
          columns={columns}
          data={filtered}
          emptyTitle={loading ? "Loading products..." : "No products found"}
        />
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete product?"
        message={`Are you sure you want to permanently remove "${
          deleteTarget?.name || "this product"
        }"?`}
        confirmText="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ProductList;