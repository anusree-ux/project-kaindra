import {
  Check,
  Clock,
  Truck,
  Package,
  AlertCircle,
} from "lucide-react";

const formatTimelineDate = (dateVal) => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const ShipmentTimeline = ({ order, shipment }) => {
  if (!order) {
    return (
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <h2>Shipment timeline</h2>
        </div>
        <div className="dashboard-card-body" style={{ padding: "24px", color: "#888" }}>
          Loading timeline data...
        </div>
      </div>
    );
  }

  const isCancelled = order.status === "cancelled";
  const isDelivered = order.status === "delivered";
  const isShipped = ["shipped", "delivered"].includes(order.status);
  const isPaid = ["paid", "shipped", "delivered"].includes(order.status);

  // Construct real chronological events from the live order & shipment record
  const events = [];

  // 1. Order Placed
  events.push({
    key: "placed",
    title: "Order placed",
    date: formatTimelineDate(order.createdAt),
    description: `Order #${order._id ? order._id.slice(-6).toUpperCase() : ""} placed by customer`,
    status: "completed",
    icon: Package,
  });

  // 2. Payment confirmed
  if (isCancelled && order.status !== "paid" && !order.razorpayPaymentId) {
    events.push({
      key: "cancelled",
      title: "Order cancelled",
      date: formatTimelineDate(order.updatedAt),
      description: "Order was cancelled prior to payment.",
      status: "cancelled",
      icon: AlertCircle,
    });
  } else {
    events.push({
      key: "payment",
      title: "Payment confirmed",
      date: isPaid ? formatTimelineDate(order.createdAt) : "Awaiting payment",
      description: isPaid
        ? (order.razorpayPaymentId
            ? `Verified online payment (Payment ID: ${order.razorpayPaymentId})`
            : "Prepaid transaction verified")
        : "Awaiting customer payment confirmation",
      status: isPaid ? "completed" : "pending",
      icon: Check,
    });

    // 3. Processing
    events.push({
      key: "processing",
      title: "Processing & Packaging",
      date: isPaid ? formatTimelineDate(order.createdAt) : "",
      description: isShipped
        ? "Quality check passed, packaged for dispatch"
        : isPaid
        ? "Order is being packed and scheduled for courier pickup"
        : "Awaiting payment verification",
      status: isShipped ? "completed" : isPaid ? "current" : "pending",
      icon: Clock,
    });

    // 4. Shipped / Dispatched
    const shipDate =
      shipment?.createdAt || (isShipped ? order.updatedAt : null);
    events.push({
      key: "shipped",
      title: isShipped
        ? `Shipped${shipment?.carrier ? ` via ${shipment.carrier}` : ""}`
        : "Courier dispatch",
      date: isShipped ? formatTimelineDate(shipDate) : "Awaiting shipment",
      description: isShipped
        ? shipment?.trackingNumber
          ? `Dispatched via ${shipment.carrier || "Courier"} · Tracking #${shipment.trackingNumber}`
          : "Package handed over to logistics partner"
        : "Order not yet shipped. Use the Ship Order button above to dispatch.",
      status: isDelivered ? "completed" : isShipped ? "current" : "pending",
      icon: Truck,
      trackingNumber: isShipped ? shipment?.trackingNumber : null,
      carrier: isShipped ? shipment?.carrier : null,
    });

    // 5. Additional granular updates from shipment.timeline
    if (shipment?.timeline && Array.isArray(shipment.timeline)) {
      shipment.timeline.forEach((item, idx) => {
        if (
          item.status === "in_transit" ||
          item.status === "out_for_delivery"
        ) {
          events.push({
            key: `transit-${idx}`,
            title:
              item.status === "out_for_delivery"
                ? "Out for delivery"
                : "In transit",
            date: formatTimelineDate(item.timestamp),
            description: item.note || "Logistics status update",
            status: isDelivered ? "completed" : "current",
            icon: Truck,
          });
        }
      });
    }

    // 6. Delivery or Cancellation
    if (isCancelled) {
      events.push({
        key: "cancelled",
        title: "Order cancelled",
        date: formatTimelineDate(order.updatedAt),
        description:
          order.refundStatus === "processed"
            ? "Refund completed to original payment method."
            : "Order was cancelled.",
        status: "cancelled",
        icon: AlertCircle,
      });
    } else {
      events.push({
        key: "delivered",
        title: "Delivered",
        date: isDelivered
          ? formatTimelineDate(order.deliveredAt || order.updatedAt)
          : shipment?.estimatedDeliveryDate
          ? `Est. delivery: ${formatTimelineDate(shipment.estimatedDeliveryDate)}`
          : "Pending delivery",
        description: isDelivered
          ? "Package confirmed delivered to customer"
          : "Customer receipt confirmation pending",
        status: isDelivered ? "completed" : "pending",
        icon: Check,
      });
    }
  }

  return (
    <div className="dashboard-card">
      <div
        className="dashboard-card-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <h2>Shipment timeline</h2>

        {shipment?.trackingNumber && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: "#f3f4f6",
              color: "#1f2937",
              padding: "4px 10px",
              borderRadius: "6px",
              border: "1px solid #e5e7eb",
            }}
          >
            <Truck size={14} color="#b89552" />
            {shipment.carrier || "Courier"}: #{shipment.trackingNumber}
          </span>
        )}
      </div>

      <div className="dashboard-card-body" style={{ padding: "20px 24px" }}>
        <div style={{ position: "relative", paddingLeft: "8px" }}>
          {events.map((event, index) => {
            const isLast = index === events.length - 1;
            const isCompleted = event.status === "completed";
            const isCurrent = event.status === "current";
            const isCancelledStep = event.status === "cancelled";

            let dotBg = "#e5e7eb";
            let dotColor = "#9ca3af";
            let dotBorder = "2px solid #d1d5db";

            if (isCompleted) {
              dotBg = "#111827";
              dotColor = "#fff";
              dotBorder = "2px solid #111827";
            } else if (isCurrent) {
              dotBg = "#b89552";
              dotColor = "#fff";
              dotBorder = "3px solid #fef3c7";
            } else if (isCancelledStep) {
              dotBg = "#ef4444";
              dotColor = "#fff";
              dotBorder = "2px solid #ef4444";
            }

            return (
              <div
                key={event.key || index}
                style={{
                  display: "flex",
                  gap: 16,
                  position: "relative",
                  paddingBottom: isLast ? 0 : 26,
                }}
              >
                {/* Connecting Line */}
                {!isLast && (
                  <div
                    style={{
                      position: "absolute",
                      left: 11,
                      top: 24,
                      bottom: 0,
                      width: 2,
                      backgroundColor: isCompleted ? "#111827" : "#e5e7eb",
                      transition: "background-color 0.3s ease",
                    }}
                  />
                )}

                {/* Dot / Icon */}
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    backgroundColor: dotBg,
                    color: dotColor,
                    border: dotBorder,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    zIndex: 2,
                    boxShadow: isCurrent
                      ? "0 0 0 3px rgba(184, 149, 82, 0.25)"
                      : "none",
                  }}
                >
                  {isCompleted ? (
                    <Check size={13} strokeWidth={3} />
                  ) : isCurrent ? (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#fff",
                      }}
                    />
                  ) : isCancelledStep ? (
                    <span style={{ fontSize: 11, fontWeight: "bold" }}>✕</span>
                  ) : (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: "#9ca3af",
                      }}
                    />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, marginTop: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <strong
                      style={{
                        fontSize: 14,
                        color: isCompleted || isCurrent ? "#111827" : "#9ca3af",
                        fontWeight: isCurrent ? 700 : 600,
                      }}
                    >
                      {event.title}
                    </strong>

                    {event.date && (
                      <span
                        style={{
                          fontSize: 12,
                          color: isCurrent ? "#b89552" : isCompleted ? "#6b7280" : "#9ca3af",
                          fontWeight: isCurrent ? 600 : 400,
                        }}
                      >
                        {event.date}
                      </span>
                    )}
                  </div>

                  {event.description && (
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 12,
                        color: isCurrent ? "#374151" : "#6b7280",
                        lineHeight: 1.5,
                      }}
                    >
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ShipmentTimeline;