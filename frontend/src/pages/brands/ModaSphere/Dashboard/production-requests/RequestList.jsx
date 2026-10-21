import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";

const requests = [
  {
    id: "REQ-1001",
    product: "Premium Cotton Tee",
    quantity: 500,
    manufacturer: "Apex Textiles",
    status: "quoted",
  },
  {
    id: "REQ-1002",
    product: "Winter Hoodie",
    quantity: 250,
    manufacturer: "Urban Manufacturing",
    status: "in_production",
  },
  {
    id: "REQ-1003",
    product: "Linen Shirt",
    quantity: 300,
    manufacturer: "Pending assignment",
    status: "open",
  },
];

const RequestList = () => {
  const navigate = useNavigate();

  const columns = [
    { key: "id", label: "Request" },
    { key: "product", label: "Product" },
    { key: "quantity", label: "Quantity" },
    {
      key: "manufacturer",
      label: "Manufacturer",
    },
    {
      key: "status",
      label: "Status",
      render: (status) => (
        <StatusBadge status={status} />
      ),
    },
    {
      key: "view",
      label: "",
      render: (_, request) => (
        <button
          className="dashboard-icon-button"
          onClick={() =>
            navigate(
              `/businesses/modasphere/dashboard/production-requests/${request.id}`
            )
          }
        >
          <Eye size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <h1>Production Requests</h1>
          <p>
            Track manufacturing requests, quotes and production.
          </p>
        </div>
      </div>

      <VerificationBanner />

      <div className="dashboard-card">
        <DataTable
          columns={columns}
          data={requests}
        />
      </div>
    </div>
  );
};

import VerificationBanner from "./VerificationBanner";

export default RequestList;