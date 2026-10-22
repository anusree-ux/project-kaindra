const DateRangePicker = ({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}) => (
  <div
    style={{
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
    }}
  >
    <input
      type="date"
      value={startDate}
      onChange={(event) =>
        onStartChange(event.target.value)
      }
      style={{
        height: 40,
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: "0 10px",
      }}
    />

    <input
      type="date"
      value={endDate}
      onChange={(event) =>
        onEndChange(event.target.value)
      }
      style={{
        height: 40,
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: "0 10px",
      }}
    />
  </div>
);

export default DateRangePicker;