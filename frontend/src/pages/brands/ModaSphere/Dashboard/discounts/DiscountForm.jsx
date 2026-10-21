import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const DiscountForm = () => {
  const navigate = useNavigate();
  const { discountId } = useParams();

  const [form, setForm] = useState({
    code: "",
    type: "percentage",
    value: "",
    minimumOrder: "",
    usageLimit: "",
    expiry: "",
  });

  const update = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const submit = (event) => {
    event.preventDefault();

    console.log("Frontend discount:", form);

    navigate(
      "/businesses/modasphere/dashboard/discounts"
    );
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div>
          <h1>
            {discountId
              ? "Edit Discount"
              : "Create Discount"}
          </h1>
        </div>
      </div>

      <form onSubmit={submit}>
        <div className="dashboard-card">
          <div className="dashboard-card-body dashboard-form-grid">
            <div className="dashboard-field">
              <label>Discount code</label>
              <input
                name="code"
                value={form.code}
                onChange={update}
                required
              />
            </div>

            <div className="dashboard-field">
              <label>Type</label>
              <select
                name="type"
                value={form.type}
                onChange={update}
              >
                <option value="percentage">
                  Percentage
                </option>
                <option value="fixed">
                  Fixed amount
                </option>
              </select>
            </div>

            <div className="dashboard-field">
              <label>Value</label>
              <input
                type="number"
                name="value"
                value={form.value}
                onChange={update}
                required
              />
            </div>

            <div className="dashboard-field">
              <label>Minimum order</label>
              <input
                type="number"
                name="minimumOrder"
                value={form.minimumOrder}
                onChange={update}
              />
            </div>

            <div className="dashboard-field">
              <label>Usage limit</label>
              <input
                type="number"
                name="usageLimit"
                value={form.usageLimit}
                onChange={update}
              />
            </div>

            <div className="dashboard-field">
              <label>Expiry date</label>
              <input
                type="date"
                name="expiry"
                value={form.expiry}
                onChange={update}
              />
            </div>
          </div>
        </div>

        <button
          className="dashboard-btn dashboard-btn-primary"
          style={{ marginTop: 20 }}
        >
          Save discount
        </button>
      </form>
    </div>
  );
};

export default DiscountForm;