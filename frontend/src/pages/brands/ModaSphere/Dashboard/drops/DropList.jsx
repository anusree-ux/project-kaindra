import { useMemo, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";

import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import DropTabs from "./DropTabs";

const drops = [
  {
    id: "DROP-01",
    name: "Autumn Essentials",
    release: "24 Oct 2026",
    stock: 100,
    status: "scheduled",
  },
  {
    id: "DROP-02",
    name: "Streetwear Edit",
    release: "15 Oct 2026",
    stock: 50,
    status: "active",
  },
];

const DropList = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");

  const filtered = useMemo(
    () =>
      tab === "all"
        ? drops
        : drops.filter(
            (drop) => drop.status === tab
          ),
    [tab]
  );

  const columns = [
    { key: "name", label: "Drop" },
    { key: "release", label: "Release" },
    { key: "stock", label: "Drop stock" },
    {
      key: "status",
      label: "Status",
      render: (status) => (
        <StatusBadge status={status} />
      ),
    },
    {
      key: "action",
      label: "",
      render: (_, drop) => (
        <button
          className="dashboard-icon-button"
          onClick={() =>
            navigate(
              `/businesses/modasphere/dashboard/drops/${drop.id}/edit`
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
          <h1>Product Drops</h1>
          <p>
            Plan limited releases and manage drop inventory.
          </p>
        </div>

        <button
          className="dashboard-btn dashboard-btn-primary"
          onClick={() =>
            navigate(
              "/businesses/modasphere/dashboard/drops/new"
            )
          }
        >
          <Plus size={16} />
          Create drop
        </button>
      </div>

      <DropTabs value={tab} onChange={setTab} />

      <div className="dashboard-card">
        <DataTable
          columns={columns}
          data={filtered}
        />
      </div>
    </div>
  );
};

export default DropList;