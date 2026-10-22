import { useState } from "react";

const SellerProfileForm = () => {
  const [form, setForm] = useState({
    businessName: "",
    email: "",
    phone: "",
    description: "",
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
        <h2>Seller profile</h2>
      </div>

      <div className="dashboard-card-body dashboard-form-grid">
        <div className="dashboard-field">
          <label>Business name</label>
          <input
            name="businessName"
            value={form.businessName}
            onChange={update}
          />
        </div>

        <div className="dashboard-field">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={update}
          />
        </div>

        <div className="dashboard-field">
          <label>Phone</label>
          <input
            name="phone"
            value={form.phone}
            onChange={update}
          />
        </div>

        <div className="dashboard-field dashboard-field-full">
          <label>Business description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={update}
          />
        </div>

        <div>
          <button className="dashboard-btn dashboard-btn-primary">
            Save seller profile
          </button>
        </div>
      </div>
    </form>
  );
};

export default SellerProfileForm;