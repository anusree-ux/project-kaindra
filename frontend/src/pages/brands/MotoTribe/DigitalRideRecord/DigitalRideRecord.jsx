import { useEffect, useMemo, useState } from "react";
import "./DigitalRideRecord.css";

const demoRecords = [
  {
    id: 1,
    title: "Araku Valley Escape",
    route: "Visakhapatnam → Araku Valley",
    date: "2026-08-28",
    vehicle: "Royal Enfield Himalayan",
    rideType: "ADVENTURE",
    distance: 286,
    duration: "6h 42m",
    fuel: 8.4,
    mileage: 34,
    plannedBudget: 3200,
    actualExpense: 2860,
    stops: 5,
    rating: 4.8,
    privacy: "CONNECTIONS",
    weather: "Clear",
    roadCondition: "Good",
    notes:
      "Beautiful mountain ride with excellent roads and several scenic stops.",
    plannedDistance: 278,
    status: "COMPLETED",
    guideReady: true,
  },
  {
    id: 2,
    title: "Nandi Hills Sunrise",
    route: "Bengaluru → Nandi Hills",
    date: "2026-08-16",
    vehicle: "KTM Adventure 390",
    rideType: "TOURING",
    distance: 148,
    duration: "3h 18m",
    fuel: 4.2,
    mileage: 35,
    plannedBudget: 1800,
    actualExpense: 1640,
    stops: 3,
    rating: 4.6,
    privacy: "COMMUNITY",
    weather: "Cloudy",
    roadCondition: "Moderate",
    notes:
      "Early morning ride. Great sunrise viewpoint and light traffic.",
    plannedDistance: 152,
    status: "COMPLETED",
    guideReady: true,
  },
  {
    id: 3,
    title: "Coastal Weekend",
    route: "Chennai → Pondicherry",
    date: "2026-08-05",
    vehicle: "Triumph Speed 400",
    rideType: "CRUISER",
    distance: 184,
    duration: "4h 05m",
    fuel: 5.1,
    mileage: 36,
    plannedBudget: 2400,
    actualExpense: 2510,
    stops: 4,
    rating: 4.4,
    privacy: "PRIVATE",
    weather: "Sunny",
    roadCondition: "Good",
    notes:
      "Relaxed coastal ride with multiple food and photography stops.",
    plannedDistance: 180,
    status: "COMPLETED",
    guideReady: false,
  },
];

function DigitalRideRecord() {
  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem("mototribeRideRecords");

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return demoRecords;
      }
    }

    return demoRecords;
  });

  const [selectedId, setSelectedId] = useState(records[0]?.id);
  const [filter, setFilter] = useState("ALL");
  const [guideMessage, setGuideMessage] = useState("");

  useEffect(() => {
    localStorage.setItem(
      "mototribeRideRecords",
      JSON.stringify(records)
    );
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (filter === "ALL") {
      return records;
    }

    return records.filter(
      (record) => record.rideType === filter
    );
  }, [records, filter]);

  const selectedRide =
    records.find((record) => record.id === selectedId) ||
    filteredRecords[0];



  const totalDistance = records.reduce(
    (sum, ride) => sum + ride.distance,
    0
  );

  const totalRides = records.length;

  const averageRating =
    records.length > 0
      ? (
          records.reduce((sum, ride) => sum + ride.rating, 0) /
          records.length
        ).toFixed(1)
      : "0.0";

  const totalFuel = records.reduce(
    (sum, ride) => sum + ride.fuel,
    0
  );

  const handleGuide = () => {
    if (!selectedRide) return;

    setRecords((current) =>
      current.map((ride) =>
        ride.id === selectedRide.id
          ? { ...ride, guideReady: true }
          : ride
      )
    );

    setGuideMessage(
      `"${selectedRide.title}" is ready to become a community guide.`
    );

    setTimeout(() => {
      setGuideMessage("");
    }, 3500);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (!selectedRide) {
    return (
      <section
        className="digital-record-section"
        id="ride-record"
      >
        <div className="record-empty">
          <span>NO RIDE RECORDS</span>
          <h2>Your completed rides will appear here.</h2>
        </div>
      </section>
    );
  }

  return (
    <section
      className="digital-record-section"
      id="ride-record"
    >
      <div className="record-container">

        {/* HEADER */}
        <div className="record-heading">
          <div>
            <span className="record-eyebrow">
              DIGITAL RIDE RECORD
            </span>

            <h2>
              Every ride.
              <br />
              <strong>Never forgotten.</strong>
            </h2>

            <p>
              MotoTribe turns every completed journey into a
              structured riding memory.
            </p>
          </div>

          <div className="record-status">
            <span className="status-dot"></span>
            RIDING IDENTITY ACTIVE
          </div>
        </div>

        {/* STATS */}
        <div className="record-stats">

          <div className="record-stat">
            <span>RIDES</span>
            <strong>{totalRides}</strong>
            <small>COMPLETED</small>
          </div>

          <div className="record-stat">
            <span>DISTANCE</span>
            <strong>{totalDistance}</strong>
            <small>KM TOTAL</small>
          </div>

          <div className="record-stat">
            <span>FUEL</span>
            <strong>{totalFuel.toFixed(1)}</strong>
            <small>LITRES</small>
          </div>

          <div className="record-stat">
            <span>RATING</span>
            <strong>{averageRating}</strong>
            <small>AVERAGE</small>
          </div>

        </div>

        {/* FILTERS */}
        <div className="record-toolbar">

          <div className="record-filters">

            {["ALL", "ADVENTURE", "TOURING", "CRUISER"].map(
              (type) => (
                <button
                  key={type}
                  className={
                    filter === type ? "active" : ""
                  }
                  onClick={() => setFilter(type)}
                >
                  {type}
                </button>
              )
            )}

          </div>

          <span className="record-count">
            {filteredRecords.length} RECORD
            {filteredRecords.length !== 1 ? "S" : ""}
          </span>

        </div>

        {/* MAIN GRID */}
        <div className="record-grid">

          {/* HISTORY */}
          <aside className="record-history">

            <div className="history-title">
              <span>RIDE JOURNAL</span>
              <small>RECENT</small>
            </div>

            <div className="history-list">

              {filteredRecords.map((ride) => (
                <button
                  key={ride.id}
                  className={`history-card ${
                    selectedRide.id === ride.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => setSelectedId(ride.id)}
                >
                  <div className="history-date">
                    {formatDate(ride.date)}
                  </div>

                  <h3>{ride.title}</h3>

                  <p>{ride.route}</p>

                  <div className="history-meta">
                    <span>{ride.distance} KM</span>
                    <span>{ride.duration}</span>
                  </div>

                  <div className="history-type">
                    {ride.rideType}
                  </div>
                </button>
              ))}

            </div>

          </aside>

          {/* DETAIL */}
          <article className="record-detail">

            <div className="detail-top">

              <div>
                <span className="detail-label">
                  COMPLETED RIDE
                </span>

                <h1>{selectedRide.title}</h1>

                <p>{selectedRide.route}</p>
              </div>

              <div className="completed-badge">
                ✓ COMPLETED
              </div>

            </div>

            {/* ROUTE */}
            <div className="route-card">

              <div className="route-line">
                <span className="route-point start"></span>

                <div className="route-path">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <span className="route-point end"></span>
              </div>

              <div className="route-labels">
                <span>START</span>
                <strong>
                  {selectedRide.plannedDistance} KM
                  PLANNED
                </strong>
                <span>DESTINATION</span>
              </div>

            </div>

            {/* RIDE METRICS */}
            <div className="detail-metrics">

              <div>
                <span>DISTANCE</span>
                <strong>
                  {selectedRide.distance}
                  <small> KM</small>
                </strong>
              </div>

              <div>
                <span>DURATION</span>
                <strong>
                  {selectedRide.duration}
                </strong>
              </div>

              <div>
                <span>FUEL USED</span>
                <strong>
                  {selectedRide.fuel}
                  <small> L</small>
                </strong>
              </div>

              <div>
                <span>MILEAGE</span>
                <strong>
                  {selectedRide.mileage}
                  <small> KM/L</small>
                </strong>
              </div>

              <div>
                <span>STOPS</span>
                <strong>
                  {selectedRide.stops}
                </strong>
              </div>

              <div>
                <span>RATING</span>
                <strong>
                  ★ {selectedRide.rating}
                </strong>
              </div>

            </div>

            {/* PLANNED VS ACTUAL */}
            <div className="comparison-card">

              <div className="comparison-header">
                <div>
                  <span>JOURNEY ANALYSIS</span>
                  <h3>Planned vs Actual</h3>
                </div>

                <span className="analysis-tag">
                  RIDE DATA
                </span>
              </div>

              <div className="comparison-row">

                <div>
                  <span>PLANNED DISTANCE</span>
                  <strong>
                    {selectedRide.plannedDistance} KM
                  </strong>
                </div>

                <div className="comparison-arrow">
                  →
                </div>

                <div>
                  <span>ACTUAL DISTANCE</span>
                  <strong>
                    {selectedRide.distance} KM
                  </strong>
                </div>

              </div>

              <div className="distance-difference">
                {selectedRide.distance -
                  selectedRide.plannedDistance >=
                0
                  ? "+"
                  : ""}
                {(
                  selectedRide.distance -
                  selectedRide.plannedDistance
                ).toFixed(0)}
                {" KM "}
                difference
              </div>

            </div>

            {/* EXPENSE */}
            <div className="expense-card">

              <div>
                <span>BUDGET</span>
                <strong>
                  ₹
                  {selectedRide.plannedBudget.toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>

              <div className="expense-divider"></div>

              <div>
                <span>ACTUAL</span>
                <strong>
                  ₹
                  {selectedRide.actualExpense.toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>

              <div className="expense-result">
                {selectedRide.actualExpense <=
                selectedRide.plannedBudget
                  ? "UNDER BUDGET"
                  : "OVER BUDGET"}
              </div>

            </div>

            {/* RIDE CONDITIONS */}
            <div className="condition-grid">

              <div>
                <span>WEATHER</span>
                <strong>
                  {selectedRide.weather}
                </strong>
              </div>

              <div>
                <span>ROAD CONDITION</span>
                <strong>
                  {selectedRide.roadCondition}
                </strong>
              </div>

              <div>
                <span>MOTORCYCLE</span>
                <strong>
                  {selectedRide.vehicle}
                </strong>
              </div>

              <div>
                <span>PRIVACY</span>
                <strong>
                  {selectedRide.privacy}
                </strong>
              </div>

            </div>

            {/* NOTES */}
            <div className="notes-card">

              <span>RIDER NOTES</span>

              <p>
                “{selectedRide.notes}”
              </p>

            </div>

            {/* MEMORIES */}
            <div className="memory-card">

              <div>
                <span>RIDE MEMORY</span>
                <h3>Capture the journey</h3>
              </div>

              <div className="memory-placeholders">
                <div>PHOTO</div>
                <div>VIDEO</div>
                <div>NOTE</div>
                <div>ROUTE</div>
              </div>

            </div>

            {/* GUIDE */}
            <div className="guide-card">

              <div>
                <span>COMMUNITY KNOWLEDGE</span>

                <h3>
                  Help the next rider.
                </h3>

                <p>
                  Turn your experience into a guide
                  containing road conditions, stops,
                  warnings and useful riding tips.
                </p>
              </div>

              <button onClick={handleGuide}>
                {selectedRide.guideReady
                  ? "✓ GUIDE READY"
                  : "TURN INTO GUIDE"}
              </button>

            </div>

            {guideMessage && (
              <div className="guide-message">
                {guideMessage}
              </div>
            )}

          </article>

        </div>

      </div>
    </section>
  );
}

export default DigitalRideRecord;