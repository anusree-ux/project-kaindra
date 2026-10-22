import { useState } from "react";

const ManufacturerProfileForm = () => {
  const [form, setForm] = useState({
    companyName: "",
    location: "",
    capacity: "",
    specialties: "",
  });

  const update = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

  return (
    <form
      className="dashboard-card"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="dashboard-card-header">
        <h2>Manufacturer profile</h2>
      </div>

      <div className="dashboard-card-body dashboard-form-grid">
        <div className="dashboard-field">
          <label>Company name</label>
          <input
            name="companyName"
            value={form.companyName}
            onChange={update}
          />
        </div>

        <div className="dashboard-field">
          <label>Location</label>
          <input
            name="location"
            value={form.location}
            onChange={update}
          />
        </div>

        <div className="dashboard-field">
          <label>Monthly capacity</label>
          <input
            name="capacity"
            value={form.capacity}
            onChange={update}
          />
        </div>

        <div className="dashboard-field dashboard-field-full">
          <label>Specialties</label>
          <textarea
            name="specialties"
            value={form.specialties}
            onChange={update}
          />
        </div>

        <div>
          <button className="dashboard-btn dashboard-btn-primary">
            Save manufacturer profile
          </button>
        </div>
      </div>
    </form>
  );
};

export default ManufacturerProfileForm;