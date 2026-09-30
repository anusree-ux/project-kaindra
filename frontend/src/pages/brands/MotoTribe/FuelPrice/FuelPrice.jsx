import { useEffect, useMemo, useState } from "react";
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

const initialForm = {
  state: "Andhra Pradesh",
  city: "",
  station: "",
  fuelType: "Petrol",
  price: "",
};

const getStoredPrices = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return defaultPrices;
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return defaultPrices;
    }

    return parsed;
  } catch {
    return defaultPrices;
  }
};

function FuelPrice() {
  const [prices, setPrices] = useState(getStoredPrices);
  const [form, setForm] = useState(initialForm);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prices));
    } catch {
      // Storage may be unavailable in private or restricted browser contexts.
    }
  }, [prices]);

  const filteredPrices = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return prices.filter((item) => {
      const matchesFuel =
        filter === "ALL" || item.fuelType === filter;

      const matchesSearch =
        !searchText ||
        item.station.toLowerCase().includes(searchText) ||
        item.location.toLowerCase().includes(searchText) ||
        item.state.toLowerCase().includes(searchText) ||
        item.fuelType.toLowerCase().includes(searchText);

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

    if (message) {
      setMessage("");
    }
  };

  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const city = form.city.trim();
    const station = form.station.trim();
    const numericPrice = Number(form.price);

    if (!city || !station || !form.price) {
      showMessage(
        "Please fill in all required fields.",
        "error"
      );
      return;
    }

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      showMessage(
        "Please enter a valid fuel price.",
        "error"
      );
      return;
    }

    if (numericPrice > 300) {
      showMessage(
        "Please check the entered fuel price.",
        "error"
      );
      return;
    }

    const newPrice = {
      id: `fuel-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
      station,
      location: city,
      fuelType: form.fuelType,
      price: numericPrice,
      state: form.state,
      submittedBy: "You",
      time: "Just now",
    };

    setPrices((previous) => [newPrice, ...previous]);

    setForm({
      ...initialForm,
    });

    showMessage(
      "Fuel price submitted successfully.",
      "success"
    );

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  const resetPrices = () => {
    setPrices(defaultPrices);
    setFilter("ALL");
    setSearch("");

    showMessage(
      "Community fuel prices reset.",
      "success"
    );
  };

  return (
    <section
      className="fuel-price-section"
      id="fuel-price"
      aria-labelledby="fuel-price-title"
    >
      <div className="fuel-price-container">
        {/* HEADER */}
        <div className="fuel-price-header">
          <div>
            <span className="fuel-price-eyebrow">
              COMMUNITY INTELLIGENCE
            </span>

            <h2 id="fuel-price-title">
              FUEL <span>PRICE</span>
            </h2>

            <p>
              Help fellow riders plan better journeys with
              current fuel prices reported by the tribe.
            </p>
          </div>

          <div
            className="fuel-live-indicator"
            aria-label="Community fuel price updates are active"
          >
            <span
              className="fuel-live-dot"
              aria-hidden="true"
            />

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
                  <label htmlFor="fuel-state">
                    STATE
                  </label>

                  <select
                    id="fuel-state"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                  >
                    <option value="Andhra Pradesh">
                      Andhra Pradesh
                    </option>
                    <option value="Telangana">
                      Telangana
                    </option>
                    <option value="Karnataka">
                      Karnataka
                    </option>
                    <option value="Tamil Nadu">
                      Tamil Nadu
                    </option>
                    <option value="Maharashtra">
                      Maharashtra
                    </option>
                    <option value="Kerala">
                      Kerala
                    </option>
                  </select>
                </div>

                <div className="fuel-field">
                  <label htmlFor="fuel-city">
                    CITY / AREA *
                  </label>

                  <input
                    id="fuel-city"
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="e.g. Kurnool"
                    autoComplete="address-level2"
                    maxLength={80}
                    required
                  />
                </div>
              </div>

              <div className="fuel-field">
                <label htmlFor="fuel-station">
                  FUEL STATION *
                </label>

                <input
                  id="fuel-station"
                  type="text"
                  name="station"
                  value={form.station}
                  onChange={handleChange}
                  placeholder="Enter station name"
                  maxLength={100}
                  required
                />
              </div>

              <div className="fuel-form-row">
                <div className="fuel-field">
                  <label htmlFor="fuel-type">
                    FUEL TYPE
                  </label>

                  <select
                    id="fuel-type"
                    name="fuelType"
                    value={form.fuelType}
                    onChange={handleChange}
                  >
                    <option value="Petrol">
                      Petrol
                    </option>
                    <option value="Diesel">
                      Diesel
                    </option>
                  </select>
                </div>

                <div className="fuel-field">
                  <label htmlFor="fuel-price">
                    PRICE / LITRE *
                  </label>

                  <div className="fuel-price-input">
                    <span aria-hidden="true">₹</span>

                    <input
                      id="fuel-price"
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      min="1"
                      max="300"
                      step="0.01"
                      inputMode="decimal"
                      required
                    />
                  </div>
                </div>
              </div>

              {message && (
                <div
                  className={`fuel-message ${messageType}`}
                  role="alert"
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="fuel-submit-btn"
              >
                SUBMIT PRICE
                <span aria-hidden="true">→</span>
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
                <p>
                  Compare prices along your route
                </p>
              </div>

              <div>
                <span>02</span>
                <p>
                  Estimate your fuel budget
                </p>
              </div>

              <div>
                <span>03</span>
                <p>
                  Help other riders plan better
                </p>
              </div>
            </div>

            <div className="fuel-disclaimer">
              <span aria-hidden="true">ⓘ</span>

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

              <h3>RECENT FUEL PRICES</h3>
            </div>

            <button
              type="button"
              className="fuel-reset-btn"
              onClick={resetPrices}
            >
              RESET DEMO DATA
            </button>
          </div>

          {/* FILTERS */}
          <div className="fuel-toolbar">
            <div
              className="fuel-filters"
              aria-label="Fuel type filters"
            >
              {["ALL", "Petrol", "Diesel"].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={
                    filter === type ? "active" : ""
                  }
                  onClick={() => setFilter(type)}
                  aria-pressed={filter === type}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="fuel-search-wrapper">
              <label
                htmlFor="fuel-search"
                className="fuel-search-label"
              >
                SEARCH
              </label>

              <input
                id="fuel-search"
                className="fuel-search"
                type="search"
                placeholder="Station or location..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>
          </div>

          {/* REPORT CARDS */}
          <div className="fuel-report-list">
            {filteredPrices.length > 0 ? (
              filteredPrices.map((item) => (
                <div
                  className="fuel-report-card"
                  key={item.id}
                >
                  <div
                    className="fuel-report-icon"
                    aria-hidden="true"
                  >
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