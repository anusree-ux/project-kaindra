import { Plus, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";

import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";

const discounts = [
  {
    id: "DISC-01",
    code: "WELCOME20",
    value: "20%",
    usage: "82 / 200",
    expires: "31 Dec 2026",
    status: "active",
  },
  {
    id: "DISC-02",
    code: "DROP10",
    value: "10%",
    usage: "34 / 100",
    expires: "30 Oct 2026",
    status: "active",
  },
];

const DiscountList = () => {
  const navigate = useNavigate();

  const columns = [
    { key: "code", label: "Code" },
    { key: "value", label: "Discount" },
    { key: "usage", label: "Usage" },
    { key: "expires", label: "Expires" },
    {
      key: "status",
      label: "Status",
      render: (status) => (
        <StatusBadge status={status} />
      ),
    },
    {
      key: "edit",
      label: "",
      render: (_, discount) => (
        <button
          className="dashboard-icon-button"
          onClick={() =>
            navigate(
              `/businesses/modasphere/dashboard/discounts/${discount.id}/edit`
            )
          }
        >
          <Pencil size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <h1>Discounts</h1>
          <p>
            Create and manage promotional discount codes.
          </p>
        </div>

        <button
          className="dashboard-btn dashboard-btn-primary"
          onClick={() =>
            navigate(
              "/businesses/modasphere/dashboard/discounts/new"
            )
          }
        >
          <Plus size={16} />
          New discount
        </button>
      </div>

      <div className="dashboard-card">
        <DataTable
          columns={columns}
          data={discounts}
        />
      </div>
    </div>
  );
};

export default DiscountList;