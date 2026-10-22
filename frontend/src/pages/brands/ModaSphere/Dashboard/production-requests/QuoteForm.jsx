import { useState } from "react";

const QuoteForm = () => {
  const [quote, setQuote] = useState({
    price: "",
    leadTime: "",
    notes: "",
  });

  const update = (event) => {
    setQuote((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    console.log("Frontend quote:", quote);
  };

  return (
    <form
      className="dashboard-card"
      onSubmit={submit}
    >
      <div className="dashboard-card-header">
        <h2>Quote</h2>
      </div>

      <div className="dashboard-card-body dashboard-form">
        <div className="dashboard-field">
          <label>Quote amount</label>
          <input
            type="number"
            name="price"
            value={quote.price}
            onChange={update}
          />
        </div>

        <div className="dashboard-field">
          <label>Lead time</label>
          <input
            name="leadTime"
            value={quote.leadTime}
            onChange={update}
            placeholder="Example: 30 days"
          />
        </div>

        <div className="dashboard-field">
          <label>Notes</label>
          <textarea
            name="notes"
            value={quote.notes}
            onChange={update}
          />
        </div>

        <button className="dashboard-btn dashboard-btn-primary">
          Save quote
        </button>
      </div>
    </form>
  );
};

export default QuoteForm;