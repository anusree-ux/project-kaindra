const events = [
  {
    title: "Order placed",
    date: "18 Oct 2026, 10:30 AM",
  },
  {
    title: "Payment confirmed",
    date: "18 Oct 2026, 10:31 AM",
  },
  {
    title: "Processing",
    date: "19 Oct 2026, 09:20 AM",
  },
];

const ShipmentTimeline = () => (
  <div className="dashboard-card">
    <div className="dashboard-card-header">
      <h2>Shipment timeline</h2>
    </div>

    <div className="dashboard-card-body">
      {events.map((event, index) => (
        <div
          key={event.title}
          style={{
            display: "flex",
            gap: 14,
            paddingBottom: 22,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              marginTop: 4,
              borderRadius: "50%",
              background: index === events.length - 1
                ? "#111"
                : "#bbb",
              flexShrink: 0,
            }}
          />

          <div>
            <strong style={{ fontSize: 13 }}>
              {event.title}
            </strong>

            <div
              style={{
                color: "#888",
                fontSize: 11,
                marginTop: 4,
              }}
            >
              {event.date}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ShipmentTimeline;