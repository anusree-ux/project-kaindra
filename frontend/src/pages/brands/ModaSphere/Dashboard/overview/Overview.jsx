import { useEffect, useState } from "react";
import {
  IndianRupee,
  Package,
  ShoppingBag,
  Rocket,
  RefreshCw,
} from "lucide-react";

import StatCard from "../components/StatCard";
import SalesTrendChart from "../components/SalesTrendChart";
import LowStockPanel from "./LowStockPanel";
import DropsSummary from "./DropsSummary";
import {
  getSellerSummary,
  getSellerSalesTrend,
  getSellerLowStock,
  getSellerProducts,
  getSellerDrops,
} from "../services/dashboardApi";

const defaultTrend = [
  { label: "Mon", sales: 0 },
  { label: "Tue", sales: 0 },
  { label: "Wed", sales: 0 },
  { label: "Thu", sales: 0 },
  { label: "Fri", sales: 0 },
  { label: "Sat", sales: 0 },
  { label: "Sun", sales: 0 },
];

const Overview = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    distinctOrders: 0,
    totalUnitsSold: 0,
  });
  const [salesTrend, setSalesTrend] = useState(defaultTrend);
  const [products, setProducts] = useState([]);
  const [drops, setDrops] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, trendRes, prodRes, dropRes, lowRes] = await Promise.allSettled([
        getSellerSummary(),
        getSellerSalesTrend({ interval: "day" }),
        getSellerProducts(),
        getSellerDrops(),
        getSellerLowStock(),
      ]);

      if (sumRes.status === "fulfilled" && sumRes.value) {
        setSummary(sumRes.value);
      }
      if (trendRes.status === "fulfilled" && Array.isArray(trendRes.value) && trendRes.value.length > 0) {
        setSalesTrend(trendRes.value);
      }
      if (prodRes.status === "fulfilled" && Array.isArray(prodRes.value)) {
        setProducts(prodRes.value);
      }
      if (dropRes.status === "fulfilled" && Array.isArray(dropRes.value)) {
        setDrops(dropRes.value);
      }
      if (lowRes.status === "fulfilled" && Array.isArray(lowRes.value)) {
        setLowStock(lowRes.value);
      }
    } catch (err) {
      console.error("[Overview] Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeProducts = products.filter((p) => p.status === "active").length;
  const activeDrops = drops.filter((d) => d.status === "active").length;
  const scheduledDrops = drops.filter((d) => d.status === "scheduled").length;

  const formattedRevenue = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(summary.totalRevenue || 0);

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <h1>Overview</h1>
          <p>
            Monitor your live ModaSphere business and sales performance.
          </p>
        </div>

        <button
          className="dashboard-btn dashboard-btn-secondary"
          onClick={fetchData}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          <span>{loading ? "Syncing..." : "Refresh"}</span>
        </button>
      </div>

      <div className="dashboard-stats-grid">
        <StatCard
          title="Total Revenue"
          value={formattedRevenue}
          description="Gross lifetime sales"
          icon={IndianRupee}
        />

        <StatCard
          title="Orders"
          value={String(summary.distinctOrders || 0)}
          description={`${summary.totalUnitsSold || 0} total units sold`}
          icon={ShoppingBag}
        />

        <StatCard
          title="Products"
          value={String(products.length)}
          description={`${activeProducts} currently active`}
          icon={Package}
        />

        <StatCard
          title="Active Drops"
          value={String(activeDrops)}
          description={`${scheduledDrops} scheduled drops`}
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
            Daily volume
          </span>
        </div>

        <div className="dashboard-card-body">
          <SalesTrendChart data={salesTrend} />
        </div>
      </div>

      <div className="dashboard-two-column">
        <LowStockPanel items={lowStock.length > 0 ? lowStock : products.filter((p) => (p.stock ?? 10) < 10)} />
        <DropsSummary drops={drops} />
      </div>
    </div>
  );
};

export default Overview;