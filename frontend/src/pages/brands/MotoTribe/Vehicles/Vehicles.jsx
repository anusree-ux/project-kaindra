import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(emptyVehicle);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const profile = localStorage.getItem("mototribeProfile");

    if (!profile) {
      navigate("/businesses/mototribe/profile-setup");
      return;
    }

    const savedVehicles = localStorage.getItem(
      "mototribeVehicles"
    );

    if (savedVehicles) {
      setVehicles(JSON.parse(savedVehicles));
    }
  }, [navigate]);

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
    setForm({
      name: vehicle.name || "",
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      year: vehicle.year || "",
      registration: vehicle.registration || "",
      fuelType: vehicle.fuelType || "PETROL",
      mileage: vehicle.mileage || "",
      engine: vehicle.engine || "",
      lastService: vehicle.lastService || "",
      serviceDue: vehicle.serviceDue || "",
    });

    setShowForm(true);
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

    const vehicleData = {
      ...form,
      id: editingId || Date.now(),
      createdAt:
        editingId
          ? vehicles.find((vehicle) => vehicle.id === editingId)
              ?.createdAt || new Date().toISOString()
          : new Date().toISOString(),
    };

    let updatedVehicles;

    if (editingId) {
      updatedVehicles = vehicles.map((vehicle) =>
        vehicle.id === editingId
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

  const deleteVehicle = (id) => {
    const vehicle = vehicles.find(
      (item) => item.id === id
    );

    if (!vehicle) return;

    const confirmed = window.confirm(
      `Remove ${vehicle.name} from your MotoTribe garage?`
    );

    if (!confirmed) return;

    const updatedVehicles = vehicles.filter(
      (item) => item.id !== id
    );

    saveVehicles(updatedVehicles);

    if (selectedVehicle?.id === id) {
      setSelectedVehicle(null);
    }

    setSuccess("Motorcycle removed successfully.");
  };

  const setDefaultVehicle = (id) => {
    const updatedVehicles = vehicles.map((vehicle) => ({
      ...vehicle,
      isDefault: vehicle.id === id,
    }));

    saveVehicles(updatedVehicles);

    const vehicle = updatedVehicles.find(
      (item) => item.id === id
    );

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
                  />
                </div>

                <div className="vehicle-field">
                  <label>NEXT SERVICE</label>

                  <input
                    type="date"
                    name="serviceDue"
                    value={form.serviceDue}
                    onChange={handleChange}
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