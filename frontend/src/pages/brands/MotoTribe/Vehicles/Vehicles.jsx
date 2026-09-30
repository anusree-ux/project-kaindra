import { useEffect, useState } from "react";
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
      console.error("Failed to load local vehicles:", err);
    }

    return [];
  });

  const [form, setForm] = useState(emptyVehicle);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * Load vehicles from MongoDB when the user is authenticated.
   */
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let cancelled = false;

    const loadVehicles = async () => {
      try {
        const res = await apiClient.get(
          "/api/mototribe/vehicles/me"
        );

        const dbList = res?.data?.data?.vehicles;

        if (cancelled || !Array.isArray(dbList)) {
          return;
        }

        const mappedVehicles = dbList.map((vehicle) => {
          const vehicleName = vehicle.vehicleName || "Motorcycle";

          const nameParts = vehicleName
            .trim()
            .split(/\s+/);

          return {
            id: vehicle._id,
            _id: vehicle._id,

            name: vehicleName,

            brand:
              vehicle.brand ||
              nameParts[0] ||
              "Motorcycle",

            model:
              vehicle.model ||
              nameParts.slice(1).join(" ") ||
              "Model",

            year: vehicle.year || "",

            registration:
              vehicle.registrationNumber || "",

            fuelType:
              (
                vehicle.fuelType ||
                "PETROL"
              ).toUpperCase(),

            mileage: String(
              vehicle.mileageKmpl || 28
            ),

            engine: vehicle.engine || "",

            lastService:
              vehicle.lastService || "",

            serviceDue:
              vehicle.serviceDue || "",

            isDefault: !!vehicle.isDefault,

            createdAt: vehicle.createdAt,
          };
        });

        setVehicles(mappedVehicles);

        localStorage.setItem(
          "mototribeVehicles",
          JSON.stringify(mappedVehicles)
        );
      } catch (err) {
        console.error(
          "Failed to fetch vehicles from DB:",
          err
        );
      }
    };

    loadVehicles();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  /*
   * Redirect users who have not completed profile setup.
   */
  useEffect(() => {
    const profile =
      localStorage.getItem("mototribeProfile");

    if (!profile && !isAuthenticated) {
      navigate(
        "/businesses/mototribe/profile-setup"
      );
    }
  }, [navigate, isAuthenticated]);

  /*
   * Save vehicles to React state and localStorage.
   */
  const saveVehicles = (updatedVehicles) => {
    setVehicles(updatedVehicles);

    localStorage.setItem(
      "mototribeVehicles",
      JSON.stringify(updatedVehicles)
    );
  };

  /*
   * Handle form changes.
   */
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  /*
   * Open add vehicle form.
   */
  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...emptyVehicle });
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  /*
   * Open edit vehicle form.
   */
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
      lastService: vehicle.lastService
        ? String(vehicle.lastService).split("T")[0]
        : "",
      serviceDue: vehicle.serviceDue
        ? String(vehicle.serviceDue).split("T")[0]
        : "",
    });

    setShowForm(true);
    setError("");
    setSuccess("");
  };

  /*
   * Add / update vehicle.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    /*
     * Validation
     */
    if (!form.name.trim()) {
      setError(
        "Please enter a motorcycle name."
      );
      return;
    }

    if (!form.brand.trim()) {
      setError(
        "Please enter the motorcycle brand."
      );
      return;
    }

    if (!form.model.trim()) {
      setError(
        "Please enter the motorcycle model."
      );
      return;
    }

    if (!form.registration.trim()) {
      setError(
        "Please enter the registration number."
      );
      return;
    }

    if (
      !form.mileage ||
      Number(form.mileage) <= 0
    ) {
      setError(
        "Please enter a valid mileage."
      );
      return;
    }

    /*
     * Find existing vehicle while editing.
     */
    const existingTarget = editingId
      ? vehicles.find(
          (vehicle) =>
            vehicle.id === editingId ||
            vehicle._id === editingId
        )
      : null;

    /*
     * Common frontend vehicle object.
     */
    const vehicleData = {
      ...form,

      id:
        existingTarget?._id ||
        existingTarget?.id ||
        editingId ||
        Date.now(),

      _id:
        existingTarget?._id ||
        undefined,

      createdAt:
        existingTarget?.createdAt ||
        new Date().toISOString(),

      isDefault:
        existingTarget?.isDefault ||
        vehicles.length === 0,
    };

    /*
     * EDIT EXISTING VEHICLE
     */
    if (editingId) {
      let updatedVehicles = vehicles.map(
        (vehicle) =>
          vehicle.id === editingId ||
          vehicle._id === editingId
            ? vehicleData
            : vehicle
      );

      /*
       * Update MongoDB.
       */
      if (
        isAuthenticated &&
        existingTarget?._id
      ) {
        try {
          const response =
            await apiClient.patch(
              `/api/mototribe/vehicles/${existingTarget._id}`,
              {
                vehicleName:
                  form.name.trim(),

                brand:
                  form.brand.trim(),

                model:
                  form.model.trim(),

                year:
                  form.year
                    ? Number(form.year)
                    : null,

                registrationNumber:
                  form.registration.trim(),

                mileageKmpl:
                  Number(form.mileage),

                fuelType:
                  (
                    form.fuelType ||
                    "PETROL"
                  ).toLowerCase(),

                engine:
                  form.engine
                    ? Number(form.engine)
                    : null,

                lastService:
                  form.lastService || null,

                serviceDue:
                  form.serviceDue || null,
              }
            );

          const dbVehicle =
            response?.data?.data?.vehicle;

          if (dbVehicle?._id) {
            vehicleData._id = dbVehicle._id;
            vehicleData.id = dbVehicle._id;
          }
        } catch (err) {
          console.error(
            "Failed to update vehicle in DB:",
            err
          );

          setError(
            "Vehicle was updated locally, but database update failed."
          );
        }
      }

      updatedVehicles = updatedVehicles.map(
        (vehicle) =>
          vehicle.id === editingId ||
          vehicle._id === editingId
            ? vehicleData
            : vehicle
      );

      saveVehicles(updatedVehicles);

      setSuccess(
        "Motorcycle updated successfully."
      );
    }

    /*
     * ADD NEW VEHICLE
     */
    else {
      let newVehicle = vehicleData;

      /*
       * Create in MongoDB.
       */
      if (isAuthenticated) {
        try {
          const response =
            await apiClient.post(
              "/api/mototribe/vehicles",
              {
                vehicleName:
                  form.name.trim(),

                brand:
                  form.brand.trim(),

                model:
                  form.model.trim(),

                year:
                  form.year
                    ? Number(form.year)
                    : null,

                registrationNumber:
                  form.registration.trim(),

                mileageKmpl:
                  Number(form.mileage),

                fuelType:
                  (
                    form.fuelType ||
                    "PETROL"
                  ).toLowerCase(),

                engine:
                  form.engine
                    ? Number(form.engine)
                    : null,

                lastService:
                  form.lastService || null,

                serviceDue:
                  form.serviceDue || null,

                isDefault:
                  vehicles.length === 0,
              }
            );

          const dbVehicle =
            response?.data?.data?.vehicle;

          if (dbVehicle?._id) {
            newVehicle = {
              ...newVehicle,

              id: dbVehicle._id,

              _id: dbVehicle._id,

              isDefault:
                !!dbVehicle.isDefault,

              createdAt:
                dbVehicle.createdAt ||
                newVehicle.createdAt,
            };
          }
        } catch (err) {
          console.error(
            "Failed to create vehicle in DB:",
            err
          );

          setError(
            "Vehicle was saved locally, but database creation failed."
          );
        }
      }

      const updatedVehicles = [
        ...vehicles,
        newVehicle,
      ];

      saveVehicles(updatedVehicles);

      if (!error) {
        setSuccess(
          "Motorcycle added successfully."
        );
      }
    }

    /*
     * Close form.
     */
    setShowForm(false);
    setForm({ ...emptyVehicle });
    setEditingId(null);
  };

  /*
   * Delete vehicle.
   */
  const deleteVehicle = async (id) => {
    const vehicle = vehicles.find(
      (item) =>
        item.id === id ||
        item._id === id
    );

    if (!vehicle) {
      return;
    }

    const confirmed = window.confirm(
      `Remove ${vehicle.name} from your MotoTribe garage?`
    );

    if (!confirmed) {
      return;
    }

    /*
     * Delete from MongoDB.
     */
    const isMongoId =
      vehicle._id ||
      (
        typeof vehicle.id === "string" &&
        /^[0-9a-fA-F]{24}$/.test(
          vehicle.id
        )
      );

    if (isAuthenticated && isMongoId) {
      const dbId =
        vehicle._id || vehicle.id;

      try {
        await apiClient.delete(
          `/api/mototribe/vehicles/${dbId}`
        );
      } catch (err) {
        console.error(
          "Failed to delete vehicle from DB:",
          err
        );
      }
    }

    /*
     * Delete locally.
     */
    const updatedVehicles =
      vehicles.filter(
        (item) =>
          item.id !== id &&
          item._id !== id
      );

    saveVehicles(updatedVehicles);

    /*
     * Close details modal if needed.
     */
    if (
      selectedVehicle?.id === id ||
      selectedVehicle?._id === id
    ) {
      setSelectedVehicle(null);
    }

    setSuccess(
      "Motorcycle removed successfully."
    );
  };

  /*
   * Set default vehicle.
   */
  const setDefaultVehicle = async (id) => {
    const updatedVehicles =
      vehicles.map((vehicle) => ({
        ...vehicle,

        isDefault:
          vehicle.id === id ||
          vehicle._id === id,
      }));

    saveVehicles(updatedVehicles);

    const vehicle =
      updatedVehicles.find(
        (item) =>
          item.id === id ||
          item._id === id
      );

    if (!vehicle) {
      return;
    }

    /*
     * Update MongoDB.
     */
    const isMongoId =
      vehicle._id ||
      (
        typeof vehicle.id === "string" &&
        /^[0-9a-fA-F]{24}$/.test(
          vehicle.id
        )
      );

    if (isAuthenticated && isMongoId) {
      const dbId =
        vehicle._id || vehicle.id;

      try {
        await apiClient.patch(
          `/api/mototribe/vehicles/${dbId}`,
          {
            isDefault: true,
          }
        );
      } catch (err) {
        console.error(
          "Failed to set default vehicle in DB:",
          err
        );
      }
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
              {vehicles.length !== 1
                ? "S"
                : ""}
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

            <h2>
              Your garage is empty
            </h2>

            <p>
              Add your first motorcycle to
              start building your MotoTribe
              rider profile.
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
                  {vehicle.brand}{" "}
                  {vehicle.model}
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
                  <span>
                    REGISTRATION
                  </span>

                  <strong>
                    {vehicle.registration}
                  </strong>
                </div>

                <div className="vehicle-actions">
                  <button
                    onClick={() =>
                      setSelectedVehicle(
                        vehicle
                      )
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
                        setDefaultVehicle(
                          vehicle.id
                        )
                      }
                    >
                      SET DEFAULT
                    </button>
                  )}

                  <button
                    className="delete-action"
                    onClick={() =>
                      deleteVehicle(
                        vehicle.id
                      )
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
              navigate(
                "/businesses/mototribe/profile-setup"
              )
            }
          >
            ← PROFILE
          </button>

          <button
            onClick={() =>
              navigate(
                "/businesses/mototribe"
              )
            }
          >
            CONTINUE TO MOTOTRIBE →
          </button>
        </div>

        <footer className="vehicles-footer">
          FRONTEND PROTOTYPE • VEHICLE DATA
          STORED LOCALLY & IN DATABASE
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
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="vehicle-form-grid">
                <div className="vehicle-field full">
                  <label>
                    MOTORCYCLE NAME *
                  </label>

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
                    min="1"
                  />
                </div>

                <div className="vehicle-field full">
                  <label>
                    REGISTRATION NUMBER *
                  </label>

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
                    {fuelTypes.map(
                      (fuel) => (
                        <option
                          key={fuel}
                          value={fuel}
                        >
                          {fuel}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="vehicle-field">
                  <label>
                    MILEAGE KM/L *
                  </label>

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
                  <label>
                    LAST SERVICE
                  </label>

                  <input
                    type="date"
                    name="lastService"
                    value={form.lastService}
                    onChange={handleChange}
                    onClick={(event) => {
                      try {
                        event.target.showPicker?.();
                      } catch (err) {
                        // Browser may not support showPicker.
                      }
                    }}
                  />
                </div>

                <div className="vehicle-field">
                  <label>
                    NEXT SERVICE
                  </label>

                  <input
                    type="date"
                    name="serviceDue"
                    value={form.serviceDue}
                    onChange={handleChange}
                    onClick={(event) => {
                      try {
                        event.target.showPicker?.();
                      } catch (err) {
                        // Browser may not support showPicker.
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

            <h2>
              {selectedVehicle.name}
            </h2>

            <p>
              {selectedVehicle.brand}{" "}
              {selectedVehicle.model}
            </p>

            <div className="details-grid">
              <div>
                <span>
                  REGISTRATION
                </span>

                <strong>
                  {selectedVehicle.registration}
                </strong>
              </div>

              <div>
                <span>YEAR</span>

                <strong>
                  {selectedVehicle.year ||
                    "Not added"}
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
                  {selectedVehicle.mileage}{" "}
                  KM/L
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
