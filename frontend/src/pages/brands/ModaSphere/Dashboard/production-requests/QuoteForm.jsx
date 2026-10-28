import { useState, useEffect } from "react";

const QuoteForm = ({ quoteData }) => {
  const [quote, setQuote] = useState({
    price: "",
    leadTime: "",
    notes: "",
  });

  useEffect(() => {
    if (quoteData) {
      setQuote({
        price: quoteData.pricePerUnit || quoteData.price || "",
        leadTime: quoteData.estimatedLeadTimeDays ? `${quoteData.estimatedLeadTimeDays} days` : (quoteData.leadTime || ""),
        notes: quoteData.notes || "",
      });
    }
  }, [quoteData]);

  const update = (event) => {
    setQuote((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const submit = (event) => {
    event.preventDefault();
  };

  return (
    <form
      className="dashboard-card"
      onSubmit={submit}
    >
      <div className="dashboard-card-header">
        <h2>Manufacturer Quote</h2>
      </div>

      <div className="dashboard-card-body dashboard-form">
        <div className="dashboard-field">
          <label>Quote amount (per unit)</label>
          <input
            type="number"
            name="price"
            value={quote.price}
            onChange={update}
            placeholder="Awaiting manufacturer quote"
          />
        </div>

        <div className="dashboard-field">
          <label>Lead time</label>
          <input
            name="leadTime"
            value={quote.leadTime}
            onChange={update}
            placeholder="e.g. 30 days"
          />
        </div>

        <div className="dashboard-field">
          <label>Notes</label>
          <textarea
            name="notes"
            value={quote.notes}
            onChange={update}
            placeholder="Terms, MOQ conditions, or fabrication notes"
          />
        </div>

        {quoteData ? (
          <div style={{ color: "#16a34a", fontSize: 13, fontWeight: 500, marginTop: 4 }}>
            ✓ Quote submitted by manufacturer
          </div>
        ) : (
          <p style={{ color: "#888", fontSize: 12, margin: 0 }}>
            Quotes will be updated by the assigned manufacturer.
          </p>
        )}
      </div>
    </form>
  );
};

export default QuoteForm;