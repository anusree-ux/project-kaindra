import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import ConfirmDialog from "../components/ConfirmDialog";

const initialProducts = [
  {
    id: "PRD-001",
    name: "Classic Linen Shirt",
    category: "Shirts",
    price: 2499,
    stock: 24,
    status: "active",
  },
  {
    id: "PRD-002",
    name: "Essential Hoodie",
    category: "Hoodies",
    price: 3299,
    stock: 8,
    status: "active",
  },
  {
    id: "PRD-003",
    name: "Wide Leg Trousers",
    category: "Trousers",
    price: 2799,
    stock: 15,
    status: "draft",
  },
];

const ProductList = () => {
  const navigate = useNavigate();

  const [products, setProducts] =
    useState(initialProducts);

  const [search, setSearch] = useState("");
  const [deleteProduct, setDeleteProduct] =
    useState(null);

  const filtered = useMemo(
    () =>
      products.filter((product) =>
        product.name
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [products, search]
  );

  const columns = [
    {
      key: "name",
      label: "Product",
    },
    {
      key: "category",
      label: "Category",
    },
    {
      key: "price",
      label: "Price",
      render: (value) =>
        `₹${Number(value).toLocaleString("en-IN")}`,
    },
    {
      key: "stock",
      label: "Stock",
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <StatusBadge status={value} />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, product) => (
        <div style={{ display: "flex", gap: 7 }}>
          <button
            className="dashboard-icon-button"
            onClick={() =>
              navigate(
                `/businesses/modasphere/dashboard/products/${product.id}/edit`
              )
            }
          >
            <Pencil size={15} />
          </button>

          <button
            className="dashboard-icon-button"
            onClick={() => setDeleteProduct(product)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  const handleDelete = () => {
    setProducts((current) =>
      current.filter(
        (product) =>
          product.id !== deleteProduct?.id
      )
    );

    setDeleteProduct(null);
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <h1>Products</h1>
          <p>
            Manage your ModaSphere product catalogue.
          </p>
        </div>

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

      <div className="dashboard-toolbar">
        <div className="dashboard-search-box">
          <Search size={17} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search products..."
          />
        </div>
      </div>

      <div className="dashboard-card">
        <DataTable
          columns={columns}
          data={filtered}
          emptyTitle="No products found"
        />
      </div>

      <ConfirmDialog
        open={Boolean(deleteProduct)}
        title="Delete product?"
        message={`Are you sure you want to remove ${
          deleteProduct?.name || "this product"
        }?`}
        confirmText="Delete"
        onCancel={() => setDeleteProduct(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ProductList;