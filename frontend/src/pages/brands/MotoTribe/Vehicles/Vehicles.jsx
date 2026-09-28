import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import apiClient from "../../../../services/apiClient";
import "./Vehicles.css";

const emptyVehicle = {
  name: "",
  brand: "",
  model: "",
  year: "",
  registration: "",
  fuelType: "PETROL",
  mileage: "",
  engine: "",
  lastService: "",
  serviceDue: "",
};

const fuelTypes = ["PETROL", "ELECTRIC", "HYBRID"];

function Vehicles() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [vehicles, setVehicles] = useState(() => {
    try {
      const savedVehicles = localStorage.getItem("mototribeVehicles");
      if (savedVehicles) {
        return JSON.parse(savedVehicles);
      }
    } catch (err) {
      console.error(err);
    }
    return [];
  });
  const [form, setForm] = useState(emptyVehicle);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchDbVehicles = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await apiClient.get("/api/mototribe/vehicles/me").catch(() => null);
      const dbList = res?.data?.data?.vehicles;
      if (Array.isArray(dbList) && dbList.length > 0) {
        const mapped = dbList.map((v) => ({
          id: v._id,
          _id: v._id,
          name: v.vehicleName,
          brand: v.vehicleName.split(" ")[0] || "Motorcycle",
          model: v.vehicleName.split(" ").slice(1).join(" ") || "Model",
          registration: v.registrationNumber,
          fuelType: (v.fuelType || "PETROL").toUpperCase(),
          mileage: String(v.mileageKmpl || 28),
          isDefault: !!v.isDefault,
          createdAt: v.createdAt,
        }));
        setVehicles(mapped);
        localStorage.setItem("mototribeVehicles", JSON.stringify(mapped));
      }
    } catch (err) {
      console.error("Failed to fetch vehicles from DB:", err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchDbVehicles();
  }, [fetchDbVehicles]);

  useEffect(() => {
    const profile = localStorage.getItem("mototribeProfile");

    if (!profile && !isAuthenticated) {
      navigate("/businesses/mototribe/profile-setup");
    }
  }, [navigate, isAuthenticated]);

  const saveVehicles = (updatedVehicles) => {
    setVehicles(updatedVehicles);

    localStorage.setItem(
      "mototribeVehicles",
      JSON.stringify(updatedVehicles)
    );
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyVehicle);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const openEditForm = (vehicle) => {
    setEditingId(vehicle.id);
    setShowForm(true);
    setForm({
      name: vehicle.name || "",
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      year: vehicle.year || "",
      registration: vehicle.registration || "",
      fuelType: vehicle.fuelType || "PETROL",
      mileage: vehicle.mileage || "",
      engine: vehicle.engine || "",
      lastService: vehicle.lastService ? String(vehicle.lastService).split("T")[0] : "",
      serviceDue: vehicle.serviceDue ? String(vehicle.serviceDue).split("T")[0] : "",
    });

    setError("");
    setSuccess("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Please enter a motorcycle name.");
      return;
    }

    if (!form.brand.trim()) {
      setError("Please enter the motorcycle brand.");
      return;
    }

    if (!form.model.trim()) {
      setError("Please enter the motorcycle model.");
      return;
    }

    if (!form.registration.trim()) {
      setError("Please enter the registration number.");
      return;
    }

    if (!form.mileage || Number(form.mileage) <= 0) {
      setError("Please enter a valid mileage.");
      return;
    }

    const existingTarget = editingId ? vehicles.find((v) => v.id === editingId || v._id === editingId) : null;
    const vehicleData = {
      ...form,
      id: existingTarget?._id || existingTarget?.id || editingId || Date.now(),
      _id: existingTarget?._id || undefined,
      createdAt: existingTarget?.createdAt || new Date().toISOString(),
    };

    // Sync with backend DB if authenticated
    if (isAuthenticated) {
      if (existingTarget?._id) {
        apiClient.patch(`/api/mototribe/vehicles/${existingTarget._id}`, {
          vehicleName: form.name.trim(),
          registrationNumber: form.registration.trim(),
          mileageKmpl: Number(form.mileage) || 28,
          fuelType: (form.fuelType || "petrol").toLowerCase(),
        }).catch((err) => console.error("Failed to update vehicle in DB:", err));
      } else {
        apiClient.post("/api/mototribe/vehicles", {
          vehicleName: form.name.trim(),
          registrationNumber: form.registration.trim(),
          mileageKmpl: Number(form.mileage) || 28,
          fuelType: (form.fuelType || "petrol").toLowerCase(),
          isDefault: vehicles.length === 0,
        }).then((res) => {
          if (res?.data?.data?.vehicle?._id) {
            vehicleData._id = res.data.data.vehicle._id;
            vehicleData.id = res.data.data.vehicle._id;
            setVehicles((prev) => {
              const updated = prev.map((v) => (v.id === vehicleData.id ? { ...v, _id: res.data.data.vehicle._id, id: res.data.data.vehicle._id } : v));
              localStorage.setItem("mototribeVehicles", JSON.stringify(updated));
              return updated;
            });
          }
        }).catch((err) => console.error("Failed to create vehicle in DB:", err));
      }
    }

    let updatedVehicles;

    if (editingId) {
      updatedVehicles = vehicles.map((vehicle) =>
        (vehicle.id === editingId || vehicle._id === editingId)
          ? vehicleData
          : vehicle
      );

      setSuccess("Motorcycle updated successfully.");
    } else {
      updatedVehicles = [
        ...vehicles,
        vehicleData,
      ];

      setSuccess("Motorcycle added successfully.");
    }

    saveVehicles(updatedVehicles);

    setShowForm(false);
    setForm(emptyVehicle);
    setEditingId(null);
  };

  const deleteVehicle = async (id) => {
    const vehicle = vehicles.find(
      (item) => item.id === id || item._id === id
    );

    if (!vehicle) return;

    const confirmed = window.confirm(
      `Remove ${vehicle.name} from your MotoTribe garage?`
    );

    if (!confirmed) return;

    if (isAuthenticated && (vehicle._id || typeof vehicle.id === "string" && /^[0-9a-fA-F]{24}$/.test(vehicle.id))) {
      const dbId = vehicle._id || vehicle.id;
      apiClient.delete(`/api/mototribe/vehicles/${dbId}`).catch((err) =>
        console.error("Failed to delete vehicle from DB:", err)
      );
    }

    const updatedVehicles = vehicles.filter(
      (item) => item.id !== id && item._id !== id
    );

    saveVehicles(updatedVehicles);

    if (selectedVehicle?.id === id || selectedVehicle?._id === id) {
      setSelectedVehicle(null);
    }

    setSuccess("Motorcycle removed successfully.");
  };

  const setDefaultVehicle = async (id) => {
    const updatedVehicles = vehicles.map((vehicle) => ({
      ...vehicle,
      isDefault: vehicle.id === id || vehicle._id === id,
    }));

    saveVehicles(updatedVehicles);

    const vehicle = updatedVehicles.find(
      (item) => item.id === id || item._id === id
    );

    if (isAuthenticated && vehicle && (vehicle._id || typeof vehicle.id === "string" && /^[0-9a-fA-F]{24}$/.test(vehicle.id))) {
      const dbId = vehicle._id || vehicle.id;
      apiClient.patch(`/api/mototribe/vehicles/${dbId}`, { isDefault: true }).catch((err) =>
        console.error("Failed to set default vehicle in DB:", err)
      );
    }

    setSelectedVehicle(vehicle);
    setSuccess(
      `${vehicle.name} is now your default motorcycle.`
    );
  };

  return (
    <div className="moto-vehicles-page">

      <div className="vehicles-background">
        <div className="vehicle-glow vehicle-glow-one"></div>
        <div className="vehicle-glow vehicle-glow-two"></div>
      </div>

      <div className="moto-vehicles-container">

        <header className="vehicles-header">

          <div className="vehicles-brand">
            <span>MOTO</span>
            <strong>TRIBE</strong>
          </div>

          <div className="vehicles-step">
            MY MOTOTRIBE
          </div>

          <h1>Your motorcycles</h1>

          <p>
            Add the motorcycles you ride. Your vehicle
            information helps MotoTribe personalize
            journeys, fuel estimates and ride records.
          </p>

        </header>

        {success && (
          <div className="vehicle-message success">
            {success}
          </div>
        )}

        <div className="vehicle-topbar">

          <div>
            <span className="vehicle-count">
              {vehicles.length}
            </span>

            <span className="vehicle-count-label">
              MOTORCYCLE
              {vehicles.length !== 1 ? "S" : ""}
            </span>
          </div>

          <button
            className="add-vehicle-button"
            onClick={openAddForm}
          >
            + ADD MOTORCYCLE
          </button>

        </div>

        {vehicles.length === 0 ? (
          <div className="empty-vehicles">

            <div className="empty-icon">
              🏍
            </div>

            <h2>Your garage is empty</h2>

            <p>
              Add your first motorcycle to start building
              your MotoTribe rider profile.
            </p>

            <button
              className="add-first-button"
              onClick={openAddForm}
            >
              ADD YOUR FIRST MOTORCYCLE
            </button>

          </div>
        ) : (
          <div className="vehicles-grid">

            {vehicles.map((vehicle) => (
              <article
                className={`vehicle-card ${
                  vehicle.isDefault
                    ? "default-vehicle"
                    : ""
                }`}
                key={vehicle.id}
              >

                <div className="vehicle-card-top">

                  <span className="vehicle-type">
                    MOTORCYCLE
                  </span>

                  {vehicle.isDefault && (
                    <span className="default-badge">
                      DEFAULT
                    </span>
                  )}

                </div>

                <div className="motorcycle-symbol">
                  🏍
                </div>

                <h2>{vehicle.name}</h2>

                <p className="vehicle-model">
                  {vehicle.brand} {vehicle.model}
                </p>

                <div className="vehicle-specs">

                  <div>
                    <span>YEAR</span>
                    <strong>
                      {vehicle.year || "—"}
                    </strong>
                  </div>

                  <div>
                    <span>ENGINE</span>
                    <strong>
                      {vehicle.engine
                        ? `${vehicle.engine} CC`
                        : "—"}
                    </strong>
                  </div>

                  <div>
                    <span>FUEL</span>
                    <strong>
                      {vehicle.fuelType}
                    </strong>
                  </div>

                  <div>
                    <span>MILEAGE</span>
                    <strong>
                      {vehicle.mileage} KM/L
                    </strong>
                  </div>

                </div>

                <div className="registration-box">
                  <span>REGISTRATION</span>
                  <strong>
                    {vehicle.registration}
                  </strong>
                </div>

                <div className="vehicle-actions">

                  <button
                    onClick={() =>
                      setSelectedVehicle(vehicle)
                    }
                  >
                    VIEW
                  </button>

                  <button
                    onClick={() =>
                      openEditForm(vehicle)
                    }
                  >
                    EDIT
                  </button>

                  {!vehicle.isDefault && (
                    <button
                      onClick={() =>
                        setDefaultVehicle(vehicle.id)
                      }
                    >
                      SET DEFAULT
                    </button>
                  )}

                  <button
                    className="delete-action"
                    onClick={() =>
                      deleteVehicle(vehicle.id)
                    }
                  >
                    DELETE
                  </button>

                </div>

              </article>
            ))}

          </div>
        )}

        <div className="vehicles-navigation">

          <button
            onClick={() =>
              navigate("/businesses/mototribe/profile-setup")
            }
          >
            ← PROFILE
          </button>

          <button
            onClick={() =>
              navigate("/businesses/mototribe")
            }
          >
            CONTINUE TO MOTOTRIBE →
          </button>

        </div>

        <footer className="vehicles-footer">
          FRONTEND PROTOTYPE • VEHICLE DATA STORED LOCALLY
        </footer>

      </div>

      {/* ADD / EDIT MODAL */}

      {showForm && (
        <div className="vehicle-modal-overlay">

          <div className="vehicle-modal">

            <div className="modal-header">

              <div>
                <span>
                  {editingId
                    ? "UPDATE VEHICLE"
                    : "ADD VEHICLE"}
                </span>

                <h2>
                  {editingId
                    ? "Edit motorcycle"
                    : "Add motorcycle"}
                </h2>
              </div>

              <button
                onClick={() => setShowForm(false)}
              >
                ×
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              <div className="vehicle-form-grid">

                <div className="vehicle-field full">
                  <label>MOTORCYCLE NAME *</label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Thunder"
                  />
                </div>

                <div className="vehicle-field">
                  <label>BRAND *</label>

                  <input
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    placeholder="e.g. Royal Enfield"
                  />
                </div>

                <div className="vehicle-field">
                  <label>MODEL *</label>

                  <input
                    name="model"
                    value={form.model}
                    onChange={handleChange}
                    placeholder="e.g. Himalayan"
                  />
                </div>

                <div className="vehicle-field">
                  <label>YEAR</label>

                  <input
                    type="number"
                    name="year"
                    value={form.year}
                    onChange={handleChange}
                    placeholder="2026"
                    min="1900"
                    max="2100"
                  />
                </div>

                <div className="vehicle-field">
                  <label>ENGINE CC</label>

                  <input
                    type="number"
                    name="engine"
                    value={form.engine}
                    onChange={handleChange}
                    placeholder="450"
                  />
                </div>

                <div className="vehicle-field full">
                  <label>REGISTRATION NUMBER *</label>

                  <input
                    name="registration"
                    value={form.registration}
                    onChange={handleChange}
                    placeholder="AP 00 XX 0000"
                  />
                </div>

                <div className="vehicle-field">
                  <label>FUEL TYPE</label>

                  <select
                    name="fuelType"
                    value={form.fuelType}
                    onChange={handleChange}
                  >
                    {fuelTypes.map((fuel) => (
                      <option
                        key={fuel}
                        value={fuel}
                      >
                        {fuel}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="vehicle-field">
                  <label>MILEAGE KM/L *</label>

                  <input
                    type="number"
                    name="mileage"
                    value={form.mileage}
                    onChange={handleChange}
                    placeholder="30"
                    min="1"
                    step="0.1"
                  />
                </div>

                <div className="vehicle-field">
                  <label>LAST SERVICE</label>

                  <input
                    type="date"
                    name="lastService"
                    value={form.lastService}
                    onChange={handleChange}
                    onClick={(e) => {
                      try {
                        e.target.showPicker?.();
                      } catch (err) {
                        /* ignore showPicker error */
                      }
                    }}
                  />
                </div>

                <div className="vehicle-field">
                  <label>NEXT SERVICE</label>

                  <input
                    type="date"
                    name="serviceDue"
                    value={form.serviceDue}
                    onChange={handleChange}
                    onClick={(e) => {
                      try {
                        e.target.showPicker?.();
                      } catch (err) {
                        /* ignore showPicker error */
                      }
                    }}
                  />
                </div>

              </div>

              {error && (
                <div className="vehicle-message error">
                  {error}
                </div>
              )}

              <button
                className="save-vehicle-button"
                type="submit"
              >
                {editingId
                  ? "UPDATE MOTORCYCLE"
                  : "ADD MOTORCYCLE"}
              </button>

            </form>

          </div>

        </div>
      )}

      {/* VEHICLE DETAILS MODAL */}

      {selectedVehicle && (
        <div className="vehicle-modal-overlay">

          <div className="vehicle-details-modal">

            <button
              className="details-close"
              onClick={() =>
                setSelectedVehicle(null)
              }
            >
              ×
            </button>

            <span className="details-label">
              RIDER VEHICLE
            </span>

            <div className="details-symbol">
              🏍
            </div>

            <h2>{selectedVehicle.name}</h2>

            <p>
              {selectedVehicle.brand}{" "}
              {selectedVehicle.model}
            </p>

            <div className="details-grid">

              <div>
                <span>REGISTRATION</span>
                <strong>
                  {selectedVehicle.registration}
                </strong>
              </div>

              <div>
                <span>FUEL</span>
                <strong>
                  {selectedVehicle.fuelType}
                </strong>
              </div>

              <div>
                <span>MILEAGE</span>
                <strong>
                  {selectedVehicle.mileage} KM/L
                </strong>
              </div>

              <div>
                <span>ENGINE</span>
                <strong>
                  {selectedVehicle.engine
                    ? `${selectedVehicle.engine} CC`
                    : "Not added"}
                </strong>
              </div>

              <div>
                <span>LAST SERVICE</span>
                <strong>
                  {selectedVehicle.lastService ||
                    "Not added"}
                </strong>
              </div>

              <div>
                <span>NEXT SERVICE</span>
                <strong>
                  {selectedVehicle.serviceDue ||
                    "Not added"}
                </strong>
              </div>

            </div>

            {!selectedVehicle.isDefault && (
              <button
                className="details-default-button"
                onClick={() =>
                  setDefaultVehicle(
                    selectedVehicle.id
                  )
                }
              >
                SET AS DEFAULT MOTORCYCLE
              </button>
            )}

          </div>

        </div>
      )}

    </div>
  );
}

export default Vehicles;