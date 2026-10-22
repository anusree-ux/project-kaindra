import {
  IndianRupee,
  Package,
  ShoppingBag,
  Rocket,
} from "lucide-react";

import StatCard from "../components/StatCard";
import SalesTrendChart from "../components/SalesTrendChart";
import LowStockPanel from "./LowStockPanel";
import DropsSummary from "./DropsSummary";

const salesData = [
  { label: "Mon", sales: 12000 },
  { label: "Tue", sales: 18000 },
  { label: "Wed", sales: 15000 },
  { label: "Thu", sales: 26000 },
  { label: "Fri", sales: 22000 },
  { label: "Sat", sales: 34000 },
  { label: "Sun", sales: 29000 },
];

const Overview = () => (
  <div className="dashboard-page">
    <div className="dashboard-page-header">
      <div>
        <h1>Overview</h1>
        <p>
          Monitor your ModaSphere business performance.
        </p>
      </div>
    </div>

    <div className="dashboard-stats-grid">
      <StatCard
        title="Total Revenue"
        value="₹1,28,450"
        change="+12.4% this month"
        icon={IndianRupee}
      />

      <StatCard
        title="Orders"
        value="248"
        change="+8.2% this month"
        icon={ShoppingBag}
      />

      <StatCard
        title="Products"
        value="64"
        description="58 currently active"
        icon={Package}
      />

      <StatCard
        title="Active Drops"
        value="4"
        description="2 scheduled"
        icon={Rocket}
      />
    </div>

    <div className="dashboard-card">
      <div className="dashboard-card-header">
        <div>
          <h2>Sales trend</h2>
        </div>

        <span
          style={{
            color: "#777",
            fontSize: 12,
          }}
        >
          Last 7 days
        </span>
      </div>

      <div className="dashboard-card-body">
        <SalesTrendChart data={salesData} />
      </div>
    </div>

    <div className="dashboard-two-column">
      <LowStockPanel />
      <DropsSummary />
    </div>
  </div>
);

export default Overview;