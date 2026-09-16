import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../../../../context/AuthContext";
import apiClient from "../../../../services/apiClient";
import "./DigitalRideRecord.css";

function DigitalRideRecord() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [records, setRecords] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [guideMessage, setGuideMessage] = useState("");
  const [passportStats, setPassportStats] = useState(null);

  // 1. Fetch live passport, completed ride history & journals from database
  const fetchDigitalRecordData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {

      const [passportRes, historyRes, journalRes] = await Promise.allSettled([
        apiClient.get("/api/mototribe/rider-profile/me/passport"),
        apiClient.get("/api/mototribe/rider-profile/me/history"),
        apiClient.get("/api/mototribe/rider-profile/me/journal"),
      ]);

      if (passportRes.status === "fulfilled") {
        setPassportStats(passportRes.value.data?.data?.profile || null);
      }

      const historyList = historyRes.status === "fulfilled" ? historyRes.value.data?.data?.rides || [] : [];
      const journalList = journalRes.status === "fulfilled" ? journalRes.value.data?.data?.journals || [] : [];

      const journalMap = new Map();
      journalList.forEach((j) => {
        if (j.rideId) {
          journalMap.set(String(j.rideId._id || j.rideId), j);
        }
      });

      if (historyList.length > 0) {
        const formatted = historyList.map((ride, idx) => {
          const jEntry = journalMap.get(String(ride._id)) || {};
          const dist = ride.distanceKm || 150;
          const mileageVal = 32;
          const fuelUsed = Number((dist / mileageVal).toFixed(1));
          const dateStr = ride.startDate ? ride.startDate.substring(0, 10) : new Date().toISOString().substring(0, 10);

          return {
            id: ride._id || `ride-${idx}`,
            title: ride.title || `${ride.origin} to ${ride.destination}`,
            route: `${ride.origin || "Origin"} → ${ride.destination || "Destination"}`,
            date: dateStr,
            vehicle: ride.vehicleId ? `${ride.vehicleId.make || ""} ${ride.vehicleId.model || ""}`.trim() : "My Motorcycle",
            rideType: "ADVENTURE",
            distance: dist,
            duration: `${Math.floor(dist / 45)}h ${(dist % 45) * 1.2 | 0}m`,
            fuel: fuelUsed,
            mileage: mileageVal,
            plannedBudget: ride.budget || 3000,
            actualExpense: jEntry.expenses ? jEntry.expenses.reduce((s, e) => s + (e.amount || 0), 0) : (ride.budget || 2800),
            stops: jEntry.photos ? jEntry.photos.length + 2 : 3,
            rating: jEntry.rating || 4.8,
            privacy: jEntry.visibility ? jEntry.visibility.toUpperCase() : "CONNECTIONS",
            weather: jEntry.weather || "Clear",
            roadCondition: jEntry.roadCondition || "Good",
            notes: jEntry.notes || `Completed journey from ${ride.origin} to ${ride.destination}.`,
            plannedDistance: Math.max(50, dist - 10),
            status: "COMPLETED",
            guideReady: false,
          };
        });

        setRecords(formatted);
        setSelectedId(formatted[0].id);
      } else {
        setRecords([]);
        setSelectedId(null);
      }
    } catch (err) {
      console.error("Error fetching DigitalRideRecord backend data:", err);
    }
  }, []);

  useEffect(() => {
    fetchDigitalRecordData();
  }, [fetchDigitalRecordData]);

  const filteredRecords = useMemo(() => {
    if (filter === "ALL") {
      return records;
    }

    return records.filter(
      (record) => record.rideType === filter
    );
  }, [records, filter]);

  const selectedRide = useMemo(() => {
    return records.find((record) => record.id === selectedId) || filteredRecords[0] || null;
  }, [records, selectedId, filteredRecords]);

  const totalDistance = passportStats?.totalDistanceKm || records.reduce(
    (sum, ride) => sum + ride.distance,
    0
  );

  const totalRides = passportStats?.totalRidesCompleted || records.length;

  const averageRating =
    records.length > 0
      ? (
          records.reduce((sum, ride) => sum + (ride.rating || 4.8), 0) /
          records.length
        ).toFixed(1)
      : "4.8";

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
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

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

        {!isAuthenticated ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px dashed rgba(212, 160, 62, 0.3)",
              borderRadius: "12px",
              margin: "40px 0",
            }}
          >
            <div style={{ fontSize: "36px", marginBottom: "16px" }}>🔒</div>
            <h3 style={{ fontSize: "16px", fontWeight: "800", letterSpacing: "2px", color: "#d4a03e", marginBottom: "8px" }}>
              AUTHENTICATION REQUIRED
            </h3>
            <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)", maxWidth: "480px", margin: "0 auto 20px" }}>
              Please log in to view your digital ride record, completed journey statistics, fuel usage, and ride passport history.
            </p>
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              style={{
                padding: "12px 28px",
                background: "linear-gradient(135deg, #d4a03e 0%, #b88328 100%)",
                color: "#07080a",
                fontWeight: "800",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                letterSpacing: "1.5px",
                fontSize: "12px",
              }}
            >
              LOGIN / SIGN UP TO UNLOCK
            </button>
          </div>
        ) : (
          <>
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

        {!selectedRide ? (
          <div
            style={{
              padding: "50px 20px",
              textAlign: "center",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px dashed rgba(255, 255, 255, 0.15)",
              borderRadius: "8px",
              margin: "20px 0",
              color: "rgba(255, 255, 255, 0.7)",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "10px" }}>📖</div>
            <h3 style={{ fontSize: "15px", letterSpacing: "1px", color: "#fff", marginBottom: "6px" }}>
              NO COMPLETED RIDE RECORDS IN DATABASE
            </h3>
            <p style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)", maxWidth: "500px", margin: "0 auto" }}>
              Complete a ride from your upcoming rides network to automatically record your digital ride history, expenses, and passport badges!
            </p>
          </div>
        ) : (
          /* MAIN GRID */
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
        )}
        </>
        )}
      </div>
    </section>

  );
}

export default DigitalRideRecord;