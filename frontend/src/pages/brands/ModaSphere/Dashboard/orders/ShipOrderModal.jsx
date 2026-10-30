import { useState } from "react";
import { Loader2 } from "lucide-react";

const ShipOrderModal = ({ open, onClose, onShip, loading, error }) => {
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");

  if (!open) return null;

  const submit = (event) => {
    event.preventDefault();
    if (onShip) {
      onShip({
        carrier,
        trackingNumber: tracking,
      });
    }
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

        {error && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #ef4444",
              color: "#b91c1c",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <div className="dashboard-form">
          <div className="dashboard-field">
            <label>Shipping carrier</label>

            <input
              value={carrier}
              placeholder="e.g. BlueDart, Delhivery, FedEx"
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
              placeholder="e.g. BLD123456789IN"
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
              marginTop: 10,
            }}
          >
            <button
              type="button"
              className="dashboard-btn dashboard-btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="dashboard-btn dashboard-btn-primary"
              disabled={loading}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              {loading && <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />}
              Confirm shipment
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ShipOrderModal;