import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";

const orders = [
  {
    id: "ORD-1048",
    customer: "Aarav Sharma",
    date: "20 Oct 2026",
    total: "₹4,998",
    status: "processing",
  },
  {
    id: "ORD-1047",
    customer: "Meera Rao",
    date: "19 Oct 2026",
    total: "₹3,299",
    status: "shipped",
  },
  {
    id: "ORD-1046",
    customer: "Rahul Kumar",
    date: "18 Oct 2026",
    total: "₹7,499",
    status: "delivered",
  },
];

const OrderList = () => {
  const navigate = useNavigate();

  const columns = [
    { key: "id", label: "Order" },
    { key: "customer", label: "Customer" },
    { key: "date", label: "Date" },
    { key: "total", label: "Total" },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <StatusBadge status={value} />
      ),
    },
    {
      key: "view",
      label: "",
      render: (_, order) => (
        <button
          className="dashboard-icon-button"
          onClick={() =>
            navigate(
              `/businesses/modasphere/dashboard/orders/${order.id}`
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
          <h1>Orders</h1>
          <p>
            Track customer orders and fulfilment.
          </p>
        </div>
      </div>

      <div className="dashboard-card">
        <DataTable
          columns={columns}
          data={orders}
        />
      </div>
    </div>
  );
};

export default OrderList;