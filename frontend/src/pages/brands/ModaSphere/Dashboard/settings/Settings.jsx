import { useState } from "react";
import SellerProfileForm from "./SellerProfileForm";
import ManufacturerProfileForm from "./ManufacturerProfileForm";

const Settings = () => {
  const [type, setType] = useState("seller");

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <h1>Settings</h1>
          <p>
            Manage your ModaSphere business profile.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
        }}
      >
        <button
          className={`dashboard-btn ${
            type === "seller"
              ? "dashboard-btn-primary"
              : "dashboard-btn-secondary"
          }`}
          onClick={() => setType("seller")}
        >
          Seller
        </button>

        <button
          className={`dashboard-btn ${
            type === "manufacturer"
              ? "dashboard-btn-primary"
              : "dashboard-btn-secondary"
          }`}
          onClick={() =>
            setType("manufacturer")
          }
        >
          Manufacturer
        </button>
      </div>

      {type === "seller" ? (
        <SellerProfileForm />
      ) : (
        <ManufacturerProfileForm />
      )}
    </div>
  );
};

export default Settings;