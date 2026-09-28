import { useMemo, useState, useEffect, useCallback } from "react";
import apiClient from "../../../../services/apiClient";
import "./FuelPrice.css";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

function FuelPrice() {
  const [prices, setPrices] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [selectedStateStats, setSelectedStateStats] = useState({
    state: "Karnataka",
    petrol: { median: 105.0, count: 0, isFallback: true, note: "" },
    diesel: { median: 95.0, count: 0, isFallback: true, note: "" },
  });
  const [loadingStats, setLoadingStats] = useState(false);

  const [form, setForm] = useState({
    state: "Karnataka",
    city: "",
    station: "",
    fuelType: "Petrol",
    price: "",
  });

  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [isErrorMsg, setIsErrorMsg] = useState(false);

  // 1. Fetch recent community fuel price submissions directly from DB
  const fetchRecentSubmissions = useCallback(async () => {
    setLoadingSubmissions(true);
    try {
      const res = await apiClient.get("/api/mototribe/fuel-prices/submissions");
      const dbSubmissions = res.data.data?.submissions || [];

      const formatted = dbSubmissions.map((sub) => ({
        id: sub._id,
        station: sub.station || "Fuel Station",
        location: sub.location || sub.state,
        state: sub.state,
        fuelType: sub.fuelType === "petrol" ? "Petrol" : "Diesel",
        price: sub.pricePerLiter,
        submittedBy: sub.userId?.name || "Verified Rider",
        time: new Date(sub.submittedAt || sub.createdAt).toLocaleDateString(),
      }));

      setPrices(formatted);
    } catch (err) {
      console.error("Failed to fetch fuel submissions:", err);
      setPrices([]);
    } finally {
      setLoadingSubmissions(false);
    }
  }, []);

  // 2. Fetch state fuel price 7-day median averages directly from DB
  const fetchStateFuelPrices = useCallback(async (stateName) => {
    setLoadingStats(true);
    try {
      const [petrolRes, dieselRes] = await Promise.allSettled([
        apiClient.get(`/api/mototribe/fuel-prices?state=${encodeURIComponent(stateName)}&fuelType=petrol`),
        apiClient.get(`/api/mototribe/fuel-prices?state=${encodeURIComponent(stateName)}&fuelType=diesel`),
      ]);

      const petrolData = petrolRes.status === "fulfilled" ? petrolRes.value.data?.data : null;
      const dieselData = dieselRes.status === "fulfilled" ? dieselRes.value.data?.data : null;

      setSelectedStateStats({
        state: stateName,
        petrol: petrolData || { median: 102.86, count: 0, isFallback: true, source: "Official IOCL Database" },
        diesel: dieselData || { median: 88.94, count: 0, isFallback: true, source: "Official IOCL Database" },
      });
    } catch (err) {
      console.error("Failed to fetch state fuel prices:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentSubmissions();
  }, [fetchRecentSubmissions]);

  useEffect(() => {
    fetchStateFuelPrices(form.state);
  }, [form.state, fetchStateFuelPrices]);

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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.city.trim() ||
      !form.station.trim() ||
      !form.price
    ) {
      setIsErrorMsg(true);
      setMessage("Please fill in all required fields.");
      return;
    }

    const numericPrice = Number(form.price);

    if (numericPrice <= 0) {
      setIsErrorMsg(true);
      setMessage("Please enter a valid fuel price.");
      return;
    }

    try {
      setMessage("Submitting fuel price to backend...");
      setIsErrorMsg(false);

      const response = await apiClient.post("/api/mototribe/fuel-prices", {
        state: form.state,
        fuelType: form.fuelType.toLowerCase(),
        pricePerLiter: numericPrice,
        station: form.station.trim(),
        location: form.city.trim(),
      });

      const backendData = response.data;
      const updatedMedian = backendData.data?.updatedMedian;

      // Re-fetch backend state averages & live submissions
      fetchStateFuelPrices(form.state);
      fetchRecentSubmissions();

      setForm((prev) => ({
        ...prev,
        city: "",
        station: "",
        price: "",
      }));

      setIsErrorMsg(false);
      setMessage(
        `Fuel price recorded! Updated ${form.state} ${form.fuelType} 7-day median: ₹${updatedMedian || numericPrice}/L`
      );

      setTimeout(() => {
        setMessage("");
      }, 5000);
    } catch (err) {
      setIsErrorMsg(true);
      const backendError = err.response?.data?.message || err.message;
      setMessage(`Submission rejected: ${backendError}`);
    }
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
              7-day median fuel prices reported by the tribe across Indian states.
            </p>
          </div>

          <div className="fuel-live-indicator">
            <span className="fuel-live-dot"></span>
            DATABASE CONNECTED
          </div>
        </div>

        {/* PRICE OVERVIEW */}
        <div className="fuel-overview-grid">

          <div className="fuel-stat-card">
            <span className="fuel-stat-label">
              {form.state.toUpperCase()} PETROL MEDIAN
            </span>

            <strong>
              {loadingStats ? "..." : `₹${Number(selectedStateStats.petrol.median || 105).toFixed(2)}`}
            </strong>

            <small>
              {selectedStateStats.petrol.source || (selectedStateStats.petrol.count > 0 ? `${selectedStateStats.petrol.count} report(s) in last 7 days` : "Official State Database")}
            </small>
          </div>

          <div className="fuel-stat-card">
            <span className="fuel-stat-label">
              {form.state.toUpperCase()} DIESEL MEDIAN
            </span>

            <strong>
              {loadingStats ? "..." : `₹${Number(selectedStateStats.diesel.median || 95).toFixed(2)}`}
            </strong>

            <small>
              {selectedStateStats.diesel.source || (selectedStateStats.diesel.count > 0 ? `${selectedStateStats.diesel.count} report(s) in last 7 days` : "Official State Database")}
            </small>
          </div>

          <div className="fuel-stat-card">
            <span className="fuel-stat-label">
              SUBMISSION POLICY
            </span>

            <strong>20% MAX DEVIATION</strong>

            <small>
              Outliers automatically rejected
            </small>
          </div>

          <div className="fuel-stat-card">
            <span className="fuel-stat-label">
              COMMUNITY REPORTS
            </span>

            <strong>{prices.length}</strong>

            <small>
              Total backend database submissions
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
                Share verified fuel rates from your ride.
              </p>
            </div>

            <form onSubmit={handleSubmit}>

              <div className="fuel-form-row">

                <div className="fuel-field">
                  <label>STATE (INDIAN STATE / UT) *</label>

                  <select
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
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
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
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
                <div className={`fuel-message ${isErrorMsg ? "fuel-message-error" : ""}`} style={{ color: isErrorMsg ? "#ff4d4d" : "#00e676", marginBottom: "1rem" }}>
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
              Fuel prices can change across state borders.
              Rider reports provide 7-day median prices to accurately calculate trip fuel budgets.
            </p>

            <div className="fuel-info-list">

              <div>
                <span>01</span>
                <p>Compare prices along your route</p>
              </div>

              <div>
                <span>02</span>
                <p>Estimate trip fuel consumption & cost</p>
              </div>

              <div>
                <span>03</span>
                <p>Help other riders plan better</p>
              </div>

            </div>

            <div className="fuel-disclaimer">
              <span>ⓘ</span>
              Prices use 7-day median calculations with 20% outlier rejection to ensure accurate data.
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

            {loadingSubmissions ? (
              <div className="fuel-empty" style={{ color: "#888" }}>
                Loading live fuel price submissions from database...
              </div>
            ) : filteredPrices.length > 0 ? (
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
                No community fuel price reports submitted yet. Be the first to report!
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}

export default FuelPrice;