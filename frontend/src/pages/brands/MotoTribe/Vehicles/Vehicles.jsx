import { useState } from "react";
import "./Vehicles.css";

const EMPTY_VEHICLE = {
  name: "",
  registrationNumber: "",
  fuelType: "",
  mileage: "",
};

const FUEL_TYPES = ["Petrol", "Diesel", "Electric", "CNG"];

function createVehicleId() {
  return `vehicle-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function getInitialVehicles() {
  try {
    const savedVehicles = localStorage.getItem("mototribe_vehicles");

    if (!savedVehicles) {
      return [];
    }

    const parsedVehicles = JSON.parse(savedVehicles);

    if (!Array.isArray(parsedVehicles)) {
      return [];
    }

    return parsedVehicles.filter(
      (vehicle) =>
        vehicle &&
        typeof vehicle === "object" &&
        typeof vehicle.id === "string"
    );
  } catch (error) {
    console.error("Error loading vehicles:", error);
    return [];
  }
}

function Vehicles() {
  const [vehicles, setVehicles] = useState(getInitialVehicles);
  const [formData, setFormData] = useState({
    ...EMPTY_VEHICLE,
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const saveVehicles = (updatedVehicles) => {
    try {
      localStorage.setItem(
        "mototribe_vehicles",
        JSON.stringify(updatedVehicles)
      );

      setVehicles(updatedVehicles);
      return true;
    } catch (storageError) {
      console.error("Error saving vehicles:", storageError);
      setError(
        "Unable to save vehicle information on this device."
      );
      return false;
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const openAddForm = () => {
    setFormData({
      ...EMPTY_VEHICLE,
    });

    setEditingId(null);
    clearMessages();
    setShowForm(true);
  };

  const openEditForm = (vehicle) => {
    setFormData({
      name: vehicle.name || "",
      registrationNumber: vehicle.registrationNumber || "",
      fuelType: vehicle.fuelType || "",
      mileage:
        vehicle.mileage !== undefined && vehicle.mileage !== null
          ? String(vehicle.mileage)
          : "",
    });

    setEditingId(vehicle.id);
    clearMessages();
    setShowForm(true);
  };

  const closeForm = () => {
    setFormData({
      ...EMPTY_VEHICLE,
    });

    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const validateVehicle = () => {
    const vehicleName = formData.name.trim();
    const registrationNumber =
      formData.registrationNumber.trim();

    if (!vehicleName) {
      return "Please enter the vehicle name.";
    }

    if (vehicleName.length < 2) {
      return "Vehicle name must contain at least 2 characters.";
    }

    if (!registrationNumber) {
      return "Please enter the registration number.";
    }

    if (registrationNumber.length < 4) {
      return "Please enter a valid registration number.";
    }

    if (!formData.fuelType) {
      return "Please select the fuel type.";
    }

    if (!FUEL_TYPES.includes(formData.fuelType)) {
      return "Please select a valid fuel type.";
    }

    if (!formData.mileage.trim()) {
      return "Please enter the mileage.";
    }

    const mileageValue = Number(formData.mileage);

    if (
      !Number.isFinite(mileageValue) ||
      mileageValue <= 0
    ) {
      return "Please enter a valid mileage greater than 0.";
    }

    if (mileageValue > 500) {
      return "Please enter a realistic mileage value.";
    }

    return "";
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    clearMessages();

    const validationMessage = validateVehicle();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    const vehicleData = {
      name: formData.name.trim(),
      registrationNumber: formData.registrationNumber
        .trim()
        .toUpperCase()
        .replace(/\s+/g, " "),
      fuelType: formData.fuelType,
      mileage: Number(formData.mileage),
    };

    if (editingId) {
      const vehicleExists = vehicles.some(
        (vehicle) => vehicle.id === editingId
      );

      if (!vehicleExists) {
        setError(
          "The vehicle you are trying to update could not be found."
        );
        return;
      }

      const duplicateRegistration = vehicles.some(
        (vehicle) =>
          vehicle.id !== editingId &&
          vehicle.registrationNumber?.toUpperCase() ===
            vehicleData.registrationNumber
      );

      if (duplicateRegistration) {
        setError(
          "A vehicle with this registration number already exists."
        );
        return;
      }

      const updatedVehicles = vehicles.map((vehicle) =>
        vehicle.id === editingId
          ? {
              ...vehicle,
              ...vehicleData,
              updatedAt: new Date().toISOString(),
            }
          : vehicle
      );

      if (!saveVehicles(updatedVehicles)) {
        return;
      }

      setSuccess("Vehicle updated successfully.");
    } else {
      const duplicateRegistration = vehicles.some(
        (vehicle) =>
          vehicle.registrationNumber?.toUpperCase() ===
          vehicleData.registrationNumber
      );

      if (duplicateRegistration) {
        setError(
          "A vehicle with this registration number already exists."
        );
        return;
      }

      const newVehicle = {
        id: createVehicleId(),
        ...vehicleData,
        isDefault: vehicles.length === 0,
        createdAt: new Date().toISOString(),
      };

      if (
        !saveVehicles([
          ...vehicles,
          newVehicle,
        ])
      ) {
        return;
      }

      setSuccess("Vehicle added successfully.");
    }

    setFormData({
      ...EMPTY_VEHICLE,
    });

    setEditingId(null);
    setShowForm(false);
  };

  const handleDelete = (vehicleId) => {
    const vehicle = vehicles.find(
      (item) => item.id === vehicleId
    );

    if (!vehicle) {
      return;
    }

    const shouldDelete = window.confirm(
      `Are you sure you want to delete "${vehicle.name}"?`
    );

    if (!shouldDelete) {
      return;
    }

    let updatedVehicles = vehicles.filter(
      (item) => item.id !== vehicleId
    );

    if (
      vehicle.isDefault &&
      updatedVehicles.length > 0
    ) {
      updatedVehicles = updatedVehicles.map(
        (item, index) => ({
          ...item,
          isDefault: index === 0,
        })
      );
    }

    if (!saveVehicles(updatedVehicles)) {
      return;
    }

    if (editingId === vehicleId) {
      closeForm();
    }

    setSuccess("Vehicle deleted successfully.");
    setError("");
  };

  const setDefaultVehicle = (vehicleId) => {
    const vehicleExists = vehicles.some(
      (vehicle) => vehicle.id === vehicleId
    );

    if (!vehicleExists) {
      return;
    }

    const updatedVehicles = vehicles.map(
      (vehicle) => ({
        ...vehicle,
        isDefault: vehicle.id === vehicleId,
      })
    );

    if (!saveVehicles(updatedVehicles)) {
      return;
    }

    setSuccess("Default vehicle updated.");
    setError("");
  };

  return (
    <main className="vehicles-page">
      <div className="vehicles-container">
        <header className="vehicles-header">
          <div className="vehicles-heading">
            <span className="vehicles-eyebrow">
              MOTOTRIBE / MY GARAGE
            </span>

            <h1>My Vehicles</h1>

            <p>
              Manage your motorcycles and vehicles for
              your MotoTribe journeys.
            </p>
          </div>

          <button
            type="button"
            className="add-vehicle-button"
            onClick={openAddForm}
          >
            + Add Vehicle
          </button>
        </header>

        {success && (
          <div
            className="vehicles-message success-message"
            role="status"
            aria-live="polite"
          >
            {success}
          </div>
        )}

        {error && (
          <div
            className="vehicles-message error-message"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        {showForm && (
          <section
            className="vehicle-form-card"
            aria-labelledby="vehicle-form-title"
          >
            <div className="vehicle-form-header">
              <div>
                <span className="form-eyebrow">
                  {editingId
                    ? "EDIT VEHICLE"
                    : "ADD VEHICLE"}
                </span>

                <h2 id="vehicle-form-title">
                  {editingId
                    ? "Update Vehicle"
                    : "Add Your Vehicle"}
                </h2>
              </div>

              <button
                type="button"
                className="close-form-button"
                onClick={closeForm}
                aria-label="Close vehicle form"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="vehicle-form-grid">
                <div className="vehicle-field">
                  <label htmlFor="vehicle-name">
                    Vehicle Name
                  </label>

                  <input
                    id="vehicle-name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Example: Royal Enfield Classic"
                    autoComplete="off"
                    maxLength={60}
                    required
                  />
                </div>

                <div className="vehicle-field">
                  <label htmlFor="registration-number">
                    Registration Number
                  </label>

                  <input
                    id="registration-number"
                    name="registrationNumber"
                    type="text"
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    placeholder="Example: AP 02 AB 1234"
                    autoComplete="off"
                    maxLength={20}
                    required
                  />

                  <small className="vehicle-field-note">
                    Your registration number is stored only
                    in this frontend prototype.
                  </small>
                </div>

                <div className="vehicle-field">
                  <label htmlFor="fuel-type">
                    Fuel Type
                  </label>

                  <select
                    id="fuel-type"
                    name="fuelType"
                    value={formData.fuelType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">
                      Select fuel type
                    </option>

                    {FUEL_TYPES.map((fuelType) => (
                      <option
                        key={fuelType}
                        value={fuelType}
                      >
                        {fuelType}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="vehicle-field">
                  <label htmlFor="mileage">
                    Mileage
                  </label>

                  <div className="mileage-wrapper">
                    <input
                      id="mileage"
                      name="mileage"
                      type="number"
                      min="0.1"
                      max="500"
                      step="0.1"
                      value={formData.mileage}
                      onChange={handleInputChange}
                      placeholder="Example: 40"
                      inputMode="decimal"
                      required
                    />

                    <span>km/l</span>
                  </div>
                </div>
              </div>

              <div className="vehicle-form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-vehicle-button"
                >
                  {editingId
                    ? "Update Vehicle"
                    : "Save Vehicle"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section
          className="vehicles-section"
          aria-labelledby="garage-title"
        >
          <div className="section-header">
            <div>
              <span className="section-eyebrow">
                YOUR GARAGE
              </span>

              <h2 id="garage-title">
                {vehicles.length === 0
                  ? "No Vehicles"
                  : vehicles.length === 1
                    ? "1 Vehicle"
                    : `${vehicles.length} Vehicles`}
              </h2>
            </div>
          </div>

          {vehicles.length === 0 ? (
            <div className="empty-vehicles">
              <div
                className="empty-vehicle-icon"
                aria-hidden="true"
              >
                🏍
              </div>

              <h3>Your garage is empty</h3>

              <p>
                Add your motorcycle or vehicle to start
                managing your MotoTribe rides.
              </p>

              <button
                type="button"
                className="empty-add-button"
                onClick={openAddForm}
              >
                + Add Your First Vehicle
              </button>
            </div>
          ) : (
            <div className="vehicles-grid">
              {vehicles.map((vehicle) => (
                <article
                  className={`vehicle-card ${
                    vehicle.isDefault
                      ? "vehicle-card-default"
                      : ""
                  }`}
                  key={vehicle.id}
                >
                  {vehicle.isDefault && (
                    <div className="default-badge">
                      DEFAULT
                    </div>
                  )}

                  <div className="vehicle-card-top">
                    <div
                      className="vehicle-icon"
                      aria-hidden="true"
                    >
                      🏍
                    </div>

                    <div className="vehicle-actions">
                      <button
                        type="button"
                        onClick={() =>
                          openEditForm(vehicle)
                        }
                        aria-label={`Edit ${vehicle.name}`}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="delete-button"
                        onClick={() =>
                          handleDelete(vehicle.id)
                        }
                        aria-label={`Delete ${vehicle.name}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="vehicle-information">
                    <h3>{vehicle.name}</h3>

                    <p className="vehicle-registration">
                      {vehicle.registrationNumber}
                    </p>
                  </div>

                  <div className="vehicle-details">
                    <div className="vehicle-detail">
                      <span>FUEL TYPE</span>

                      <strong>
                        {vehicle.fuelType}
                      </strong>
                    </div>

                    <div className="vehicle-detail">
                      <span>MILEAGE</span>

                      <strong>
                        {vehicle.mileage} km/l
                      </strong>
                    </div>
                  </div>

                  {!vehicle.isDefault && (
                    <button
                      type="button"
                      className="default-button"
                      onClick={() =>
                        setDefaultVehicle(vehicle.id)
                      }
                    >
                      Set as Default Vehicle
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="vehicles-note">
          <span aria-hidden="true">✦</span>
          Vehicle information is stored locally in this
          frontend prototype.
        </div>
      </div>
    </main>
  );
}

export default Vehicles;