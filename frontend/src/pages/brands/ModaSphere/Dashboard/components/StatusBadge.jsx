const successStatuses = [
  "active",
  "paid",
  "delivered",
  "completed",
  "accepted",
  "published",
];

const warningStatuses = [
  "pending",
  "processing",
  "quoted",
  "in_production",
  "scheduled",
];

const dangerStatuses = [
  "cancelled",
  "rejected",
  "failed",
  "expired",
];

const infoStatuses = [
  "open",
  "shipped",
  "confirmed",
  "draft",
];

const StatusBadge = ({ status = "unknown" }) => {
  const normalized = String(status).toLowerCase();

  let type = "neutral";

  if (successStatuses.includes(normalized)) {
    type = "success";
  } else if (warningStatuses.includes(normalized)) {
    type = "warning";
  } else if (dangerStatuses.includes(normalized)) {
    type = "danger";
  } else if (infoStatuses.includes(normalized)) {
    type = "info";
  }

  return (
    <span className={`dashboard-status dashboard-status-${type}`}>
      {normalized.replaceAll("_", " ")}
    </span>
  );
};

export default StatusBadge;