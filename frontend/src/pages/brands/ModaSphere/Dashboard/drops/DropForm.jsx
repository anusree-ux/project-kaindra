import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const DropForm = () => {
  const navigate = useNavigate();
  const { dropId } = useParams();

  const [form, setForm] = useState({
    name: "",
    product: "",
    releaseDate: "",
    releaseTime: "",
    stock: "",
    purchaseLimit: "1",
  });

  const update = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const submit = (event) => {
    event.preventDefault();

    console.log("Frontend drop:", form);

    navigate(
      "/businesses/modasphere/dashboard/drops"
    );
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <h1>
            {dropId ? "Edit Drop" : "Create Drop"}
          </h1>
          <p>
            Configure release date, inventory and customer limits.
          </p>
        </div>
      </div>

      <form onSubmit={submit}>
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2>Drop configuration</h2>
          </div>

          <div className="dashboard-card-body dashboard-form-grid">
            <div className="dashboard-field dashboard-field-full">
              <label>Drop name</label>
              <input
                name="name"
                value={form.name}
                onChange={update}
                required
              />
            </div>

            <div className="dashboard-field dashboard-field-full">
              <label>Product</label>

              <select
                name="product"
                value={form.product}
                onChange={update}
                required
              >
                <option value="">
                  Select product
                </option>
                <option>Classic Linen Shirt</option>
                <option>Essential Hoodie</option>
              </select>
            </div>

            <div className="dashboard-field">
              <label>Release date</label>
              <input
                type="date"
                name="releaseDate"
                value={form.releaseDate}
                onChange={update}
                required
              />
            </div>

            <div className="dashboard-field">
              <label>Release time</label>
              <input
                type="time"
                name="releaseTime"
                value={form.releaseTime}
                onChange={update}
                required
              />
            </div>

            <div className="dashboard-field">
              <label>Drop stock</label>
              <input
                type="number"
                min="1"
                name="stock"
                value={form.stock}
                onChange={update}
                required
              />
            </div>

            <div className="dashboard-field">
              <label>Purchase limit</label>
              <input
                type="number"
                min="1"
                name="purchaseLimit"
                value={form.purchaseLimit}
                onChange={update}
              />
            </div>
          </div>
        </div>

        <button
          className="dashboard-btn dashboard-btn-primary"
          style={{ marginTop: 20 }}
        >
          Save drop
        </button>
      </form>
    </div>
  );
};

export default DropForm;