import { Inbox } from "lucide-react";

const EmptyState = ({
  title = "Nothing here yet",
  description = "There is currently no data to display.",
  action,
}) => (
  <div
    style={{
      padding: "55px 20px",
      textAlign: "center",
    }}
  >
    <div
      style={{
        width: 48,
        height: 48,
        margin: "0 auto 14px",
        borderRadius: 12,
        background: "#f5f5f5",
        display: "grid",
        placeItems: "center",
      }}
    >
      <Inbox size={21} />
    </div>

    <h3 style={{ margin: "0 0 7px" }}>
      {title}
    </h3>

    <p
      style={{
        margin: "0 auto",
        maxWidth: 400,
        color: "#777",
        fontSize: 13,
      }}
    >
      {description}
    </p>

    {action && (
      <div style={{ marginTop: 18 }}>
        {action}
      </div>
    )}
  </div>
);

export default EmptyState;