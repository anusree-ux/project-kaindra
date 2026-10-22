import { useState } from "react";

const ShipOrderModal = ({ open, onClose }) => {
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");

  if (!open) return null;

  const submit = (event) => {
    event.preventDefault();

    console.log({
      carrier,
      tracking,
    });

    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        background: "rgba(0,0,0,.45)",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <form
        onSubmit={submit}
        className="dashboard-card"
        style={{
          width: "100%",
          maxWidth: 480,
          padding: 25,
        }}
      >
        <h2>Ship order</h2>

        <div className="dashboard-form">
          <div className="dashboard-field">
            <label>Shipping carrier</label>

            <input
              value={carrier}
              onChange={(e) =>
                setCarrier(e.target.value)
              }
              required
            />
          </div>

          <div className="dashboard-field">
            <label>Tracking number</label>

            <input
              value={tracking}
              onChange={(e) =>
                setTracking(e.target.value)
              }
              required
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
            }}
          >
            <button
              type="button"
              className="dashboard-btn dashboard-btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>

            <button className="dashboard-btn dashboard-btn-primary">
              Confirm shipment
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ShipOrderModal;