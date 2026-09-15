import { useMemo, useState } from "react";
import "./FuelPrice.css";

const STORAGE_KEY = "mototribeFuelPrices";

const defaultPrices = [
  {
    id: 1,
    station: "IndianOil Highway Station",
    location: "Bengaluru - Hyderabad Highway",
    fuelType: "Petrol",
    price: 103.45,
    state: "Andhra Pradesh",
    submittedBy: "Verified Rider",
    time: "Today",
  },
  {
    id: 2,
    station: "HP Fuel Point",
    location: "Kurnool",
    fuelType: "Petrol",
    price: 102.85,
    state: "Andhra Pradesh",
    submittedBy: "Rider Community",
    time: "Today",
  },
  {
    id: 3,
    station: "Bharat Petroleum",
    location: "Hyderabad",
    fuelType: "Diesel",
    price: 94.72,
    state: "Telangana",
    submittedBy: "Verified Rider",
    time: "Yesterday",
  },
];

const getStoredPrices = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultPrices;
  } catch {
    return defaultPrices;
  }
};

function FuelPrice() {
  const [prices, setPrices] = useState(getStoredPrices);

  const [form, setForm] = useState({
    state: "Andhra Pradesh",
    city: "",
    station: "",
    fuelType: "Petrol",
    price: "",
  });

  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const filteredPrices = useMemo(() => {
    return prices.filter((item) => {
      const matchesFuel =
        filter === "ALL" || item.fuelType === filter;

      const searchText = search.toLowerCase();

      const matchesSearch =
        item.station.toLowerCase().includes(searchText) ||
        item.location.toLowerCase().includes(searchText) ||
        item.state.toLowerCase().includes(searchText);

      return matchesFuel && matchesSearch;
    });
  }, [prices, filter, search]);

  const statistics = useMemo(() => {
    const petrol = prices.filter(
      (item) => item.fuelType === "Petrol"
    );

    const diesel = prices.filter(
      (item) => item.fuelType === "Diesel"
    );

    const calculateStats = (items) => {
      if (!items.length) {
        return {
          average: 0,
          lowest: 0,
          highest: 0,
        };
      }

      const values = items.map((item) => Number(item.price));

      return {
        average:
          values.reduce((sum, value) => sum + value, 0) /
          values.length,
        lowest: Math.min(...values),
        highest: Math.max(...values),
      };
    };

    return {
      petrol: calculateStats(petrol),
      diesel: calculateStats(diesel),
    };
  }, [prices]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      !form.city.trim() ||
      !form.station.trim() ||
      !form.price
    ) {
      setMessage("Please fill in all required fields.");
      return;
    }

    const numericPrice = Number(form.price);

    if (numericPrice <= 0) {
      setMessage("Please enter a valid fuel price.");
      return;
    }

    const newPrice = {
      id: Date.now(),
      station: form.station.trim(),
      location: form.city.trim(),
      fuelType: form.fuelType,
      price: numericPrice,
      state: form.state,
      submittedBy: "You",
      time: "Just now",
    };

    const updatedPrices = [newPrice, ...prices];

    setPrices(updatedPrices);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedPrices)
    );

    setForm({
      state: "Andhra Pradesh",
      city: "",
      station: "",
      fuelType: "Petrol",
      price: "",
    });

    setMessage("Fuel price submitted successfully.");

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  const resetPrices = () => {
    setPrices(defaultPrices);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(defaultPrices)
    );

    setMessage("Community fuel prices reset.");
  };

  return (
    <section className="fuel-price-section" id="fuel-price">
      <div className="fuel-price-container">

        {/* HEADER */}
        <div className="fuel-price-header">
          <div>
            <span className="fuel-price-eyebrow">
              COMMUNITY INTELLIGENCE
            </span>

            <h2>
              FUEL <span>PRICE</span>
            </h2>

            <p>
              Help fellow riders plan better journeys with
              current fuel prices reported by the tribe.
            </p>
          </div>

          <div className="fuel-live-indicator">
            <span className="fuel-live-dot"></span>
            COMMUNITY UPDATED
          </div>
        </div>

        {/* PRICE OVERVIEW */}
        <div className="fuel-overview-grid">

          <div className="fuel-stat-card">
            <span className="fuel-stat-label">
              PETROL AVERAGE
            </span>

            <strong>
              ₹{statistics.petrol.average.toFixed(2)}
            </strong>

            <small>
              Lowest ₹{statistics.petrol.lowest.toFixed(2)}
            </small>
          </div>

          <div className="fuel-stat-card">
            <span className="fuel-stat-label">
              PETROL RANGE
            </span>

            <strong>
              ₹{statistics.petrol.lowest.toFixed(2)}
              {" - "}
              ₹{statistics.petrol.highest.toFixed(2)}
            </strong>

            <small>
              Based on rider reports
            </small>
          </div>

          <div className="fuel-stat-card">
            <span className="fuel-stat-label">
              DIESEL AVERAGE
            </span>

            <strong>
              ₹{statistics.diesel.average.toFixed(2)}
            </strong>

            <small>
              Lowest ₹{statistics.diesel.lowest.toFixed(2)}
            </small>
          </div>

          <div className="fuel-stat-card">
            <span className="fuel-stat-label">
              REPORTS
            </span>

            <strong>{prices.length}</strong>

            <small>
              Community submissions
            </small>
          </div>

        </div>

        {/* MAIN CONTENT */}
        <div className="fuel-main-grid">

          {/* SUBMISSION FORM */}
          <div className="fuel-form-card">

            <div className="fuel-card-heading">
              <div>
                <span>01</span>
                <h3>REPORT A PRICE</h3>
              </div>

              <p>
                Share what you found on your ride.
              </p>
            </div>

            <form onSubmit={handleSubmit}>

              <div className="fuel-form-row">

                <div className="fuel-field">
                  <label>STATE</label>

                  <select
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                  >
                    <option>Andhra Pradesh</option>
                    <option>Telangana</option>
                    <option>Karnataka</option>
                    <option>Tamil Nadu</option>
                    <option>Maharashtra</option>
                    <option>Kerala</option>
                  </select>
                </div>

                <div className="fuel-field">
                  <label>CITY / AREA *</label>

                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="e.g. Kurnool"
                  />
                </div>

              </div>

              <div className="fuel-field">
                <label>FUEL STATION *</label>

                <input
                  type="text"
                  name="station"
                  value={form.station}
                  onChange={handleChange}
                  placeholder="Enter station name"
                />
              </div>

              <div className="fuel-form-row">

                <div className="fuel-field">
                  <label>FUEL TYPE</label>

                  <select
                    name="fuelType"
                    value={form.fuelType}
                    onChange={handleChange}
                  >
                    <option>Petrol</option>
                    <option>Diesel</option>
                  </select>
                </div>

                <div className="fuel-field">
                  <label>PRICE / LITRE *</label>

                  <div className="fuel-price-input">
                    <span>₹</span>

                    <input
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      min="1"
                      step="0.01"
                    />
                  </div>
                </div>

              </div>

              {message && (
                <div className="fuel-message">
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="fuel-submit-btn"
              >
                SUBMIT PRICE
                <span>→</span>
              </button>

            </form>

          </div>

          {/* COMMUNITY INFO */}
          <div className="fuel-info-card">

            <span className="fuel-card-number">
              02
            </span>

            <h3>
              WHY REPORT
              <br />
              FUEL PRICES?
            </h3>

            <p>
              Fuel prices can change across locations.
              Rider reports help the community estimate
              travel costs before starting a journey.
            </p>

            <div className="fuel-info-list">

              <div>
                <span>01</span>
                <p>Compare prices along your route</p>
              </div>

              <div>
                <span>02</span>
                <p>Estimate your fuel budget</p>
              </div>

              <div>
                <span>03</span>
                <p>Help other riders plan better</p>
              </div>

            </div>

            <div className="fuel-disclaimer">
              <span>ⓘ</span>
              Prices are community reports and may
              change at any time.
            </div>

          </div>

        </div>

        {/* REPORT LIST */}
        <div className="fuel-reports">

          <div className="fuel-reports-header">

            <div>
              <span className="fuel-price-eyebrow">
                RIDER REPORTS
              </span>

              <h3>
                RECENT FUEL PRICES
              </h3>
            </div>

            <button
              className="fuel-reset-btn"
              onClick={resetPrices}
            >
              RESET DEMO DATA
            </button>

          </div>

          {/* FILTERS */}
          <div className="fuel-toolbar">

            <div className="fuel-filters">

              {["ALL", "Petrol", "Diesel"].map(
                (type) => (
                  <button
                    key={type}
                    className={
                      filter === type
                        ? "active"
                        : ""
                    }
                    onClick={() => setFilter(type)}
                  >
                    {type}
                  </button>
                )
              )}

            </div>

            <input
              className="fuel-search"
              type="text"
              placeholder="Search station or location..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

          </div>

          {/* REPORT CARDS */}
          <div className="fuel-report-list">

            {filteredPrices.length > 0 ? (
              filteredPrices.map((item) => (
                <div
                  className="fuel-report-card"
                  key={item.id}
                >

                  <div className="fuel-report-icon">
                    ⛽
                  </div>

                  <div className="fuel-report-details">

                    <h4>{item.station}</h4>

                    <p>
                      {item.location}, {item.state}
                    </p>

                    <span>
                      {item.submittedBy} · {item.time}
                    </span>

                  </div>

                  <div className="fuel-report-type">
                    {item.fuelType}
                  </div>

                  <div className="fuel-report-price">
                    <strong>
                      ₹{Number(item.price).toFixed(2)}
                    </strong>

                    <span>/ L</span>
                  </div>

                </div>
              ))
            ) : (
              <div className="fuel-empty">
                No fuel price reports found.
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}

export default FuelPrice;