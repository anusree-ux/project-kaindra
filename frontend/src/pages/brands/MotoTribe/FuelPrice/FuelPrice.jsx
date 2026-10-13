import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import apiClient from "../../../../services/apiClient";
import "./FuelPrice.css";

const initialForm = {
  state: "Andhra Pradesh",
  city: "",
  station: "",
  fuelType: "Petrol",
  price: "",
};

function FuelPrice() {
  const { isAuthenticated, openAuthModal, user } = useAuth();
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const fetchFuelPrices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/mototribe/fuel-prices/submissions");
      const list = res.data.data?.submissions || [];
      const formatted = list.map((item) => ({
        id: item._id || item.id,
        station: item.station || "Fuel Station",
        location: item.location || item.city || "Highway",
        fuelType: item.fuelType ? (item.fuelType.charAt(0).toUpperCase() + item.fuelType.slice(1)) : "Petrol",
        price: Number(item.pricePerLiter || item.price || 0),
        state: item.state || "India",
        submittedBy: item.userId?.name || "Verified Rider",
        time: item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Recent",
      }));
      setPrices(formatted);
    } catch (err) {
      console.error("Error fetching fuel prices from DB:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFuelPrices();
  }, [fetchFuelPrices]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    if (!form.city.trim() || !form.station.trim() || !form.price) {
      setMessage("Please fill all required fields");
      setMessageType("error");
      return;
    }

    const priceValue = parseFloat(form.price);
    if (isNaN(priceValue) || priceValue <= 0 || priceValue > 300) {
      setMessage("Please enter a valid price between ₹1 and ₹300");
      setMessageType("error");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      await apiClient.post("/api/mototribe/fuel-prices", {
        state: form.state,
        fuelType: form.fuelType.toLowerCase(),
        pricePerLiter: priceValue,
        station: form.station.trim(),
        location: form.city.trim(),
      });

      setMessage("Fuel price submitted directly to the database!");
      setMessageType("success");
      setForm(initialForm);
      await fetchFuelPrices();
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to submit fuel price to database.";
      setMessage(errMsg);
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPrices = useMemo(() => {
    return prices.filter((item) => {
      const matchesType =
        filter === "ALL" ||
        item.fuelType.toLowerCase() === filter.toLowerCase();

      const normalizedSearch = search.trim().toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        item.station.toLowerCase().includes(normalizedSearch) ||
        item.location.toLowerCase().includes(normalizedSearch) ||
        item.state.toLowerCase().includes(normalizedSearch);

      return matchesType && matchesSearch;
    });
  }, [filter, prices, search]);

  return (
    <section
      className="fuel-price-section"
      id="fuel-intelligence"
    >
      <div className="fuel-price-container">
        {/* HEADER */}
        <div className="fuel-price-header">
          <span className="fuel-price-eyebrow">
            COMMUNITY INTELLIGENCE
          </span>

          <h2>COMMUNITY FUEL PRICES</h2>

          <p>
            Real-time, rider-reported fuel prices across
            highways, fuel stations, and regional riding
            routes.
          </p>
        </div>

        {/* MAIN GRID */}
        <div className="fuel-price-grid">
          {/* FORM */}
          <div className="fuel-form-card">
            <span className="fuel-card-number">01</span>

            <h3>REPORT FUEL PRICE</h3>

            <p>
              Contribute verified fuel prices to help fellow
              riders estimate route expenses.
            </p>

            <form
              className="fuel-form"
              onSubmit={handleSubmit}
            >
              <div className="fuel-form-row">
                <div className="fuel-field">
                  <label htmlFor="fuel-state">
                    STATE *
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
                    <option value="Delhi">
                      Delhi
                    </option>
                    <option value="Goa">
                      Goa
                    </option>
                    <option value="Rajasthan">
                      Rajasthan
                    </option>
                    <option value="Himachal Pradesh">
                      Himachal Pradesh
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
                disabled={submitting}
                className="fuel-submit-btn"
              >
                {submitting ? "SUBMITTING..." : "SUBMIT PRICE"}
                <span aria-hidden="true"> →</span>
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
              Fuel prices change across state borders and highway corridors.
              Live rider reports help the community accurately calculate
              journey budgets.
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
              <span aria-hidden="true">ℹ️</span>

              Live prices directly synchronized from community submissions in MongoDB.
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
              onClick={fetchFuelPrices}
            >
              REFRESH PRICES
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
            {loading ? (
              <div className="fuel-empty">
                Loading fuel price reports from database...
              </div>
            ) : filteredPrices.length > 0 ? (
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
                      {item.submittedBy} • {item.time}
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
                No fuel price reports found in the database. Be the first to report one!
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default FuelPrice;
